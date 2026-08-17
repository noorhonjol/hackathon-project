from uuid import UUID

from sqlmodel import Field, SQLModel
from sqlalchemy import Date


class DailyPointCap(SQLModel, table=True):
    __tablename__ = "daily_point_caps"

    profile_id: UUID = Field(primary_key=True, foreign_key="profiles.id")
    date: str = Field(
        sa_type=Date,
        primary_key=True,
    )
    points_earned: int = Field(default=0)