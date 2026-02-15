import sqlite3
from pathlib import Path

from app.core.config import settings

_PROJECT_ROOT = Path(__file__).resolve().parents[2]
DB_PATH = Path(settings.DB_PATH) if settings.DB_PATH else _PROJECT_ROOT / "data" / "sqlite" / "aika.db"
DB_PATH.parent.mkdir(parents=True, exist_ok=True)

def get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn