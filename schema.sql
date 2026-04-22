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
    plan       TEXT        NOT NULL DEFAULT 'free',      -- 'free' | 'researcher' | 'enterprise'
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
COMMENT ON COLUMN api_keys.plan       IS 'Access tier: free (1k/day), researcher (10k/day, .edu verified), or enterprise.';
COMMENT ON COLUMN api_keys.key_prefix IS 'Human-readable key prefix (e.g. caiq_1a2b3c4d) shown in dashboards.';
COMMENT ON COLUMN api_keys.key_hash   IS 'SHA-256 hash of the full API key used for authentication lookup.';
COMMENT ON COLUMN api_keys.rpm_limit  IS 'Maximum requests per minute allowed for this key.';
COMMENT ON COLUMN api_keys.rpd_limit  IS 'Maximum requests per day allowed for this key.';
COMMENT ON COLUMN api_keys.usage      IS 'Running total of lifetime requests made with this key.';
COMMENT ON COLUMN api_keys.active     IS 'FALSE when the key has been revoked or suspended.';


-- ---------------------------------------------------------------------------
-- Table: nlq_queries
-- Log of Natural Language Query submissions for platform improvement.
-- Only the truncated question text and metadata are stored — no answer text.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS nlq_queries (
  id           BIGSERIAL   PRIMARY KEY,
  question     TEXT        NOT NULL,
  answer_chars INTEGER,
  sources_used TEXT[],
  asked_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_hash      TEXT
);

CREATE INDEX IF NOT EXISTS idx_nlq_queries_asked_at
  ON nlq_queries (asked_at DESC);

COMMENT ON TABLE  nlq_queries              IS 'Log of NLQ submissions for popularity tracking and platform improvement.';
COMMENT ON COLUMN nlq_queries.question     IS 'Question text, truncated to 200 chars for privacy.';
COMMENT ON COLUMN nlq_queries.answer_chars IS 'Character count of generated answer (not stored).';
COMMENT ON COLUMN nlq_queries.sources_used IS 'API routes queried to answer this question.';
COMMENT ON COLUMN nlq_queries.ip_hash      IS 'First 16 hex chars of SHA-256 of requester IP — not reversible.';

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


-- ---------------------------------------------------------------------------
-- Table: federal_cache
-- 24-hour Supabase cache for USASpending.gov state allocation data.
-- One row per cache key (effectively a single-row cache for the federal route).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS federal_cache (
    key        TEXT        PRIMARY KEY,
    data_json  JSONB       NOT NULL,
    cached_at  TIMESTAMPTZ NOT NULL
);

COMMENT ON TABLE  federal_cache           IS '24-hour cache for USASpending.gov state allocation data fetched by /api/federal.';
COMMENT ON COLUMN federal_cache.key       IS 'Cache key identifier (e.g. "state_allocations").';
COMMENT ON COLUMN federal_cache.data_json IS 'Full JSON payload from USASpending.gov, stored as JSONB.';
COMMENT ON COLUMN federal_cache.cached_at IS 'Timestamp of the last successful fetch from USASpending.gov.';

ALTER TABLE federal_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "service_all_federal_cache"
    ON federal_cache FOR ALL TO service_role USING (true) WITH CHECK (true);


