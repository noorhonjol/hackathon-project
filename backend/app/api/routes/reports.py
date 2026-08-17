"""Report endpoints — multi-contributor cleanup events."""

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from pydantic import BaseModel
from sqlmodel import Session, select

from app.core.auth import get_current_user
from app.db.session import get_session
from app.models.profile import Profile
from app.models.report import Report
from app.models.report_contribution import ReportContribution
from app.services.storage import save_photo
from app.services.points import award_points

router = APIRouter(prefix="/reports", tags=["reports"])


# ── Schemas ──────────────────────────────────────────────────────────────────

class ContributorInfo(BaseModel):
    profile_id: str
    display_name: str | None
    status: str  # "joined" | "completed"
    photo_after_url: str | None


class ReportListItem(BaseModel):
    id: str
    reporter_id: str
    reporter_name: str | None
    lat: float
    lng: float
    photo_before_url: str
    photo_after_url: str | None
    status: str
    contributor_count: int
    contributors: list[ContributorInfo]
    created_at: str


class ReportCreateResponse(BaseModel):
    id: str
    reporter_id: str
    lat: float
    lng: float
    photo_before_url: str
    status: str
    created_at: str


class JoinResponse(BaseModel):
    id: str
    report_id: str
    status: str
    report_status: str


class ContributeResponse(BaseModel):
    id: str
    report_id: str
    status: str
    points_awarded: int


class CloseResponse(BaseModel):
    id: str
    status: str


# ── Helper ───────────────────────────────────────────────────────────────────

def _require_citizen(current_user: dict, session: Session) -> Profile:
    profile = session.exec(
        select(Profile).where(Profile.id == current_user["id"])
    ).first()
    if not profile or profile.role != "citizen":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN)
    return profile


def _build_report_list_item(r: Report, session: Session) -> ReportListItem:
    """Build a full ReportListItem with contributors from the DB."""
    contribs = session.exec(
        select(ReportContribution).where(ReportContribution.report_id == r.id)
    ).all()

    contributors = []
    for c in contribs:
        p = session.exec(select(Profile).where(Profile.id == c.profile_id)).first()
        contributors.append(
            ContributorInfo(
                profile_id=str(c.profile_id),
                display_name=p.display_name if p else None,
                status=c.status,
                photo_after_url=c.photo_after_url,
            )
        )

    rep = session.exec(select(Profile).where(Profile.id == r.reporter_id)).first()

    return ReportListItem(
        id=str(r.id),
        reporter_id=str(r.reporter_id),
        reporter_name=rep.display_name if rep else None,
        lat=r.lat,
        lng=r.lng,
        photo_before_url=r.photo_before_url,
        photo_after_url=r.photo_after_url,
        status=r.status,
        contributor_count=r.contributor_count or 0,
        contributors=contributors,
        created_at=r.created_at.isoformat() if r.created_at else "",
    )


# ── Endpoints ────────────────────────────────────────────────────────────────

@router.get("", response_model=list[ReportListItem])
def list_reports(
    page: int = 1,
    per_page: int = 10,
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> list[ReportListItem]:
    """Return visible reports with pagination (open, in_progress, completed)."""
    offset = (page - 1) * per_page
    reports = session.exec(
        select(Report)
        .where(Report.status.in_(["open", "in_progress", "completed"]))
        .order_by(Report.created_at.desc())
        .offset(offset)
        .limit(per_page)
    ).all()
    return [_build_report_list_item(r, session) for r in reports]


@router.post("", response_model=ReportCreateResponse, status_code=status.HTTP_201_CREATED)
async def create_report(
    photo: UploadFile = File(...),
    lat: float = Form(...),
    lng: float = Form(...),
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> ReportCreateResponse:
    citizen = _require_citizen(current_user, session)
    file_bytes = await photo.read()
    try:
        photo_url = save_photo(file_bytes, photo.filename or "photo.jpg")
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc))

    report = Report(
        reporter_id=str(citizen.id),
        lat=lat, lng=lng,
        photo_before_url=photo_url,
        status="pending_review",
    )
    session.add(report)
    session.commit()
    session.refresh(report)

    return ReportCreateResponse(
        id=str(report.id), reporter_id=str(report.reporter_id),
        lat=report.lat, lng=report.lng,
        photo_before_url=report.photo_before_url,
        status=report.status,
        created_at=report.created_at.isoformat() if report.created_at else "",
    )


