from datetime import datetime, timezone
from uuid import UUID, uuid4

from sqlmodel import Field, SQLModel


class Bag(SQLModel, table=True):
    __tablename__ = "bags"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    qr_code: str = Field(unique=True)
    current_location: str = Field(default="provider")
    current_store_id: UUID | None = Field(default=None, foreign_key="stores.id")
    current_user_id: UUID | None = Field(default=None, foreign_key="profiles.id")
    total_scans: int = Field(default=0)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))