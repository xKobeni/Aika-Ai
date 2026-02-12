import sqlite3
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[2]  # apps/backend
DB_PATH = PROJECT_ROOT / "data" / "sqlite" / "aika.db"
DB_PATH.parent.mkdir(parents=True, exist_ok=True)

def get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn