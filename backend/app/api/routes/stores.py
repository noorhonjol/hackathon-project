"""Store registration and lookup endpoints for Qoffa."""

from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlmodel import Session, select

from app.core.auth import get_current_user
from app.db.session import get_session
from app.models.profile import Profile
from app.models.store import Store

router = APIRouter(prefix="/stores", tags=["stores"])


# ── Schemas ──────────────────────────────────────────────────────────────────

class StoreResponse(BaseModel):
    id: str
    owner_id: str
    name: str
    qr_code: str
    bags_avoided_count: int
    points_total: int


class CreateStoreRequest(BaseModel):
    name: str


# ── Helpers ──────────────────────────────────────────────────────────────────

def _store_to_response(s: Store) -> StoreResponse:
    return StoreResponse(
        id=str(s.id),
        owner_id=str(s.owner_id),
        name=s.name,
        qr_code=s.qr_code,
        bags_avoided_count=s.bags_avoided_count,
        points_total=s.points_total,
    )


def _require_store_owner(
    current_user: dict,
    session: Session,
) -> Profile:
    """Check the current user has role 'store_owner' and return their profile."""
    profile = session.exec(
        select(Profile).where(Profile.id == current_user["id"])
    ).first()

    if not profile or profile.role != "store_owner":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only store owners can access this endpoint",
        )
    return profile


# ── Endpoints ────────────────────────────────────────────────────────────────

@router.post("", response_model=StoreResponse, status_code=status.HTTP_201_CREATED)
def create_store(
    body: CreateStoreRequest,
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> StoreResponse:
    """Register a new store for the current store_owner."""
    profile = _require_store_owner(current_user, session)

    # Check if they already registered
    existing = session.exec(
        select(Store).where(Store.owner_id == profile.id)
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You already have a registered store",
        )

    store = Store(
        owner_id=str(profile.id),
        name=body.name,
        qr_code=str(uuid4()),
    )
    session.add(store)
    session.commit()
    session.refresh(store)

    return _store_to_response(store)


@router.get("/me", response_model=StoreResponse)
def get_my_store(
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> StoreResponse:
    """Return the current store_owner's store."""
    profile = _require_store_owner(current_user, session)

    store = session.exec(
        select(Store).where(Store.owner_id == profile.id)
    ).first()

    if store is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="You haven't registered a store yet",
        )

    return _store_to_response(store)