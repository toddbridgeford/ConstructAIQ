-- =============================================================================
-- ConstructAIQ — Full Supabase (PostgreSQL) Schema
--
-- This file is the authoritative definition of all database tables used by
-- the ConstructAIQ application. It is idempotent: running it against an
-- existing database will not destroy data or raise errors for pre-existing
-- objects. Apply with:
--
--   psql "$DATABASE_URL" -f schema.sql
--
-- or paste into the Supabase SQL editor.
-- =============================================================================


-- ---------------------------------------------------------------------------
-- Table: series
-- Catalog of economic/market data series ingested from external providers
-- (FRED, Census Bureau, BLS, etc.).  Each row describes one time series;
-- actual observations live in the `observations` table.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS series (
    id           TEXT        PRIMARY KEY,
    name         TEXT        NOT NULL,
    source       TEXT        NOT NULL,
    units        TEXT,
    frequency    TEXT        NOT NULL DEFAULT 'monthly',
    last_updated TIMESTAMPTZ,
    data_end     TEXT
);

COMMENT ON TABLE  series              IS 'Catalog of economic/market data series ingested from external providers.';
COMMENT ON COLUMN series.id           IS 'Provider-assigned series identifier (e.g. FRED series ID).';
COMMENT ON COLUMN series.source       IS 'Data provider name: FRED, Census, BLS, etc.';
COMMENT ON COLUMN series.frequency    IS 'Observation frequency: monthly, quarterly, annual, etc.';
COMMENT ON COLUMN series.last_updated IS 'Timestamp of the most recent successful harvest for this series.';
COMMENT ON COLUMN series.data_end     IS 'Latest available data date reported by the provider (ISO-8601 string).';


-- ---------------------------------------------------------------------------
-- Table: observations
-- Time-series data points for each series.  One row per (series, date) pair.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS observations (
    id             BIGSERIAL   PRIMARY KEY,
    series_id      TEXT        REFERENCES series (id) ON DELETE CASCADE,
    obs_date       DATE        NOT NULL,
    value          NUMERIC     NOT NULL,
    is_revised     BOOLEAN     NOT NULL DEFAULT FALSE,
    is_preliminary BOOLEAN     NOT NULL DEFAULT FALSE,
    source_tag     TEXT,

    CONSTRAINT observations_series_date_unique UNIQUE (series_id, obs_date)
);

COMMENT ON TABLE  observations               IS 'Time-series data points harvested from external providers.';
COMMENT ON COLUMN observations.series_id      IS 'Foreign key to series.id.';
COMMENT ON COLUMN observations.obs_date       IS 'The calendar date this observation refers to.';
COMMENT ON COLUMN observations.value          IS 'Observed numeric value in the units defined by series.units.';
COMMENT ON COLUMN observations.is_revised     IS 'TRUE when this row supersedes a previously published figure.';
COMMENT ON COLUMN observations.is_preliminary IS 'TRUE when the provider has flagged this figure as preliminary.';
COMMENT ON COLUMN observations.source_tag     IS 'Optional tag for the specific data vintage or release.';

