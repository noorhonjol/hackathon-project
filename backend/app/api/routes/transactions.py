"""Transaction endpoints for Qoffa — store scans, etc."""

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlmodel import Session, select

from app.core.auth import get_current_user
from app.db.session import get_session
from app.models.profile import Profile
from app.models.store import Store
from app.models.points_ledger import PointsLedger
from app.services.points import award_points

router = APIRouter(prefix="/transactions", tags=["transactions"])


# ── Schemas ──────────────────────────────────────────────────────────────────

class ScanRequest(BaseModel):
    qr_code: str


class ScanResponse(BaseModel):
    success: bool
    points_awarded: int
    store_name: str
    capped: bool


# ── Helper ───────────────────────────────────────────────────────────────────

def _require_citizen(current_user: dict, session: Session) -> Profile:
    profile = session.exec(
        select(Profile).where(Profile.id == current_user["id"])
    ).first()

    if not profile or profile.role != "citizen":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only citizens can scan stores",
        )
    return profile


# ── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/scan", response_model=ScanResponse)
def scan_store(
    body: ScanRequest,
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> ScanResponse:
    """Scan a store's QR code to earn points for using a reusable bag."""
    citizen = _require_citizen(current_user, session)

    # 1. Look up store by QR code
    store = session.exec(
        select(Store).where(Store.qr_code == body.qr_code)
    ).first()

    if store is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Store not found — check the QR code and try again",
        )

    # 2. Check cooldown — has this citizen scanned this store in the last 10 min?
    cutoff = datetime.now(timezone.utc) - timedelta(minutes=10)
    recent_scan = session.exec(
        select(PointsLedger).where(
            PointsLedger.profile_id == str(citizen.id),
            PointsLedger.store_id == str(store.id),
            PointsLedger.source == "store_scan",
            PointsLedger.created_at >= cutoff,
        )
    ).first()

    if recent_scan is not None:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="You already scanned this store recently. Please wait a bit before scanning again.",
        )

    # 3. Award points
    result = award_points(
        session,
        profile_id=str(citizen.id),
        store_id=str(store.id),
        amount=10,
        source="store_scan",
        reference_id=str(store.id),
    )

    # 4. Increment bags_avoided_count (even if daily cap hit, the scan happened)
    store.bags_avoided_count = (store.bags_avoided_count or 0) + 1
    session.add(store)
    session.commit()

    return ScanResponse(
        success=result["awarded"] > 0,
        points_awarded=result["awarded"],
        store_name=store.name,
        capped=result["capped"],
    )