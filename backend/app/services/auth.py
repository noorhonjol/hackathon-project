import httpx

from app.core.config import settings
from app.exceptions import AuthProviderError


class AuthService:
    def __init__(self):
        self.supabase_url = settings.supabase_url.rstrip("/")
        self.anon_key = settings.supabase_anon_key
        self.service_role_key = settings.supabase_service_role_key

    async def _request(
        self,
        method: str,
        path: str,
        *,
        token: str | None = None,
        api_key: str | None = None,
        json: dict | None = None,
        params: dict | None = None,
    ) -> dict:
        headers = {"apikey": api_key or self.anon_key}
        if token:
            headers["Authorization"] = f"Bearer {token}"

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.request(
                    method,
                    f"{self.supabase_url}{path}",
                    headers=headers,
                    json=json,
                    params=params,
                )
        except httpx.RequestError as exc:
            raise AuthProviderError(network_error=True) from exc

        try:
            data = response.json()
        except ValueError:
            data = {}

        if response.is_error:
            detail = (
                data.get("msg") or data.get("message") or data.get("error_description")
            )
            code = data.get("error_code") or data.get("code")
            raise AuthProviderError(
                detail or "Authentication provider request failed",
                status_code=response.status_code,
                code=code,
            )

        return data

    async def verify_token(self, token: str) -> dict:
        return await self._request("GET", "/auth/v1/user", token=token)

    async def email_exists(self, email: str) -> bool:
        if not self.service_role_key:
            return False

        data = await self._request(
            "GET",
            "/auth/v1/admin/users",
            token=self.service_role_key,
            api_key=self.service_role_key,
            params={"filter": email},
        )
        return any(
            (user.get("email") or "").lower() == email.lower()
            for user in data.get("users", [])
        )

    async def list_users(self, per_page: int = 200) -> list[dict]:
        if not self.service_role_key:
            raise AuthProviderError("Service role key is not configured")

        users: list[dict] = []
        page = 1
        while True:
            data = await self._request(
                "GET",
                "/auth/v1/admin/users",
                token=self.service_role_key,
                api_key=self.service_role_key,
                params={"page": page, "per_page": per_page},
            )
            batch = data.get("users") or []
            users.extend(batch)
            if len(batch) < per_page:
                return users
            page += 1

    async def signup(self, email: str, password: str) -> dict:
        data = await self._request(
            "POST",
            "/auth/v1/signup",
            json={"email": email, "password": password},
        )
        user = data.get("user") or data
        if not user.get("id"):
            raise AuthProviderError("Signup returned no user")
        return user