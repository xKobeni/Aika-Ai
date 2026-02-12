from pathlib import Path
from datetime import datetime
from app.memory.db import get_conn
import sqlite3

PROJECT_ROOT = Path(__file__).resolve().parents[2]  # apps/backend
MIGRATIONS_DIR = PROJECT_ROOT / "app" / "memory" / "migrations"

def init_db() -> None:
    """Run all migrations in order (001_init.sql, 002_add_learned_facts.sql, etc.)."""
    migration_files = sorted(MIGRATIONS_DIR.glob("*.sql"))
    if not migration_files:
        return
    
    conn = get_conn()
    try:
        for sql_file in migration_files:
            sql = sql_file.read_text(encoding="utf-8")
            conn.executescript(sql)
        conn.commit()
    finally:
        conn.close()