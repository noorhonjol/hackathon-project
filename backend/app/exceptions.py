class AuthProviderError(Exception):
    """Raised when an upstream authentication provider (e.g. Supabase GoTrue)
    returns an error or is unreachable."""

    def __init__(
        self,
        detail: str = "Authentication provider error",
        *,
        status_code: int | None = None,
        code: str | None = None,
        network_error: bool = False,
    ):
        self.detail = detail
        self.status_code = status_code
        self.code = code
        self.network_error = network_error
        super().__init__(detail)