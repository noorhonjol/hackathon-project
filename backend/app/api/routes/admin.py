"""Admin endpoints for Qoffa — report review workflow."""

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlmodel import Session, select

from app.core.auth import get_current_user
from app.db.session import get_session
from app.models.profile import Profile
from app.models.report import Report
from app.services.points import award_points

router = APIRouter(prefix="/admin/reports", tags=["admin"])


# ── Schemas ──────────────────────────────────────────────────────────────────

class PendingReportItem(BaseModel):
    id: str
    reporter_id: str
    reporter_name: str | None
    lat: float
    lng: float
    photo_before_url: str
    status: str
    created_at: str


class ActionResponse(BaseModel):
    id: str
    status: str
    points_awarded: int


# ── Helper ───────────────────────────────────────────────────────────────────

def _require_admin(current_user: dict, session: Session) -> Profile:
    profile = session.exec(
        select(Profile).where(Profile.id == current_user["id"])
    ).first()
    if not profile or profile.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return profile


# ── Endpoints ────────────────────────────────────────────────────────────────

@router.get("/pending", response_model=list[PendingReportItem])
def list_pending_reports(
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> list[PendingReportItem]:
    """Return all reports visible to admin, newest first."""
    _require_admin(current_user, session)

    reports = session.exec(
        select(Report).order_by(Report.created_at.desc())
    ).all()

    result = []
    for r in reports:
        reporter = session.exec(
            select(Profile).where(Profile.id == r.reporter_id)
        ).first()
        result.append(
            PendingReportItem(
                id=str(r.id),
                reporter_id=str(r.reporter_id),
                reporter_name=reporter.display_name if reporter else None,
                lat=r.lat,
                lng=r.lng,
                photo_before_url=r.photo_before_url,
                status=r.status,
                created_at=r.created_at.isoformat() if r.created_at else "",
            )
        )
    return result


@router.post("/{report_id}/approve", response_model=ActionResponse)
def approve_report(
    report_id: str,
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> ActionResponse:
    """Approve a pending report: set status to 'open' and award 5 points."""
    _require_admin(current_user, session)

    report = session.exec(select(Report).where(Report.id == report_id)).first()
    if report is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")

    if report.status not in ("pending_review", "rejected"):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Report is already {report.status}",
        )

    report.status = "open"
    report.updated_at = datetime.utcnow()
    session.add(report)
    session.commit()

    return ActionResponse(id=str(report.id), status="open", points_awarded=0)


@router.post("/{report_id}/start", response_model=ActionResponse)
def start_report(
    report_id: str,
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> ActionResponse:
    """Start an approved report: set status to 'in_progress' so citizens can join."""
    _require_admin(current_user, session)

    report = session.exec(select(Report).where(Report.id == report_id)).first()
    if report is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")

    if report.status != "open":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Report must be 'open' before starting, current: {report.status}",
        )

    report.status = "in_progress"
    report.updated_at = datetime.utcnow()
    session.add(report)
    session.commit()

    return ActionResponse(id=str(report.id), status="in_progress", points_awarded=0)


@router.post("/{report_id}/close", response_model=ActionResponse)
def close_report(
    report_id: str,
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> ActionResponse:
    """Close a report. Admin only."""
    _require_admin(current_user, session)

    report = session.exec(select(Report).where(Report.id == report_id)).first()
    if report is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")
    if report.status == "completed":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Already closed")

    report.status = "completed"
    report.updated_at = datetime.utcnow()
    session.add(report)
    session.commit()

    return ActionResponse(id=str(report.id), status="completed", points_awarded=0)


@router.post("/{report_id}/reject", response_model=ActionResponse)
def reject_report(
    report_id: str,
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> ActionResponse:
    """Reject a pending report: set status to 'rejected'. No points awarded."""
    _require_admin(current_user, session)

    report = session.exec(select(Report).where(Report.id == report_id)).first()
    if report is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")

    if report.status != "pending_review":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Report is already {report.status}",
        )

    report.status = "rejected"
    report.updated_at = datetime.utcnow()
    session.add(report)
    session.commit()

    return ActionResponse(id=str(report.id), status="rejected", points_awarded=0)