# ── Join ─────────────────────────────────────────────────────────────────────

@router.post("/{report_id}/join", response_model=JoinResponse)
def join_report(
    report_id: str,
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> JoinResponse:
    citizen = _require_citizen(current_user, session)

    report = session.exec(select(Report).where(Report.id == report_id)).first()
    if report is None:
        raise HTTPException(status_code=404, detail="Report not found")
    if report.status == "completed":
        raise HTTPException(status_code=409, detail="This cleanup event is already closed")
    if report.status != "open":
        raise HTTPException(status_code=409, detail="You can only join during the sign-up period")

    # Check if already joined
    existing = session.exec(
        select(ReportContribution).where(
            ReportContribution.report_id == report_id,
            ReportContribution.profile_id == str(citizen.id),
        )
    ).first()
    if existing is not None:
        raise HTTPException(status_code=409, detail="You have already joined this cleanup")

    contrib = ReportContribution(
        report_id=str(report.id),
        profile_id=str(citizen.id),
        status="joined",
    )
    session.add(contrib)

    # Promote status from open → in_progress
    if report.status == "open":
        report.status = "in_progress"

    report.contributor_count = (report.contributor_count or 0) + 1
    report.updated_at = datetime.utcnow()
    session.add(report)
    session.commit()
    session.refresh(contrib)

    return JoinResponse(
        id=str(contrib.id), report_id=str(report.id),
        status="joined", report_status=report.status,
    )


# ── Contribute ───────────────────────────────────────────────────────────────

@router.post("/{report_id}/contribute", response_model=ContributeResponse)
async def contribute_to_report(
    report_id: str,
    photo: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> ContributeResponse:
    citizen = _require_citizen(current_user, session)

    report = session.exec(select(Report).where(Report.id == report_id)).first()
    if report is None:
        raise HTTPException(status_code=404, detail="Report not found")
    if report.status != "in_progress":
        raise HTTPException(status_code=409, detail="You can only contribute photos once the event is in progress")

    contrib = session.exec(
        select(ReportContribution).where(
            ReportContribution.report_id == report_id,
            ReportContribution.profile_id == str(citizen.id),
        )
    ).first()
    if contrib is None:
        raise HTTPException(
            status_code=403,
            detail="You must join this cleanup before contributing",
        )
    if contrib.status == "completed":
        raise HTTPException(status_code=409, detail="You already contributed to this cleanup")

    # Save photo
    file_bytes = await photo.read()
    try:
        photo_url = save_photo(file_bytes, photo.filename or "after.jpg")
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))

    contrib.photo_after_url = photo_url
    contrib.status = "completed"
    contrib.completed_at = datetime.utcnow()
    session.add(contrib)

    # Award points
    result = award_points(
        session,
        profile_id=str(citizen.id),
        amount=15,
        source="report_contribution",
        reference_id=str(report.id),
    )

    return ContributeResponse(
        id=str(contrib.id),
        report_id=str(report.id),
        status="completed",
        points_awarded=result["awarded"],
    )


# ── Close ────────────────────────────────────────────────────────────────────

@router.post("/{report_id}/close", response_model=CloseResponse)
async def close_report(
    report_id: str,
    photo: UploadFile | None = File(default=None),
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> CloseResponse:
    """Close a report. Admin only — optionally uploads an after-photo."""
    from app.api.routes.admin import _require_admin
    _require_admin(current_user, session)

    report = session.exec(select(Report).where(Report.id == report_id)).first()
    if report is None:
        raise HTTPException(status_code=404, detail="Report not found")
    if report.status == "completed":
        raise HTTPException(status_code=409, detail="Already closed")

    # Admin can close any report — optionally with an after-photo
    if photo:
        file_bytes = await photo.read()
        try:
            photo_url = save_photo(file_bytes, photo.filename or "after.jpg")
            report.photo_after_url = photo_url
        except ValueError as exc:
            raise HTTPException(status_code=422, detail=str(exc))

    report.status = "completed"
    report.updated_at = datetime.utcnow()
    session.add(report)
    session.commit()

    return CloseResponse(id=str(report.id), status="completed")