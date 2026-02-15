from __future__ import annotations
from pathlib import Path
from datetime import datetime
from uuid import uuid4

from app.core.config import settings

_PROJECT_ROOT = Path(__file__).resolve().parents[2]
UPLOAD_DIR = Path(settings.UPLOAD_DIR) if settings.UPLOAD_DIR else _PROJECT_ROOT / "data" / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

_ALLOWED_EXTENSIONS = [e.strip().lower() for e in settings.UPLOAD_ALLOWED_EXTENSIONS.split(",") if e.strip()] or [".png", ".jpg", ".jpeg", ".webp", ".bmp"]

def save_upload_bytes(filename: str, data: bytes) -> tuple[str, str]:
    """
    Saves uploaded bytes to UPLOAD_DIR with a unique name.
    Returns (image_id, saved_path_str).
    """
    ext = Path(filename).suffix.lower() if filename else ".png"
    if ext not in _ALLOWED_EXTENSIONS:
        ext = ".png"

    image_id = f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_{uuid4().hex[:10]}"
    saved_name = f"{image_id}{ext}"
    saved_path = UPLOAD_DIR / saved_name
    saved_path.write_bytes(data)

    return image_id, str(saved_path)