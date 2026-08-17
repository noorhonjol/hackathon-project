"""SQLAlchemy engine and session factory for Qoffa.

Uses DATABASE_URL from env.  Intended for use by the FastAPI app as well as
standalone scripts and backfill jobs.
"""

import os

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker


DATABASE_URL: str = os.getenv(
    "DATABASE_URL",
    "postgresql://hackathon:hackathon@localhost:5432/hackathon",
)

engine = create_engine(DATABASE_URL, pool_pre_ping=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_session():
    """Yield a SQLAlchemy ORM session, ensuring it is closed after use."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()