-- ---------------------------------------------------------------------------
-- Table: weekly_briefs
-- Persisted AI-generated weekly intelligence briefs from Claude.
-- One row per generation run; the most recent row within the TTL is served.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS weekly_briefs (
    id             BIGSERIAL   PRIMARY KEY,
    brief_text     TEXT        NOT NULL,
    generated_at   TIMESTAMPTZ NOT NULL,
    data_snapshot  JSONB,
    model          TEXT,
    source         TEXT        NOT NULL DEFAULT 'static',  -- 'ai' | 'static'
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  weekly_briefs                IS 'AI-generated weekly intelligence briefs — one row per generation run.';
COMMENT ON COLUMN weekly_briefs.brief_text     IS 'Full brief text as returned by Claude.';
COMMENT ON COLUMN weekly_briefs.generated_at   IS 'Timestamp used for cache TTL comparisons.';
COMMENT ON COLUMN weekly_briefs.data_snapshot  IS 'Market data snapshot used as context for this generation.';
COMMENT ON COLUMN weekly_briefs.model          IS 'Claude model ID used for generation.';
COMMENT ON COLUMN weekly_briefs.source         IS 'ai when generated by Claude; static when the fallback was used.';

CREATE INDEX IF NOT EXISTS idx_weekly_briefs_generated_at
    ON weekly_briefs (generated_at DESC);

ALTER TABLE weekly_briefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "anon_read_weekly_briefs"
    ON weekly_briefs FOR SELECT TO anon USING (true);

CREATE POLICY IF NOT EXISTS "service_all_weekly_briefs"
    ON weekly_briefs FOR ALL TO service_role USING (true) WITH CHECK (true);


-- ---------------------------------------------------------------------------
-- Table: msa_boundaries
-- Geographic metadata for US Metropolitan Statistical Areas used by the
-- satellite BSI pipeline.  One row per MSA.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS msa_boundaries (
    msa_code    TEXT        PRIMARY KEY,
    msa_name    TEXT        NOT NULL,
    state_codes TEXT[]      NOT NULL DEFAULT '{}',
    bbox_west   NUMERIC,
    bbox_south  NUMERIC,
    bbox_east   NUMERIC,
    bbox_north  NUMERIC
);

COMMENT ON TABLE  msa_boundaries             IS 'Geographic boundaries for US MSAs used by the Sentinel-2 satellite pipeline.';
COMMENT ON COLUMN msa_boundaries.msa_code    IS 'CBSA code for the Metropolitan Statistical Area.';
COMMENT ON COLUMN msa_boundaries.msa_name    IS 'Human-readable MSA name (e.g. "Dallas-Fort Worth-Arlington, TX").';
COMMENT ON COLUMN msa_boundaries.state_codes IS 'Two-letter state codes contained within this MSA.';
COMMENT ON COLUMN msa_boundaries.bbox_west   IS 'Western longitude bound of the MSA bounding box.';
COMMENT ON COLUMN msa_boundaries.bbox_south  IS 'Southern latitude bound of the MSA bounding box.';
COMMENT ON COLUMN msa_boundaries.bbox_east   IS 'Eastern longitude bound of the MSA bounding box.';
COMMENT ON COLUMN msa_boundaries.bbox_north  IS 'Northern latitude bound of the MSA bounding box.';

ALTER TABLE msa_boundaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "anon_read_msa_boundaries"
    ON msa_boundaries FOR SELECT TO anon USING (true);

CREATE POLICY IF NOT EXISTS "service_all_msa_boundaries"
    ON msa_boundaries FOR ALL TO service_role USING (true) WITH CHECK (true);


-- ---------------------------------------------------------------------------
-- Table: satellite_bsi
-- Bare Soil Index (BSI) observations computed from Sentinel-2 imagery.
-- One row per MSA per observation date.  Written by the GitHub Actions
-- satellite pipeline.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS satellite_bsi (
    id                   BIGSERIAL   PRIMARY KEY,
    msa_code             TEXT        NOT NULL REFERENCES msa_boundaries (msa_code) ON DELETE CASCADE,
    observation_date     DATE        NOT NULL,
    bsi_mean             NUMERIC,
    bsi_change_90d       NUMERIC,
    bsi_change_yoy       NUMERIC,
    cloud_cover_pct      NUMERIC,
    valid_pixels         INTEGER,
    total_pixels         INTEGER,
    confidence           TEXT,
    false_positive_flags TEXT[],
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT satellite_bsi_msa_date_unique UNIQUE (msa_code, observation_date)
);

COMMENT ON TABLE  satellite_bsi                       IS 'Sentinel-2 Bare Soil Index observations per MSA per date.';
COMMENT ON COLUMN satellite_bsi.msa_code              IS 'CBSA code linking to msa_boundaries.';
COMMENT ON COLUMN satellite_bsi.observation_date      IS 'Date of the Sentinel-2 imagery pass.';
COMMENT ON COLUMN satellite_bsi.bsi_mean              IS 'Mean BSI value across valid pixels for this MSA.';
COMMENT ON COLUMN satellite_bsi.bsi_change_90d        IS 'BSI change vs. 90 days prior — primary activity signal.';
COMMENT ON COLUMN satellite_bsi.bsi_change_yoy        IS 'Year-over-year BSI change for seasonal context.';
COMMENT ON COLUMN satellite_bsi.cloud_cover_pct       IS 'Percentage of the scene obscured by cloud cover.';
COMMENT ON COLUMN satellite_bsi.confidence            IS 'Confidence classification: high | medium | low.';
COMMENT ON COLUMN satellite_bsi.false_positive_flags  IS 'Array of detected false-positive conditions (e.g. drought, wildfire).';

CREATE INDEX IF NOT EXISTS idx_satellite_bsi_msa_date
    ON satellite_bsi (msa_code, observation_date DESC);

ALTER TABLE satellite_bsi ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "anon_read_satellite_bsi"
    ON satellite_bsi FOR SELECT TO anon USING (true);

CREATE POLICY IF NOT EXISTS "service_all_satellite_bsi"
    ON satellite_bsi FOR ALL TO service_role USING (true) WITH CHECK (true);


-- ---------------------------------------------------------------------------
-- Table: signal_fusion
-- Fused activity signal per MSA combining BSI, federal award flow, and
-- storm event data.  One row per MSA (upserted on each /api/fusion/msa call).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS signal_fusion (
    msa_code            TEXT        PRIMARY KEY,
    computed_at         TIMESTAMPTZ NOT NULL,
    bsi_change_90d      NUMERIC,
    federal_awards_90d  NUMERIC,
    storm_events_90d    NUMERIC,
    classification      TEXT,
    confidence          TEXT,
    interpretation      TEXT
);

COMMENT ON TABLE  signal_fusion                      IS 'Fused construction activity signal per MSA — one row per MSA, upserted on each computation.';
COMMENT ON COLUMN signal_fusion.msa_code             IS 'CBSA code — primary key, one row per MSA.';
COMMENT ON COLUMN signal_fusion.computed_at          IS 'Timestamp of the most recent fusion computation.';
COMMENT ON COLUMN signal_fusion.bsi_change_90d       IS 'BSI change over 90 days at time of computation.';
COMMENT ON COLUMN signal_fusion.federal_awards_90d   IS 'Federal construction award dollars in the MSA over 90 days.';
COMMENT ON COLUMN signal_fusion.storm_events_90d     IS 'NOAA storm events in the MSA primary state over 90 days.';
COMMENT ON COLUMN signal_fusion.classification       IS 'Activity classification: HIGH_ACTIVITY | MODERATE | LOW | UNCERTAIN.';
COMMENT ON COLUMN signal_fusion.confidence           IS 'Signal confidence: high | medium | low.';
COMMENT ON COLUMN signal_fusion.interpretation       IS 'Human-readable explanation of the fused signal.';

ALTER TABLE signal_fusion ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "anon_read_signal_fusion"
    ON signal_fusion FOR SELECT TO anon USING (true);

CREATE POLICY IF NOT EXISTS "service_all_signal_fusion"
    ON signal_fusion FOR ALL TO service_role USING (true) WITH CHECK (true);


-- ---------------------------------------------------------------------------
-- Tables: permit_sources, city_permits, permit_monthly_agg
-- City-level building permit data harvested from Socrata open data portals.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS permit_sources (
    city_code     TEXT        PRIMARY KEY,
    city_name     TEXT        NOT NULL,
    state_code    TEXT        NOT NULL,
    msa_code      TEXT,
    api_url       TEXT        NOT NULL,
    api_dataset   TEXT        NOT NULL,
    status        TEXT        NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active','degraded','disabled')),
    last_fetched  TIMESTAMPTZ,
    record_count  INTEGER     DEFAULT 0
);

COMMENT ON TABLE  permit_sources             IS 'Catalog of city Socrata open-data permit endpoints harvested by ConstructAIQ.';
COMMENT ON COLUMN permit_sources.city_code   IS 'Short identifier for the city, e.g. NYC, LAX, CHI.';
COMMENT ON COLUMN permit_sources.msa_code    IS 'Links to msa_boundaries.msa_code for geographic context.';
COMMENT ON COLUMN permit_sources.api_url     IS 'Full Socrata API endpoint URL for this city.';
COMMENT ON COLUMN permit_sources.api_dataset IS 'Socrata dataset identifier (four×four code).';
COMMENT ON COLUMN permit_sources.status      IS 'Harvest status: active, degraded (partial failures), or disabled.';
COMMENT ON COLUMN permit_sources.last_fetched IS 'Timestamp of the most recent successful harvest.';
COMMENT ON COLUMN permit_sources.record_count IS 'Total permit records stored for this city.';


CREATE TABLE IF NOT EXISTS city_permits (
    id            BIGSERIAL   PRIMARY KEY,
    city_code     TEXT        REFERENCES permit_sources(city_code),
    permit_number TEXT        NOT NULL,
    permit_type   TEXT,
    permit_class  TEXT,
    status        TEXT,
    valuation     NUMERIC,
    sqft          NUMERIC,
    units         INTEGER,
    address       TEXT,
    zip_code      TEXT,
    latitude      NUMERIC,
    longitude     NUMERIC,
    applied_date  DATE,
    issued_date   DATE,
    finaled_date  DATE,
    fetched_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    raw_json      JSONB,

    UNIQUE (city_code, permit_number)
);

COMMENT ON TABLE  city_permits                IS 'Individual building permit records normalized from city Socrata portals.';
COMMENT ON COLUMN city_permits.permit_type    IS 'Normalized type: new_construction, addition, alteration, demolition, other.';
COMMENT ON COLUMN city_permits.permit_class   IS 'Normalized use class: residential, commercial, industrial, other.';
COMMENT ON COLUMN city_permits.valuation      IS 'Estimated project value in USD.';
COMMENT ON COLUMN city_permits.sqft           IS 'Square footage of the permitted work, if provided.';
COMMENT ON COLUMN city_permits.units          IS 'Housing units, if residential permit.';
COMMENT ON COLUMN city_permits.raw_json       IS 'Original Socrata API response record for auditing and re-normalization.';

CREATE INDEX IF NOT EXISTS idx_city_permits_city_date
    ON city_permits (city_code, issued_date DESC);

CREATE INDEX IF NOT EXISTS idx_city_permits_type
    ON city_permits (city_code, permit_type, permit_class);

CREATE INDEX IF NOT EXISTS idx_city_permits_zip
    ON city_permits (city_code, zip_code);


CREATE TABLE IF NOT EXISTS permit_monthly_agg (
    id              BIGSERIAL   PRIMARY KEY,
    city_code       TEXT        REFERENCES permit_sources(city_code),
    year_month      TEXT        NOT NULL,
    permit_type     TEXT        NOT NULL,
    permit_class    TEXT        NOT NULL,
    permit_count    INTEGER     NOT NULL DEFAULT 0,
    total_valuation NUMERIC     DEFAULT 0,
    total_units     INTEGER     DEFAULT 0,
    total_sqft      NUMERIC     DEFAULT 0,
    computed_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (city_code, year_month, permit_type, permit_class)
);

COMMENT ON TABLE  permit_monthly_agg              IS 'Pre-computed monthly permit aggregations per city for fast dashboard queries.';
COMMENT ON COLUMN permit_monthly_agg.year_month   IS 'ISO year-month string, e.g. 2025-03.';
COMMENT ON COLUMN permit_monthly_agg.permit_type  IS 'Aggregated permit type bucket or "all".';
COMMENT ON COLUMN permit_monthly_agg.permit_class IS 'Aggregated permit class bucket or "all".';
COMMENT ON COLUMN permit_monthly_agg.computed_at  IS 'Timestamp when this aggregation row was last recomputed.';

CREATE INDEX IF NOT EXISTS idx_permit_monthly_city
    ON permit_monthly_agg (city_code, year_month DESC);

-- RLS
ALTER TABLE permit_sources    ENABLE ROW LEVEL SECURITY;
ALTER TABLE city_permits      ENABLE ROW LEVEL SECURITY;
ALTER TABLE permit_monthly_agg ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "anon_read_permit_sources"
    ON permit_sources FOR SELECT TO anon USING (true);

CREATE POLICY IF NOT EXISTS "anon_read_city_permits"
    ON city_permits FOR SELECT TO anon USING (true);

CREATE POLICY IF NOT EXISTS "anon_read_permit_monthly_agg"
    ON permit_monthly_agg FOR SELECT TO anon USING (true);

CREATE POLICY IF NOT EXISTS "service_all_permit_sources"
    ON permit_sources FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "service_all_city_permits"
    ON city_permits FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "service_all_permit_monthly_agg"
    ON permit_monthly_agg FOR ALL TO service_role USING (true) WITH CHECK (true);
