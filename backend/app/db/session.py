from collections.abc import Generator

from sqlmodel import Session, create_engine

from app.core.config import settings

# pool_pre_ping keeps stale connections from breaking the app after the DB restarts.
engine = create_engine(settings.database_url, echo=False, pool_pre_ping=True)


def get_session() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session