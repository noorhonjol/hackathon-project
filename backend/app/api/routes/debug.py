"""Temporary debug endpoints for development.
Remove or disable before production.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlmodel import Session, select

from app.core.auth import get_current_user
from app.db.session import get_session
from app.models.profile import Profile
from app.services.points import award_points

router = APIRouter(prefix="/debug", tags=["debug"])


class TestAwardRequest(BaseModel):
    profile_id: str
    amount: int
    source: str = "report_approved"


class TestAwardResponse(BaseModel):
    awarded: int
    capped: bool


@router.post("/test-award", response_model=TestAwardResponse)
def test_award(
    body: TestAwardRequest,
    session: Session = Depends(get_session),
) -> TestAwardResponse:
    """Award points to a profile (debug only)."""
    result = award_points(
        session,
        profile_id=body.profile_id,
        amount=body.amount,
        source=body.source,
    )
    return TestAwardResponse(**result)


@router.post("/make-admin", status_code=status.HTTP_200_OK)
def make_admin(
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> dict:
    """Set the current user's role to 'admin' (debug only)."""
    user_id = current_user.get("id")
    profile = session.exec(select(Profile).where(Profile.id == user_id)).first()

    if profile is None:
        profile = Profile(id=user_id)

    profile.role = "admin"
    session.add(profile)
    session.commit()
    session.refresh(profile)

    return {"id": str(profile.id), "role": profile.role}