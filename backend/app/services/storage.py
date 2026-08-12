from typing import Any

import boto3
from botocore.exceptions import BotoCoreError, ClientError

from app.core.config import settings


def get_s3_client() -> Any | None:
    """Return a boto3 S3 client pointed at DigitalOcean Spaces, or None if not configured."""
    if not (settings.s3_endpoint_url and settings.s3_access_key_id and settings.s3_secret_access_key):
        return None
    return boto3.client(
        "s3",
        endpoint_url=settings.s3_endpoint_url,
        region_name=settings.s3_region,
        aws_access_key_id=settings.s3_access_key_id,
        aws_secret_access_key=settings.s3_secret_access_key,
    )


def storage_status() -> dict:
    """Report whether object storage is configured and reachable. Never raises."""
    client = get_s3_client()
    if client is None:
        return {"configured": False, "detail": "S3/Spaces credentials not set"}

    try:
        client.list_buckets()
        return {"configured": True, "bucket": settings.s3_bucket, "reachable": True}
    except (BotoCoreError, ClientError) as exc:
        return {
            "configured": True,
            "bucket": settings.s3_bucket,
            "reachable": False,
            "error": str(exc),
        }