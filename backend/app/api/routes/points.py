"""Points history and leaderboard endpoints."""

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlmodel import Session, select, func, desc

from app.core.auth import get_current_user
from app.db.session import get_session
from app.models.profile import Profile
from app.models.store import Store
from app.models.points_ledger import PointsLedger
from app.models.bag import Bag

router = APIRouter(prefix="/points", tags=["points"])


SOURCE_LABELS = {
    "store_scan": "Reusable bag used",
    "report_approved": "Litter report approved",
    "report_cleaned": "Cleanup completed",
    "report_contribution": "Cleanup contribution",
    "store_scan_pending": "⏳ Bag sent — waiting for customer",
}


# ── Schemas ──────────────────────────────────────────────────────────────────

class HistoryEntry(BaseModel):
    id: str
    amount: int
    label: str
    source: str
    created_at: str


class CitizenLeaderboardEntry(BaseModel):
    rank: int
    id: str
    display_name: str | None
    points_total: int


class StoreLeaderboardEntry(BaseModel):
    rank: int
    id: str
    name: str
    points_total: int


# ── Endpoints ────────────────────────────────────────────────────────────────

@router.get("/history", response_model=list[HistoryEntry])
def get_points_history(
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> list[HistoryEntry]:
    """Return the current user's points ledger entries, most recent first."""
    entries = session.exec(
        select(PointsLedger)
        .where(PointsLedger.profile_id == current_user["id"])
        .order_by(PointsLedger.created_at.desc())
    ).all()

    return [
        HistoryEntry(
            id=str(e.id),
            amount=e.amount,
            label=SOURCE_LABELS.get(e.source, e.source),
            source=e.source,
            created_at=e.created_at.isoformat() if e.created_at else "",
        )
        for e in entries
    ]


@router.get("/leaderboard/citizens", response_model=list[CitizenLeaderboardEntry])
def leaderboard_citizens(
    session: Session = Depends(get_session),
) -> list[CitizenLeaderboardEntry]:
    """Top 10 citizens by points_total."""
    profiles = session.exec(
        select(Profile)
        .where(Profile.role == "citizen")
        .order_by(Profile.points_total.desc())
        .limit(10)
    ).all()

    return [
        CitizenLeaderboardEntry(
            rank=i + 1,
            id=str(p.id),
            display_name=p.display_name,
            points_total=p.points_total or 0,
        )
        for i, p in enumerate(profiles)
    ]


@router.get("/leaderboard/stores", response_model=list[StoreLeaderboardEntry])
def leaderboard_stores(
    session: Session = Depends(get_session),
) -> list[StoreLeaderboardEntry]:
    """Top 10 stores by points_total."""
    stores = session.exec(
        select(Store)
        .order_by(Store.points_total.desc())
        .limit(10)
    ).all()

    return [
        StoreLeaderboardEntry(
            rank=i + 1,
            id=str(s.id),
            name=s.name,
            points_total=s.points_total or 0,
        )
        for i, s in enumerate(stores)
    ]


@router.get("/leaderboard/stores/top5", response_model=list[StoreLeaderboardEntry])
def leaderboard_stores_top5(
    session: Session = Depends(get_session),
) -> list[StoreLeaderboardEntry]:
    """Top 5 stores by points_total (for store dashboard snippet)."""
    stores = session.exec(
        select(Store)
        .order_by(Store.points_total.desc())
        .limit(5)
    ).all()

    return [
        StoreLeaderboardEntry(
            rank=i + 1,
            id=str(s.id),
            name=s.name,
            points_total=s.points_total or 0,
        )
        for i, s in enumerate(stores)
    ]


class BagsStatusResponse(BaseModel):
    at_store: int
    with_users: int


@router.get("/stores/{store_id}/bags-status", response_model=BagsStatusResponse)
def store_bags_status(
    store_id: str,
    session: Session = Depends(get_session),
) -> BagsStatusResponse:
    """Return how many bags are at the store and how many are with users."""
    at_store = session.exec(
        select(func.count(Bag.id)).where(
            Bag.current_store_id == store_id,
            Bag.current_location == "store",
        )
    ).one() or 0

    with_users = session.exec(
        select(func.count(Bag.id)).where(
            Bag.current_store_id == store_id,
            Bag.current_location == "user",
        )
    ).one() or 0

    return BagsStatusResponse(at_store=at_store or 0, with_users=with_users or 0)