from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.core.config import settings
from app.db.init import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables on startup. Swap for Alembic migrations once you outgrow this.
    init_db()
    yield


app = FastAPI(title="Hackathon Hello World API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)