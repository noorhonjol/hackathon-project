from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # PostgreSQL
    database_url: str = "postgresql://hackathon:hackathon@db:5432/hackathon"

    # CORS (comma-separated origins)
    cors_origins: str = "http://localhost:5173"

    # DigitalOcean Spaces (S3-compatible). All optional — blank = storage disabled.
    s3_endpoint_url: str | None = None
    s3_region: str = "nyc3"
    s3_access_key_id: str | None = None
    s3_secret_access_key: str | None = None
    s3_bucket: str | None = None

    # Supabase Auth
    supabase_jwt_secret: str = ""

    # Supabase GoTrue client config
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()