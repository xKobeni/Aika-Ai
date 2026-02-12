-- Add learned_facts table for auto-learned information from conversations
CREATE TABLE IF NOT EXISTS learned_facts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fact_key TEXT NOT NULL UNIQUE,  -- e.g., "user_name", "favorite_color", "work_location"
  fact_value TEXT NOT NULL,
  confidence REAL DEFAULT 1.0,     -- 0.0-1.0, how certain we are (can be updated if mentioned again)
  source_session_id TEXT,          -- Which conversation it came from
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_learned_facts_key ON learned_facts(fact_key);
