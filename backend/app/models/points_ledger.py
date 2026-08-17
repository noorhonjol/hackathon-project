from datetime import datetime, timezone
from uuid import UUID, uuid4

from sqlmodel import Field, SQLModel


class PointsLedger(SQLModel, table=True):
    __tablename__ = "points_ledger"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    profile_id: UUID | None = Field(default=None, foreign_key="profiles.id")
    store_id: UUID | None = Field(default=None, foreign_key="stores.id")
    amount: int
    source: str  # store_scan, report_approved, report_cleaned
    reference_id: UUID | None = Field(default=None)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))