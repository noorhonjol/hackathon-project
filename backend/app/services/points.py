"""Central points-awarding logic for Qoffa.

Call this from any endpoint that needs to award points (store scan,
report approval, report cleaned).  It handles the daily cap, ledger
insertion, and running-total updates in a single session.
"""

from datetime import date, timezone
from typing import Optional
from uuid import UUID

from sqlmodel import Session, select, text

from app.models.profile import Profile
from app.models.store import Store
from app.models.points_ledger import PointsLedger
from app.models.daily_point_cap import DailyPointCap


DAILY_CAP = 100


def award_points(
    db_session: Session,
    *,
    profile_id: str | UUID | None = None,
    store_id: str | UUID | None = None,
    amount: int,
    source: str,
    reference_id: str | UUID | None = None,
) -> dict:
    """Award points to a profile and/or store, respecting the daily cap.

    Returns
        {"awarded": int, "capped": bool}
    """
    if amount <= 0:
        return {"awarded": 0, "capped": False}

    awarded = amount
    capped = False

    # ── 1. Daily cap check (profiles only) ──────────────────────────────
    if profile_id is not None:
        today = date.today()
        profile_id_str = str(profile_id)

        cap_row = db_session.exec(
            select(DailyPointCap).where(
                DailyPointCap.profile_id == profile_id_str,
                DailyPointCap.date == today.isoformat(),
            )
        ).first()

        earned_so_far = cap_row.points_earned if cap_row else 0

        if earned_so_far >= DAILY_CAP:
            return {"awarded": 0, "capped": True}

        remaining = DAILY_CAP - earned_so_far
        if amount > remaining:
            awarded = remaining
            capped = True

    # ── 2. Insert points_ledger row ─────────────────────────────────────
    entry = PointsLedger(
        profile_id=str(profile_id) if profile_id else None,
        store_id=str(store_id) if store_id else None,
        amount=awarded,
        source=source,
        reference_id=str(reference_id) if reference_id else None,
    )
    db_session.add(entry)

    # ── 3. Update running totals ────────────────────────────────────────
    if profile_id is not None and awarded > 0:
        profile = db_session.exec(
            select(Profile).where(Profile.id == profile_id_str)
        ).first()
        if profile:
            profile.points_total = (profile.points_total or 0) + awarded

    if store_id is not None and awarded > 0:
        store = db_session.exec(
            select(Store).where(Store.id == str(store_id))
        ).first()
        if store:
            store.points_total = (store.points_total or 0) + awarded

    # ── 4. Upsert daily_point_caps ──────────────────────────────────────
    if profile_id is not None and awarded > 0:
        if cap_row:
            cap_row.points_earned = earned_so_far + awarded
        else:
            new_cap = DailyPointCap(
                profile_id=profile_id_str,
                date=today.isoformat(),
                points_earned=awarded,
            )
            db_session.add(new_cap)

    db_session.commit()

    return {"awarded": awarded, "capped": capped}