from datetime import datetime, timezone
from uuid import UUID, uuid4

from sqlmodel import Field, SQLModel


class Store(SQLModel, table=True):
    __tablename__ = "stores"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    owner_id: UUID = Field(foreign_key="profiles.id")
    name: str
    qr_code: str = Field(unique=True)
    bags_avoided_count: int = Field(default=0)
    points_total: int = Field(default=0)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))