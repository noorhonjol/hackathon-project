from sqlmodel import SQLModel

from app.db.session import engine

# Import models so their tables register on SQLModel.metadata before create_all runs.
import app.models  # noqa: F401


def init_db() -> None:
    SQLModel.metadata.create_all(engine)