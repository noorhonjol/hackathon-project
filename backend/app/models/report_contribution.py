from datetime import datetime, timezone
from uuid import UUID, uuid4

from sqlmodel import Field, SQLModel


class ReportContribution(SQLModel, table=True):
    __tablename__ = "report_contributions"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    report_id: UUID = Field(foreign_key="reports.id")
    profile_id: UUID = Field(foreign_key="profiles.id")
    photo_after_url: str | None = Field(default=None)
    status: str = Field(default="joined")
    completed_at: datetime | None = Field(default=None)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))