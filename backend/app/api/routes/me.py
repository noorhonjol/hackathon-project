from fastapi import APIRouter, Depends

from app.core.auth import get_current_user

router = APIRouter(tags=["me"])


@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)) -> dict:
    """Return the authenticated user's id and email from Supabase GoTrue."""
    return {
        "user_id": current_user.get("id", "unknown"),
        "email": current_user.get("email", "unknown"),
    }