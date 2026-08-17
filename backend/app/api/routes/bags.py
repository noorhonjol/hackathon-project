"""Bag tracking endpoints — Qoffa reusable bag lifecycle."""

from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlmodel import Session, select

from app.core.auth import get_current_user
from app.db.session import get_session
from app.models.bag import Bag
from app.models.store import Store
from app.models.profile import Profile
from app.models.points_ledger import PointsLedger
from app.services.points import award_points

router = APIRouter(prefix="/bags", tags=["bags"])


class BagResponse(BaseModel):
    id: str
    qr_code: str
    current_location: str
    current_store_id: str | None
    current_user_id: str | None
    total_scans: int
    store_name: str | None = None


class BagListResponse(BaseModel):
    id: str
    qr_code: str
    current_location: str
    store_name: str | None = None


class ScanBagRequest(BaseModel):
    qr_code: str


class ScanBagResponse(BaseModel):
    success: bool
    bag_id: str
    current_location: str
    points_awarded: int
    message: str


def _bag_to_response(b: Bag) -> BagResponse:
    return BagResponse(
        id=str(b.id), qr_code=b.qr_code,
        current_location=b.current_location,
        current_store_id=str(b.current_store_id) if b.current_store_id else None,
        current_user_id=str(b.current_user_id) if b.current_user_id else None,
        total_scans=b.total_scans,
    )


@router.post("/create", response_model=BagResponse, status_code=201)
def create_bag(
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> BagResponse:
    """Admin only: create a new reusable bag with a unique QR code."""
    _require_admin(current_user, session)

    bag = Bag(qr_code=str(uuid4()))
    session.add(bag)
    session.commit()
    session.refresh(bag)
    return _bag_to_response(bag)


@router.post("/create-batch", response_model=list[BagResponse], status_code=201)
def create_bag_batch(
    count: int = 5,
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> list[BagResponse]:
    """Admin only: create multiple bags at once."""
    _require_admin(current_user, session)

    bags = []
    for _ in range(count):
        bag = Bag(qr_code=str(uuid4()))
        session.add(bag)
        bags.append(bag)
    session.commit()
    for b in bags:
        session.refresh(b)
    return [_bag_to_response(b) for b in bags]


def _require_admin(current_user: dict, session: Session) -> None:
    profile = session.exec(select(Profile).where(Profile.id == current_user["id"])).first()
    if not profile or profile.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")


@router.get("", response_model=list[BagResponse])
def list_bags(
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> list[BagResponse]:
    """List all bags (admin only)."""
    profile = session.exec(select(Profile).where(Profile.id == current_user["id"])).first()
    if not profile or profile.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    bags = session.exec(select(Bag).order_by(Bag.created_at.desc())).all()
    return [_bag_to_response(b) for b in bags]


@router.get("/available", response_model=list[BagListResponse])
def available_bags(
    session: Session = Depends(get_session),
) -> list[BagListResponse]:
    """List bags at stores that citizens can scan."""
    bags = session.exec(
        select(Bag).where(Bag.current_location == "store")
    ).all()
    result = []
    for b in bags:
        store_name = None
        if b.current_store_id:
            store = session.exec(select(Store).where(Store.id == b.current_store_id)).first()
            store_name = store.name if store else None
        result.append(BagListResponse(
            id=str(b.id), qr_code=b.qr_code,
            current_location=b.current_location,
            store_name=store_name,
        ))
    return result


@router.post("/scan", response_model=ScanBagResponse)
def scan_bag(
    body: ScanBagRequest,
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> ScanBagResponse:
    """Scan a bag's QR code. Validates bag exists and alternates store↔user."""
    profile = session.exec(select(Profile).where(Profile.id == current_user["id"])).first()
    if not profile:
        raise HTTPException(status_code=403, detail="Profile not found")

    # Look up bag by QR
    bag = session.exec(select(Bag).where(Bag.qr_code == body.qr_code)).first()
    if bag is None:
        raise HTTPException(status_code=404, detail="Bag not found — invalid QR code")

    role = profile.role
    points = 0
    message = ""

    # Validate the handoff based on bag's current location
    if role == "store_owner":
        # Store scans bag from user → bag returns to store
        if bag.current_location == "store":
            raise HTTPException(status_code=409, detail="This bag is already at a store")
        
        # Find the store
        store = session.exec(select(Store).where(Store.owner_id == profile.id)).first()
        if not store:
            raise HTTPException(status_code=404, detail="Register a store first")

        bag.current_location = "store"
        bag.current_store_id = str(store.id)
        bag.current_user_id = None
        message = f"Bag returned to {store.name}"

        # Add pending entry in store owner's history
        pending = PointsLedger(
            profile_id=str(profile.id),
            amount=0,
            source="store_scan_pending",
            reference_id=str(bag.id),
        )
        session.add(pending)

    elif role == "citizen":
        # Citizen scans bag from store → bag goes to citizen
        if bag.current_location == "user":
            raise HTTPException(status_code=409, detail="This bag is already with a user")

        bag.current_location = "user"
        bag.current_user_id = str(profile.id)

        # Award points to citizen AND the store (save store_id before clearing)
        store_id = bag.current_store_id
        bag.current_store_id = None
        # Award points to citizen (with daily cap)
        citizen_result = award_points(
            session, profile_id=str(profile.id),
            amount=10, source="store_scan",
            reference_id=str(bag.id),
        )
        points = citizen_result["awarded"]

        # Award points to store independently (no daily cap for stores)
        if store_id:
            award_points(
                session, store_id=str(store_id),
                amount=10, source="store_scan",
                reference_id=str(bag.id),
            )

        message = f"+{points} points for you! Store also earned."

    else:
        raise HTTPException(status_code=403, detail="Only stores and citizens can scan bags")

    bag.total_scans = (bag.total_scans or 0) + 1
    session.add(bag)
    session.commit()

    return ScanBagResponse(
        success=True, bag_id=str(bag.id),
        current_location=bag.current_location,
        points_awarded=points, message=message,
    )