from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlmodel import Session, select

from app.core.auth import get_current_user
from app.db.session import get_session
from app.models.profile import Profile

router = APIRouter(prefix="/profile", tags=["profile"])


# ── Schemas ──────────────────────────────────────────────────────────────────

class ProfileResponse(BaseModel):
    id: str
    role: str | None
    display_name: str | None
    points_total: int


class PatchRoleRequest(BaseModel):
    role: str  # "citizen" | "store_owner"
    display_name: str


# ── Helpers ──────────────────────────────────────────────────────────────────

def _profile_to_response(p: Profile) -> ProfileResponse:
    return ProfileResponse(
        id=str(p.id),
        role=p.role,
        display_name=p.display_name,
        points_total=p.points_total,
    )


# ── Endpoints ────────────────────────────────────────────────────────────────

@router.get("/me", response_model=ProfileResponse)
async def get_profile(
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> ProfileResponse:
    """Return the current user's profile."""
    user_id = current_user.get("id")
    profile = session.exec(select(Profile).where(Profile.id == user_id)).first()

    if profile is None:
        profile = Profile(id=user_id)
        session.add(profile)
        session.commit()
        session.refresh(profile)

    return _profile_to_response(profile)


class PatchRoleResponse(BaseModel):
    id: str
    role: str | None
    display_name: str | None
    points_total: int


@router.patch("/role", response_model=PatchRoleResponse)
async def update_role(
    body: PatchRoleRequest,
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> PatchRoleResponse:
    """Set the current user's role and display name."""
    if body.role not in ("citizen", "store_owner"):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Role must be 'citizen' or 'store_owner'",
        )

    user_id = current_user.get("id")
    profile = session.exec(select(Profile).where(Profile.id == user_id)).first()

    if profile is None:
        profile = Profile(id=user_id)

    profile.role = body.role
    profile.display_name = body.display_name

    session.add(profile)
    session.commit()
    session.refresh(profile)

    return PatchRoleResponse(
        id=str(profile.id),
        role=profile.role,
        display_name=profile.display_name,
        points_total=profile.points_total,
    )