"""SQLAlchemy ORM models matching the Qoffa database schema.

See backend/migrations/001_initial_schema.sql for the DDL.
"""

from datetime import date, datetime
from typing import Optional
from uuid import uuid4

from sqlalchemy import (
    CheckConstraint,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class Profile(Base):
    __tablename__ = "profiles"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True)
    role: Mapped[Optional[str]] = mapped_column(Text, default=None)
    display_name: Mapped[Optional[str]] = mapped_column(Text)
    points_total: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    __table_args__ = (
        CheckConstraint(
            "role IS NULL OR role IN ('citizen', 'store_owner', 'admin')",
            name="profiles_role_check",
        ),
    )

    stores = relationship("Store", back_populates="owner")
    reports = relationship(
        "Report",
        back_populates="reporter",
        foreign_keys="Report.reporter_id",
    )


class Store(Base):
    __tablename__ = "stores"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), primary_key=True, default=uuid4
    )
    owner_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("profiles.id", ondelete="CASCADE"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(Text, nullable=False)
    qr_code: Mapped[str] = mapped_column(Text, unique=True, nullable=False)
    bags_avoided_count: Mapped[int] = mapped_column(Integer, default=0)
    points_total: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    owner = relationship("Profile", back_populates="stores")


class Report(Base):
    __tablename__ = "reports"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), primary_key=True, default=uuid4
    )
    reporter_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("profiles.id", ondelete="CASCADE"),
        nullable=False,
    )
    lat: Mapped[float] = mapped_column(Float, nullable=False)
    lng: Mapped[float] = mapped_column(Float, nullable=False)
    photo_before_url: Mapped[str] = mapped_column(Text, nullable=False)
    photo_after_url: Mapped[Optional[str]] = mapped_column(Text)
    status: Mapped[str] = mapped_column(
        Text,
        default="pending_review",
    )
    claimed_by_id: Mapped[Optional[str]] = mapped_column(
        UUID(as_uuid=False), ForeignKey("profiles.id", ondelete="SET NULL")
    )
    cleaned_by_id: Mapped[Optional[str]] = mapped_column(
        UUID(as_uuid=False), ForeignKey("profiles.id", ondelete="SET NULL")
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    __table_args__ = (
        CheckConstraint(
            "status IN ('pending_review','rejected','open','claimed','cleaned')",
            name="reports_status_check",
        ),
    )

    reporter = relationship(
        "Profile", back_populates="reports", foreign_keys=[reporter_id]
    )


class PointsLedger(Base):
    __tablename__ = "points_ledger"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), primary_key=True, default=uuid4
    )
    profile_id: Mapped[Optional[str]] = mapped_column(
        UUID(as_uuid=False), ForeignKey("profiles.id", ondelete="CASCADE")
    )
    store_id: Mapped[Optional[str]] = mapped_column(
        UUID(as_uuid=False), ForeignKey("stores.id", ondelete="CASCADE")
    )
    amount: Mapped[int] = mapped_column(Integer, nullable=False)
    source: Mapped[str] = mapped_column(Text, nullable=False)
    reference_id: Mapped[Optional[str]] = mapped_column(UUID(as_uuid=False))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    __table_args__ = (
        CheckConstraint(
            "source IN ('store_scan', 'report_approved', 'report_cleaned')",
            name="points_ledger_source_check",
        ),
    )


class DailyPointCap(Base):
    __tablename__ = "daily_point_caps"

    profile_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("profiles.id", ondelete="CASCADE"),
        primary_key=True,
    )
    date: Mapped[date] = mapped_column(Date, primary_key=True)
    points_earned: Mapped[int] = mapped_column(Integer, default=0)