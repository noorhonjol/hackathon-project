"""Local file storage for Qoffa report photos.

Photos are saved to a mounted volume and served by Caddy at /uploads/.
"""

import uuid
from pathlib import Path

UPLOAD_DIR = Path("/code/uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB


def save_photo(file_bytes: bytes, original_filename: str) -> str:
    """Save a photo and return its public URL path."""
    ext = Path(original_filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise ValueError(f"Unsupported file type: {ext}")

    if len(file_bytes) > MAX_FILE_SIZE:
        raise ValueError("File too large (max 5 MB)")

    filename = f"{uuid.uuid4()}{ext}"
    filepath = UPLOAD_DIR / filename
    filepath.write_bytes(file_bytes)

    return f"/uploads/{filename}"