-- Fast lookup by series + chronological ordering (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_observations_series_date
    ON observations (series_id, obs_date);


-- ---------------------------------------------------------------------------
-- Table: forecasts
-- Model-generated forecast outputs.  Supports multiple model types and
-- multiple forecast runs per series, with full confidence-interval storage.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS forecasts (
    id             BIGSERIAL   PRIMARY KEY,
    series_id      TEXT        REFERENCES series (id) ON DELETE CASCADE,
    model          TEXT        NOT NULL,           -- 'holt-winters' | 'sarima' | 'xgboost' | 'ensemble'
    run_date       DATE        NOT NULL,
    horizon_month  DATE        NOT NULL,           -- calendar month being forecast (stored as first-of-month date)
    horizon_steps  INTEGER     NOT NULL,
    base_value     NUMERIC     NOT NULL,
    lo80           NUMERIC     NOT NULL,
    hi80           NUMERIC     NOT NULL,
    lo95           NUMERIC     NOT NULL,
    hi95           NUMERIC     NOT NULL,
    mape           NUMERIC,
    accuracy       NUMERIC,
    alpha          NUMERIC,
    beta           NUMERIC,
    phi            NUMERIC,
    training_n     INTEGER,
    weight         NUMERIC,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT forecasts_series_model_run_horizon_unique
        UNIQUE (series_id, model, run_date, horizon_month)
);

COMMENT ON TABLE  forecasts               IS 'Model-generated forecast outputs with full confidence intervals.';
COMMENT ON COLUMN forecasts.model         IS 'Forecasting model: holt-winters, sarima, xgboost, or ensemble.';
COMMENT ON COLUMN forecasts.run_date      IS 'The date on which this forecast was generated.';
COMMENT ON COLUMN forecasts.horizon_month IS 'The target month being forecast (first-of-month date convention).';
COMMENT ON COLUMN forecasts.horizon_steps IS 'Number of steps (months) ahead from run_date.';
COMMENT ON COLUMN forecasts.base_value    IS 'Point forecast (median/mean) for this horizon.';
COMMENT ON COLUMN forecasts.lo80          IS 'Lower bound of the 80 % prediction interval.';
COMMENT ON COLUMN forecasts.hi80          IS 'Upper bound of the 80 % prediction interval.';
COMMENT ON COLUMN forecasts.lo95          IS 'Lower bound of the 95 % prediction interval.';
COMMENT ON COLUMN forecasts.hi95          IS 'Upper bound of the 95 % prediction interval.';
COMMENT ON COLUMN forecasts.mape          IS 'Mean Absolute Percentage Error on the hold-out set.';
COMMENT ON COLUMN forecasts.accuracy      IS 'Model accuracy score (100 − MAPE, expressed as a percentage).';
COMMENT ON COLUMN forecasts.alpha         IS 'Holt-Winters/ETS level smoothing parameter.';
COMMENT ON COLUMN forecasts.beta          IS 'Holt-Winters/ETS trend smoothing parameter.';
COMMENT ON COLUMN forecasts.phi           IS 'Holt-Winters/ETS damping parameter.';
COMMENT ON COLUMN forecasts.training_n    IS 'Number of observations used to train the model.';
COMMENT ON COLUMN forecasts.weight        IS 'Ensemble weight assigned to this model.';

-- Efficient retrieval of all models for a given series on a given run date
CREATE INDEX IF NOT EXISTS idx_forecasts_series_model_run
    ON forecasts (series_id, model, run_date);


-- ---------------------------------------------------------------------------
-- Table: api_keys
-- API key management for external consumers of the ConstructAIQ REST API.
-- The full API key is never stored; only a SHA-256 hash is persisted.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS api_keys (
    id         BIGSERIAL   PRIMARY KEY,
    email      TEXT        NOT NULL UNIQUE,
    name       TEXT,
    plan       TEXT        NOT NULL DEFAULT 'starter',  -- 'starter' | 'professional' | 'enterprise'
    key_prefix TEXT        NOT NULL,                    -- 'caiq_' + 8 hex chars (shown to users)
    key_hash   TEXT        NOT NULL UNIQUE,             -- SHA-256 of the full key (never store plaintext)
    rpm_limit  INTEGER     NOT NULL DEFAULT 60,
    rpd_limit  INTEGER     NOT NULL DEFAULT 1000,
    usage      INTEGER     NOT NULL DEFAULT 0,
    active     BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  api_keys            IS 'API key registry for external ConstructAIQ API consumers.';
COMMENT ON COLUMN api_keys.email      IS 'Contact email; unique — one active key per email.';
COMMENT ON COLUMN api_keys.plan       IS 'Subscription tier: starter, professional, or enterprise.';
COMMENT ON COLUMN api_keys.key_prefix IS 'Human-readable key prefix (e.g. caiq_1a2b3c4d) shown in dashboards.';
COMMENT ON COLUMN api_keys.key_hash   IS 'SHA-256 hash of the full API key used for authentication lookup.';
COMMENT ON COLUMN api_keys.rpm_limit  IS 'Maximum requests per minute allowed for this key.';
COMMENT ON COLUMN api_keys.rpd_limit  IS 'Maximum requests per day allowed for this key.';
COMMENT ON COLUMN api_keys.usage      IS 'Running total of lifetime requests made with this key.';
COMMENT ON COLUMN api_keys.active     IS 'FALSE when the key has been revoked or suspended.';

-- Authentication hot-path: look up a key by its hash on every request
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash
    ON api_keys (key_hash);

-- Administrative lookup by email
CREATE INDEX IF NOT EXISTS idx_api_keys_email
    ON api_keys (email);


-- ---------------------------------------------------------------------------
-- Table: signals
-- Algorithmically detected market signals derived from ingested series data.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS signals (
    id               BIGSERIAL   PRIMARY KEY,
    type             TEXT        NOT NULL,  -- 'BULLISH' | 'BEARISH' | 'WARNING' | 'NEUTRAL'
    series_id        TEXT,
    title            TEXT        NOT NULL,
    description      TEXT,
    confidence       INTEGER,
    method           TEXT,
    value_at_signal  NUMERIC,
    threshold        NUMERIC,
    is_active        BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  signals                  IS 'Algorithmically detected market signals derived from time-series analysis.';
COMMENT ON COLUMN signals.type             IS 'Signal classification: BULLISH, BEARISH, WARNING, or NEUTRAL.';
COMMENT ON COLUMN signals.series_id        IS 'Source series that triggered the signal (nullable for composite signals).';
COMMENT ON COLUMN signals.confidence       IS 'Model confidence score (0–100).';
COMMENT ON COLUMN signals.method           IS 'Detection algorithm or rule name that produced this signal.';
COMMENT ON COLUMN signals.value_at_signal  IS 'The series value observed at signal creation time.';
COMMENT ON COLUMN signals.threshold        IS 'The threshold value that was crossed to trigger the signal.';
COMMENT ON COLUMN signals.is_active        IS 'FALSE when the signal has been superseded or manually dismissed.';

-- Efficient filtering by type and active status (primary dashboard query)
CREATE INDEX IF NOT EXISTS idx_signals_type_active
    ON signals (type, is_active);


-- ---------------------------------------------------------------------------
-- Table: subscribers
-- Email waitlist and marketing subscriber list.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS subscribers (
    id         BIGSERIAL   PRIMARY KEY,
    email      TEXT        NOT NULL UNIQUE,
    source     TEXT,
    plan       TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    active     BOOLEAN     NOT NULL DEFAULT TRUE
);

COMMENT ON TABLE  subscribers        IS 'Email waitlist and marketing subscriber registry.';
COMMENT ON COLUMN subscribers.email  IS 'Subscriber email address; unique across the table.';
COMMENT ON COLUMN subscribers.source IS 'Acquisition channel (e.g. landing-page, referral, api-docs).';
COMMENT ON COLUMN subscribers.plan   IS 'Expressed interest in a specific plan tier.';
COMMENT ON COLUMN subscribers.active IS 'FALSE when the subscriber has unsubscribed.';


-- ---------------------------------------------------------------------------
-- Table: harvest_log
-- Execution log for scheduled data-harvest cron jobs.  One row per run.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS harvest_log (
    id               BIGSERIAL    PRIMARY KEY,
    run_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    sources          TEXT[],
    records_upserted INTEGER,
    errors           TEXT[],
    duration_ms      INTEGER,
    triggered_by     TEXT         DEFAULT 'cron'
);

COMMENT ON TABLE  harvest_log                    IS 'Execution log for scheduled data-harvest cron jobs.';
COMMENT ON COLUMN harvest_log.run_at             IS 'Timestamp when the harvest job ran.';
COMMENT ON COLUMN harvest_log.sources            IS 'Array of series IDs successfully harvested in this run.';
COMMENT ON COLUMN harvest_log.records_upserted   IS 'Total observation rows inserted or updated.';
COMMENT ON COLUMN harvest_log.errors             IS 'Array of error messages encountered during the run.';
COMMENT ON COLUMN harvest_log.duration_ms        IS 'Wall-clock duration of the run in milliseconds.';
COMMENT ON COLUMN harvest_log.triggered_by       IS 'Trigger type: cron, manual, or webhook.';

CREATE INDEX IF NOT EXISTS idx_harvest_log_run_at
    ON harvest_log (run_at DESC);


-- ---------------------------------------------------------------------------
-- Table: forecast_log
-- Execution log for scheduled ensemble forecast cron jobs.  One row per run.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS forecast_log (
    id                 BIGSERIAL    PRIMARY KEY,
    run_at             TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    series_processed   TEXT[],
    models_run         TEXT[],
    forecasts_written  INTEGER,
    duration_ms        INTEGER
);

COMMENT ON TABLE  forecast_log                     IS 'Execution log for scheduled ensemble forecast cron jobs.';
COMMENT ON COLUMN forecast_log.run_at              IS 'Timestamp when the forecast job ran.';
COMMENT ON COLUMN forecast_log.series_processed    IS 'Array of series IDs for which forecasts were computed.';
COMMENT ON COLUMN forecast_log.models_run          IS 'List of model names used in the ensemble run.';
COMMENT ON COLUMN forecast_log.forecasts_written   IS 'Total number of forecast rows upserted.';
COMMENT ON COLUMN forecast_log.duration_ms         IS 'Wall-clock duration of the run in milliseconds.';

CREATE INDEX IF NOT EXISTS idx_forecast_log_run_at
    ON forecast_log (run_at DESC);


-- ---------------------------------------------------------------------------
-- Table: survey_periods
-- Tracks quarterly GC survey windows.  One row per survey cycle.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS survey_periods (
    id          BIGSERIAL   PRIMARY KEY,
    quarter     TEXT        NOT NULL UNIQUE,  -- e.g. 'Q2 2025'
    opens_at    TIMESTAMPTZ NOT NULL,
    closes_at   TIMESTAMPTZ NOT NULL,
    is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  survey_periods             IS 'Quarterly GC survey windows — one row per survey cycle.';
COMMENT ON COLUMN survey_periods.quarter     IS 'Human-readable quarter label, e.g. Q2 2025.';
COMMENT ON COLUMN survey_periods.opens_at    IS 'Timestamp when submissions open.';
COMMENT ON COLUMN survey_periods.closes_at   IS 'Timestamp when submissions close.';
COMMENT ON COLUMN survey_periods.is_active   IS 'TRUE for the currently open survey period.';

-- Add published_at to track when results were published (idempotent)
ALTER TABLE survey_periods ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

-- Seed the current period (idempotent)
INSERT INTO survey_periods (quarter, opens_at, closes_at, is_active)
VALUES ('Q2 2025', '2025-04-01 00:00:00+00', '2025-05-21 23:59:59+00', TRUE)
ON CONFLICT (quarter) DO NOTHING;


-- ---------------------------------------------------------------------------
-- Table: survey_responses
-- One row per respondent per period.  Email is never stored — only a
-- SHA-256 hash is persisted to detect duplicate submissions.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS survey_responses (
    id                   BIGSERIAL   PRIMARY KEY,
    period_id            BIGINT      NOT NULL REFERENCES survey_periods (id) ON DELETE CASCADE,
    email_hash           TEXT        NOT NULL,  -- SHA-256(lowercase(trimmed(email)))

    -- Respondent profile
    revenue_band         TEXT,   -- 'under_5m' | '5_25m' | '25_100m' | '100_500m' | 'over_500m'
    work_type            TEXT,   -- 'residential' | 'commercial' | 'industrial' | 'infrastructure' | 'specialty' | 'mixed'
    region               TEXT,   -- 'northeast' | 'southeast' | 'midwest' | 'southwest' | 'west' | 'national'
    years_band           TEXT,   -- 'under_5' | '5_15' | '15_30' | 'over_30'

    -- Q1–Q5 answers
    backlog_outlook      INTEGER CHECK (backlog_outlook BETWEEN 1 AND 5),
    margin_outlook       INTEGER CHECK (margin_outlook BETWEEN 1 AND 5),
    labor_availability   INTEGER CHECK (labor_availability BETWEEN 1 AND 5),
    material_concern     TEXT,   -- 'none' | 'lumber' | 'steel' | 'concrete' | 'copper' | 'fuel' | 'other'
    market_outlook       INTEGER CHECK (market_outlook BETWEEN 1 AND 5),

    -- Optional open-text
    comments             TEXT,

    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT survey_responses_period_email_unique UNIQUE (period_id, email_hash)
);

COMMENT ON TABLE  survey_responses                   IS 'GC survey responses — one row per respondent per quarter.';
COMMENT ON COLUMN survey_responses.email_hash        IS 'SHA-256 of the lowercased, trimmed email — never the email itself.';
COMMENT ON COLUMN survey_responses.revenue_band      IS 'Respondent annual revenue bracket.';
COMMENT ON COLUMN survey_responses.material_concern  IS 'Primary material cost concern: none, lumber, steel, concrete, copper, fuel, or other.';

CREATE INDEX IF NOT EXISTS idx_survey_responses_period
    ON survey_responses (period_id, created_at DESC);


-- ---------------------------------------------------------------------------
-- Table: survey_results
-- Aggregated, published results for one survey period.  One row per quarter.
-- Computed by POST /api/survey/aggregate; never written by respondents.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS survey_results (
    id                BIGSERIAL    PRIMARY KEY,
    period_id         BIGINT       NOT NULL REFERENCES survey_periods (id) ON DELETE CASCADE UNIQUE,
    quarter           TEXT         NOT NULL,               -- 'Q2 2025'
    respondent_count  INTEGER      NOT NULL,
    published_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    -- Net Scores: (% positive − % negative) expressed as a –100 … +100 integer
    backlog_net       NUMERIC(5,1) NOT NULL,
    margin_net        NUMERIC(5,1) NOT NULL,
    labor_net         NUMERIC(5,1) NOT NULL,
    market_net        NUMERIC(5,1) NOT NULL,

    -- Quarter-over-Quarter changes (NULL for first published quarter)
    backlog_qoq       NUMERIC(5,1),
    margin_qoq        NUMERIC(5,1),
    labor_qoq         NUMERIC(5,1),
    market_qoq        NUMERIC(5,1),

    -- Distributions: { "1": pct, "2": pct, "3": pct, "4": pct, "5": pct }
    backlog_dist      JSONB NOT NULL DEFAULT '{}',
    margin_dist       JSONB NOT NULL DEFAULT '{}',
    labor_dist        JSONB NOT NULL DEFAULT '{}',
    market_dist       JSONB NOT NULL DEFAULT '{}',

    -- Material concern: { "lumber": pct, "steel": pct, ... }
    material_dist     JSONB NOT NULL DEFAULT '{}',

    -- Cross-tabs: { "northeast": { backlog_net: N, margin_net: N, ... }, ... }
    by_region         JSONB NOT NULL DEFAULT '{}',
    by_company_size   JSONB NOT NULL DEFAULT '{}',
    by_work_type      JSONB NOT NULL DEFAULT '{}'
);

COMMENT ON TABLE  survey_results                   IS 'Aggregated published results — one row per survey quarter.';
COMMENT ON COLUMN survey_results.backlog_net       IS 'Backlog Outlook net score: (% 4-5 minus % 1-2) × 100.';
COMMENT ON COLUMN survey_results.material_dist     IS 'Material concern distribution: percentage at each category.';
COMMENT ON COLUMN survey_results.by_region         IS 'Regional cross-tab: net scores broken down by respondent region.';

CREATE INDEX IF NOT EXISTS idx_survey_results_quarter
    ON survey_results (quarter);


-- =============================================================================
-- Row-Level Security (RLS)
--
-- The application uses two Supabase roles:
--   anon  — public (unauthenticated) reads via NEXT_PUBLIC_SUPABASE_ANON_KEY
--   service_role — server-side writes via SUPABASE_SERVICE_ROLE_KEY
--
-- RLS is enabled on all tables. The anon role may only read public data
-- (series metadata, observations, forecasts, signals). All write operations
-- and access to sensitive tables (api_keys, subscribers, harvest_log,
-- forecast_log) require the service_role key.
-- =============================================================================

-- Enable RLS on every table
ALTER TABLE series            ENABLE ROW LEVEL SECURITY;
ALTER TABLE observations      ENABLE ROW LEVEL SECURITY;
ALTER TABLE forecasts         ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys          ENABLE ROW LEVEL SECURITY;
ALTER TABLE signals           ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscribers       ENABLE ROW LEVEL SECURITY;
ALTER TABLE harvest_log       ENABLE ROW LEVEL SECURITY;
ALTER TABLE forecast_log      ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_periods    ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_responses  ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_results    ENABLE ROW LEVEL SECURITY;

-- Public read access for market data tables (anon can read, not write)
CREATE POLICY IF NOT EXISTS "anon_read_series"
    ON series FOR SELECT TO anon USING (true);

CREATE POLICY IF NOT EXISTS "anon_read_observations"
    ON observations FOR SELECT TO anon USING (true);

CREATE POLICY IF NOT EXISTS "anon_read_forecasts"
    ON forecasts FOR SELECT TO anon USING (true);

CREATE POLICY IF NOT EXISTS "anon_read_signals"
    ON signals FOR SELECT TO anon USING (true);

-- Survey: anon can read periods (to display quarter info) but not individual responses
CREATE POLICY IF NOT EXISTS "anon_read_survey_periods"
    ON survey_periods FOR SELECT TO anon USING (true);

-- api_keys: no anon access — service_role only (bypasses RLS by default in Supabase)
-- subscribers, harvest_log, forecast_log: service_role only (no anon policies = no access)

-- Service role gets full access on all tables (Supabase service_role bypasses RLS by default;
-- these explicit policies are belt-and-suspenders for any direct psql access patterns)
CREATE POLICY IF NOT EXISTS "service_all_series"
    ON series FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "service_all_observations"
    ON observations FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "service_all_forecasts"
    ON forecasts FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "service_all_api_keys"
    ON api_keys FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "service_all_signals"
    ON signals FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "service_all_subscribers"
    ON subscribers FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "service_all_harvest_log"
    ON harvest_log FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "service_all_forecast_log"
    ON forecast_log FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "service_all_survey_periods"
    ON survey_periods FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "service_all_survey_responses"
    ON survey_responses FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Survey results: public can read published results
CREATE POLICY IF NOT EXISTS "anon_read_survey_results"
    ON survey_results FOR SELECT TO anon USING (true);

CREATE POLICY IF NOT EXISTS "service_all_survey_results"
    ON survey_results FOR ALL TO service_role USING (true) WITH CHECK (true);
