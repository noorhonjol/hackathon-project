"""Supabase Auth dependency for FastAPI — delegates token verification to GoTrue."""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.exceptions import AuthProviderError
from app.services.auth import AuthService

bearer_scheme = HTTPBearer(auto_error=False)
auth_service = AuthService()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> dict:
    """Verify the Bearer token against Supabase GoTrue and return the user payload.

    Raises 401 if the token is missing, expired, or invalid.
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authorization header",
        )

    try:
        user = await auth_service.verify_token(credentials.credentials)
    except AuthProviderError as exc:
        raise HTTPException(
            status_code=exc.status_code or status.HTTP_401_UNAUTHORIZED,
            detail=exc.detail,
        )

    return user