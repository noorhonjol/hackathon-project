from datetime import datetime, timezone
from uuid import UUID

from sqlmodel import Field, SQLModel


class Profile(SQLModel, table=True):
    __tablename__ = "profiles"

    id: UUID | None = Field(default=None, primary_key=True)
    role: str | None = Field(default=None)
    display_name: str | None = Field(default=None)
    points_total: int = Field(default=0)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))