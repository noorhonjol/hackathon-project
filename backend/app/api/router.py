from fastapi import APIRouter

from app.api.routes import hello

# Routes live in app/api/routes/. Import and include each router here as you add them.
api_router = APIRouter(prefix="/api")
api_router.include_router(hello.router)