from fastapi import APIRouter

from app.api.routes import hello, me, profile, debug, stores, transactions, reports, admin, points, bags

# Routes live in app/api/routes/. Import and include each router here as you add them.
api_router = APIRouter(prefix="/api")
api_router.include_router(hello.router)
api_router.include_router(me.router)
api_router.include_router(profile.router)
api_router.include_router(debug.router)
api_router.include_router(stores.router)
api_router.include_router(transactions.router)
api_router.include_router(reports.router)
api_router.include_router(admin.router)
api_router.include_router(points.router)
api_router.include_router(bags.router)