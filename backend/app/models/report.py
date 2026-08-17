from datetime import datetime, timezone
from uuid import UUID, uuid4

from sqlmodel import Field, SQLModel


class Report(SQLModel, table=True):
    __tablename__ = "reports"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    reporter_id: UUID = Field(foreign_key="profiles.id")
    lat: float
    lng: float
    photo_before_url: str
    photo_after_url: str | None = Field(default=None)
    status: str = Field(default="pending_review")
    claimed_by_id: UUID | None = Field(default=None, foreign_key="profiles.id")
    cleaned_by_id: UUID | None = Field(default=None, foreign_key="profiles.id")
    contributor_count: int = Field(default=0)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))