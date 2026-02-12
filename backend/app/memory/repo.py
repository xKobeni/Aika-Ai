from __future__ import annotations
from datetime import datetime
from typing import List, Dict, Any, Optional
import json

from app.memory.db import get_conn

def _now() -> str:
    return datetime.utcnow().isoformat()

def ensure_session(session_id: str) -> None:
    conn = get_conn()
    try:
        conn.execute(
            "INSERT OR IGNORE INTO sessions (id, created_at) VALUES (?, ?)",
            (session_id, _now()),
        )
        conn.commit()
    finally:
        conn.close()

def add_message(session_id: str, role: str, content: str) -> None:
    ensure_session(session_id)
    conn = get_conn()
    try:
        conn.execute(
            "INSERT INTO messages (session_id, role, content, created_at) VALUES (?, ?, ?, ?)",
            (session_id, role, content, _now()),
        )
        conn.commit()
    finally:
        conn.close()

def get_recent_messages(session_id: str, limit: int = 12) -> List[Dict[str, str]]:
    """
    Returns messages in chronological order (oldest -> newest) limited by last N.
    """
    conn = get_conn()
    try:
        rows = conn.execute(
            "SELECT role, content FROM messages WHERE session_id = ? ORDER BY id DESC LIMIT ?",
            (session_id, limit),
        ).fetchall()
        # rows are newest first, reverse them:
        rows = list(reversed(rows))
        return [{"role": r["role"], "content": r["content"]} for r in rows]
    finally:
        conn.close()


# ---------- Preferences (long-term memory) ----------


def set_preference(key: str, value: str) -> None:
    key = key.strip()
    conn = get_conn()
    try:
        conn.execute(
            """
            INSERT INTO preferences (key, value, updated_at)
            VALUES (?, ?, ?)
            ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
            """,
            (key, value, _now()),
        )
        conn.commit()
    finally:
        conn.close()


def get_preference(key: str) -> Optional[str]:
    conn = get_conn()
    try:
        row = conn.execute(
            "SELECT value FROM preferences WHERE key = ?",
            (key.strip(),),
        ).fetchone()
        return row["value"] if row else None
    finally:
        conn.close()


def get_all_preferences() -> Dict[str, str]:
    conn = get_conn()
    try:
        rows = conn.execute("SELECT key, value FROM preferences").fetchall()
        return {r["key"]: r["value"] for r in rows}
    finally:
        conn.close()


# ---------- Learned Facts (smart memory) ----------


def save_learned_fact(fact_key: str, fact_value: str, session_id: str | None = None, confidence: float = 1.0) -> None:
    """Save or update a learned fact. If fact_key exists, update if confidence is higher."""
    conn = get_conn()
    try:
        existing = conn.execute(
            "SELECT confidence FROM learned_facts WHERE fact_key = ?",
            (fact_key.strip(),),
        ).fetchone()
        
        if existing and existing["confidence"] >= confidence:
            # Existing fact has equal or higher confidence, skip update
            return
        
        conn.execute(
            """
            INSERT INTO learned_facts (fact_key, fact_value, confidence, source_session_id, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(fact_key) DO UPDATE SET
                fact_value = excluded.fact_value,
                confidence = excluded.confidence,
                source_session_id = excluded.source_session_id,
                updated_at = excluded.updated_at
            """,
            (fact_key.strip(), fact_value.strip(), confidence, session_id, _now(), _now()),
        )
        conn.commit()
    finally:
        conn.close()


def get_learned_fact(fact_key: str) -> Optional[str]:
    """Get a learned fact by key."""
    conn = get_conn()
    try:
        row = conn.execute(
            "SELECT fact_value FROM learned_facts WHERE fact_key = ?",
            (fact_key.strip(),),
        ).fetchone()
        return row["fact_value"] if row else None
    finally:
        conn.close()


def get_all_learned_facts() -> Dict[str, str]:
    """Get all learned facts as a dict."""
    conn = get_conn()
    try:
        rows = conn.execute("SELECT fact_key, fact_value FROM learned_facts ORDER BY fact_key").fetchall()
        return {r["fact_key"]: r["fact_value"] for r in rows}
    finally:
        conn.close()


def delete_learned_fact(fact_key: str) -> None:
    """Delete a learned fact."""
    conn = get_conn()
    try:
        conn.execute("DELETE FROM learned_facts WHERE fact_key = ?", (fact_key.strip(),))
        conn.commit()
    finally:
        conn.close()


# ---------- Tool logs ----------


def log_tool(session_id: str, tool_name: str, args: Dict[str, Any], result: Dict[str, Any]) -> None:
    conn = get_conn()
    try:
        conn.execute(
            "INSERT INTO tool_logs (session_id, tool_name, args_json, result_json, created_at) VALUES (?, ?, ?, ?, ?)",
            (session_id, tool_name, json.dumps(args), json.dumps(result), _now()),
        )
        conn.commit()
    finally:
        conn.close()