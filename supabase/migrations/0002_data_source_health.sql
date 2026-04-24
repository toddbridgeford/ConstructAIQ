-- ---------------------------------------------------------------------------
-- Migration 0002: data_source_health
-- Per-source ingestion health tracking for /api/status dashboard.
-- Every cron job writes a row after each run.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS data_source_health (
  id            BIGSERIAL    PRIMARY KEY,
  source_id     TEXT         NOT NULL,
  -- e.g. 'harvest_TTLCONS', 'federal', 'permits_PHX',
  --      'satellite', 'solicitations', 'formation_scores'
  source_label  TEXT         NOT NULL,
  category      TEXT         NOT NULL,
  -- 'government_data' | 'permits' | 'federal' | 'satellite'
  -- | 'scores' | 'ai'
  status        TEXT         NOT NULL DEFAULT 'unknown',
  -- 'ok' | 'warn' | 'failed' | 'skipped' | 'not_configured'
  rows_written  INT,
  error_message TEXT,
  duration_ms   INT,
  run_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  expected_cadence_hours INT NOT NULL DEFAULT 24
);

CREATE INDEX IF NOT EXISTS idx_dsh_source_id
  ON data_source_health (source_id, run_at DESC);

CREATE INDEX IF NOT EXISTS idx_dsh_run_at
  ON data_source_health (run_at DESC);

ALTER TABLE data_source_health ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_all_data_source_health"
  ON data_source_health FOR ALL
  TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "anon_read_data_source_health"
  ON data_source_health FOR SELECT
  TO anon USING (true);

COMMENT ON TABLE data_source_health IS
  'Per-source ingestion health log. One row per cron run per source.';
