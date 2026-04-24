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
    role       TEXT,                                    -- 'contractor' | 'lender' | 'supplier' | 'developer' | 'owner' | 'investor'
    key_prefix TEXT        NOT NULL,                    -- 'caiq_' + 8 hex chars (shown to users)
    key_hash   TEXT        NOT NULL UNIQUE,             -- SHA-256 of the full key (never store plaintext)
    rpm_limit  INTEGER     NOT NULL DEFAULT 60,
    rpd_limit  INTEGER     NOT NULL DEFAULT 1000,
    usage      INTEGER     NOT NULL DEFAULT 0,
    active     BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Idempotent migration: add role column if it does not yet exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'api_keys' AND column_name = 'role'
  ) THEN
    ALTER TABLE api_keys ADD COLUMN role TEXT;
  END IF;
END $$;

COMMENT ON TABLE  api_keys            IS 'API key registry for external ConstructAIQ API consumers.';
COMMENT ON COLUMN api_keys.email      IS 'Contact email; unique — one active key per email.';
COMMENT ON COLUMN api_keys.plan       IS 'Access tier: free (1k/day), researcher (10k/day, .edu verified), or enterprise.';
COMMENT ON COLUMN api_keys.role       IS 'Self-reported user role: contractor | lender | supplier | developer | owner | investor.';
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




-- =============================================================================
-- Row-Level Security (RLS)
--
-- The application uses two Supabase roles:
--   anon  — public (unauthenticated) reads via NEXT_PUBLIC_SUPABASE_ANON_KEY
--   service_role — server-side writes via SUPABASE_SERVICE_ROLE_KEY
--
-- RLS is enabled on all tables. The anon role may only read public data
-- (series metadata, observations, forecasts). All write operations and access
-- to sensitive tables (api_keys) require the service_role key.
-- =============================================================================

-- Enable RLS on every table
ALTER TABLE series            ENABLE ROW LEVEL SECURITY;
ALTER TABLE observations      ENABLE ROW LEVEL SECURITY;
ALTER TABLE forecasts         ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys          ENABLE ROW LEVEL SECURITY;

-- Drop all existing RLS policies before recreating.
-- PostgreSQL does not support CREATE POLICY IF NOT EXISTS; this DO block
-- makes the file safe to re-run idempotently.
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
      AND policyname IN (
        'anon_read_series', 'anon_read_observations', 'anon_read_forecasts',
        'service_all_series', 'service_all_observations', 'service_all_forecasts',
        'service_all_api_keys', 'service_all_federal_cache',
        'anon_read_weekly_briefs', 'service_all_weekly_briefs',
        'anon_read_msa_boundaries', 'service_all_msa_boundaries',
        'anon_read_satellite_bsi', 'service_all_satellite_bsi',
        'anon_read_signal_fusion', 'service_all_signal_fusion',
        'anon_read_permit_sources', 'anon_read_city_permits', 'anon_read_permit_monthly_agg',
        'service_all_permit_sources', 'service_all_city_permits', 'service_all_permit_monthly_agg',
        'anon_read_projects', 'anon_read_project_events',
        'service_all_projects', 'service_all_project_events',
        'service_all_push_subscriptions', 'service_all_push_notifications_log',
        'anon_read_opportunity_scores', 'service_all_opportunity_scores',
        'service_all_watchlists',
        'anon_read_entities', 'service_all_entities',
        'anon_read_entity_edges', 'service_all_entity_edges',
        'anon_read_event_log', 'service_all_event_log',
        'anon_read_project_state_history', 'service_all_project_state_history',
        'anon_read_federal_solicitations', 'service_all_federal_solicitations'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
  END LOOP;
END;
$$;

-- Public read access for market data tables (anon can read, not write)
CREATE POLICY "anon_read_series"
    ON series FOR SELECT TO anon USING (true);

CREATE POLICY "anon_read_observations"
    ON observations FOR SELECT TO anon USING (true);

CREATE POLICY "anon_read_forecasts"
    ON forecasts FOR SELECT TO anon USING (true);

-- api_keys: no anon access — service_role only (bypasses RLS by default in Supabase)

-- Service role gets full access on all tables (Supabase service_role bypasses RLS by default;
-- these explicit policies are belt-and-suspenders for any direct psql access patterns)
CREATE POLICY "service_all_series"
    ON series FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_all_observations"
    ON observations FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_all_forecasts"
    ON forecasts FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_all_api_keys"
    ON api_keys FOR ALL TO service_role USING (true) WITH CHECK (true);


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

CREATE POLICY "service_all_federal_cache"
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

CREATE POLICY "anon_read_weekly_briefs"
    ON weekly_briefs FOR SELECT TO anon USING (true);

CREATE POLICY "service_all_weekly_briefs"
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

CREATE POLICY "anon_read_msa_boundaries"
    ON msa_boundaries FOR SELECT TO anon USING (true);

CREATE POLICY "service_all_msa_boundaries"
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

CREATE POLICY "anon_read_satellite_bsi"
    ON satellite_bsi FOR SELECT TO anon USING (true);

CREATE POLICY "service_all_satellite_bsi"
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

CREATE POLICY "anon_read_signal_fusion"
    ON signal_fusion FOR SELECT TO anon USING (true);

CREATE POLICY "service_all_signal_fusion"
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

CREATE POLICY "anon_read_permit_sources"
    ON permit_sources FOR SELECT TO anon USING (true);

CREATE POLICY "anon_read_city_permits"
    ON city_permits FOR SELECT TO anon USING (true);

CREATE POLICY "anon_read_permit_monthly_agg"
    ON permit_monthly_agg FOR SELECT TO anon USING (true);

CREATE POLICY "service_all_permit_sources"
    ON permit_sources FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_all_city_permits"
    ON city_permits FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_all_permit_monthly_agg"
    ON permit_monthly_agg FOR ALL TO service_role USING (true) WITH CHECK (true);


-- ---------------------------------------------------------------------------
-- Tables: projects, project_events
-- Individual high-value construction projects promoted from permit data.
-- A "project" is any permit with valuation > $500K or permit_type = 'new_construction'.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS projects (
  id                   BIGSERIAL    PRIMARY KEY,
  city_code            TEXT         REFERENCES permit_sources(city_code),
  permit_id            BIGINT       REFERENCES city_permits(id),
  permit_number        TEXT         NOT NULL,

  -- Project identity
  project_name         TEXT,
  project_type         TEXT,
  building_class       TEXT,
  status               TEXT,

  -- Location
  address              TEXT,
  city                 TEXT,
  state_code           TEXT,
  zip_code             TEXT,
  latitude             NUMERIC,
  longitude            NUMERIC,

  -- Scale
  valuation            NUMERIC,
  sqft                 NUMERIC,
  units                INTEGER,

  -- Timeline
  applied_date         DATE,
  approved_date        DATE,
  started_date         DATE,
  estimated_completion DATE,

  -- Enrichment signals
  satellite_bsi_change NUMERIC,
  federal_award_match  BOOLEAN      NOT NULL DEFAULT FALSE,
  federal_award_id     TEXT,

  -- AI-generated summary
  ai_summary           TEXT,
  ai_generated_at      TIMESTAMPTZ,

  -- Metadata
  first_seen_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  last_updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  UNIQUE (city_code, permit_number)
);

COMMENT ON TABLE  projects                    IS 'High-value construction projects promoted from permit data (valuation > $500K or new construction).';
COMMENT ON COLUMN projects.project_type       IS 'new_construction, major_renovation, or demolition.';
COMMENT ON COLUMN projects.building_class     IS 'residential, commercial, industrial, or mixed.';
COMMENT ON COLUMN projects.status             IS 'applied, approved, active, completed, or expired.';
COMMENT ON COLUMN projects.satellite_bsi_change IS 'BSI 90-day change from signal_fusion if MSA matches.';
COMMENT ON COLUMN projects.federal_award_match  IS 'TRUE if a USASpending award was matched nearby.';
COMMENT ON COLUMN projects.ai_summary           IS 'One-sentence AI-generated project description from Claude.';

CREATE INDEX IF NOT EXISTS idx_projects_city_val
  ON projects (city_code, valuation DESC);

CREATE INDEX IF NOT EXISTS idx_projects_status
  ON projects (status, building_class);

CREATE INDEX IF NOT EXISTS idx_projects_location
  ON projects (state_code, zip_code);

CREATE INDEX IF NOT EXISTS idx_projects_date
  ON projects (applied_date DESC);


CREATE TABLE IF NOT EXISTS project_events (
  id          BIGSERIAL    PRIMARY KEY,
  project_id  BIGINT       REFERENCES projects(id) ON DELETE CASCADE,
  event_type  TEXT         NOT NULL,
  event_date  DATE         NOT NULL,
  description TEXT,
  value       NUMERIC,
  source      TEXT,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  project_events             IS 'Key activity events on a project (permit issued, satellite surge, federal award matched).';
COMMENT ON COLUMN project_events.event_type  IS 'permit_issued, permit_finaled, satellite_surge, or federal_award_matched.';
COMMENT ON COLUMN project_events.source      IS 'Origin of the event: permit, satellite, or usaspending.';

CREATE INDEX IF NOT EXISTS idx_project_events_project
  ON project_events (project_id, event_date DESC);

-- RLS
ALTER TABLE projects       ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_read_projects"
  ON projects FOR SELECT TO anon USING (true);

CREATE POLICY "anon_read_project_events"
  ON project_events FOR SELECT TO anon USING (true);

CREATE POLICY "service_all_projects"
  ON projects FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_all_project_events"
  ON project_events FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- Table: push_subscriptions
-- Web Push (VAPID) subscription records — one row per browser/device that
-- has opted in to push notifications.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id              BIGSERIAL    PRIMARY KEY,
  endpoint        TEXT         NOT NULL UNIQUE,
  p256dh          TEXT         NOT NULL,  -- public key
  auth            TEXT         NOT NULL,  -- auth secret
  user_agent      TEXT,
  subscribed_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  last_notified   TIMESTAMPTZ,

  -- User preferences — which alert types they want
  alert_warn      BOOLEAN      NOT NULL DEFAULT TRUE,
  alert_federal   BOOLEAN      NOT NULL DEFAULT TRUE,
  alert_satellite BOOLEAN      NOT NULL DEFAULT TRUE,
  alert_forecast  BOOLEAN      NOT NULL DEFAULT FALSE,

  -- For unsubscribe / expiry cleanup
  is_active       BOOLEAN      NOT NULL DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_active
  ON push_subscriptions (is_active, last_notified);

COMMENT ON TABLE  push_subscriptions              IS 'Web Push (VAPID) browser/device subscriptions.';
COMMENT ON COLUMN push_subscriptions.p256dh       IS 'Browser-generated ECDH public key for payload encryption.';
COMMENT ON COLUMN push_subscriptions.auth         IS 'Browser-generated auth secret for payload encryption.';
COMMENT ON COLUMN push_subscriptions.alert_warn   IS 'Receive WARN Act layoff alerts.';
COMMENT ON COLUMN push_subscriptions.alert_federal IS 'Receive federal award alerts.';
COMMENT ON COLUMN push_subscriptions.alert_satellite IS 'Receive satellite construction surge alerts.';
COMMENT ON COLUMN push_subscriptions.alert_forecast IS 'Receive forecast revision alerts.';

-- RLS
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_all_push_subscriptions"
  ON push_subscriptions FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- Table: push_notifications_log
-- Audit log of every push notification sent (or attempted).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS push_notifications_log (
  id                BIGSERIAL    PRIMARY KEY,
  subscription_id   BIGINT       REFERENCES push_subscriptions(id),
  notification_type TEXT         NOT NULL,  -- 'warn','federal','satellite','forecast'
  title             TEXT         NOT NULL,
  body              TEXT         NOT NULL,
  sent_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  delivered         BOOLEAN      DEFAULT NULL,
  error_message     TEXT
);

CREATE INDEX IF NOT EXISTS idx_push_notifications_log_sub
  ON push_notifications_log (subscription_id, sent_at DESC);

COMMENT ON TABLE  push_notifications_log                    IS 'Audit log of push notification delivery attempts.';
COMMENT ON COLUMN push_notifications_log.notification_type  IS 'Signal category: warn, federal, satellite, or forecast.';
COMMENT ON COLUMN push_notifications_log.delivered          IS 'NULL = unknown, TRUE = push service accepted, FALSE = error.';

-- RLS
ALTER TABLE push_notifications_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_all_push_notifications_log"
  ON push_notifications_log FOR ALL TO service_role USING (true) WITH CHECK (true);


-- ---------------------------------------------------------------------------
-- Table: webhook_subscriptions
-- Developer-registered webhook endpoints that receive POST callbacks when
-- platform events fire (signal.fired, forecast.updated, etc.).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS webhook_subscriptions (
  id           BIGSERIAL    PRIMARY KEY,
  api_key_hash TEXT         NOT NULL,
  url          TEXT         NOT NULL,
  events       TEXT[]       NOT NULL,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  last_fired   TIMESTAMPTZ,
  is_active    BOOLEAN      NOT NULL DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_webhooks_active
  ON webhook_subscriptions (is_active);

COMMENT ON TABLE  webhook_subscriptions              IS 'Developer-registered webhook endpoints for event-driven callbacks.';
COMMENT ON COLUMN webhook_subscriptions.api_key_hash IS 'SHA-256 hash of the registering API key — links to api_keys.key_hash.';
COMMENT ON COLUMN webhook_subscriptions.url          IS 'HTTPS endpoint that receives POST callbacks.';
COMMENT ON COLUMN webhook_subscriptions.events       IS 'Array of subscribed event types (e.g. signal.fired, forecast.updated).';
COMMENT ON COLUMN webhook_subscriptions.last_fired   IS 'Timestamp of the most recent successful delivery to this endpoint.';

ALTER TABLE webhook_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_all_webhook_subscriptions"
  ON webhook_subscriptions FOR ALL TO service_role USING (true) WITH CHECK (true);


-- ---------------------------------------------------------------------------
-- Table: opportunity_scores
-- Daily-computed metro-level Opportunity Truth Index scores (0–100).
-- One row per (metro_code, computed_at) — the most recent row within its
-- valid_through window is served to consumers of /api/opportunity-score.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS opportunity_scores (
    id              BIGSERIAL    PRIMARY KEY,
    metro_code      TEXT         NOT NULL,
    score           INTEGER      NOT NULL,
    classification  TEXT         NOT NULL,
    driver_json     JSONB        NOT NULL,
    confidence      TEXT         NOT NULL,
    computed_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    valid_through   TIMESTAMPTZ  NOT NULL,

    CONSTRAINT opportunity_scores_metro_computed_unique
        UNIQUE (metro_code, computed_at)
);

COMMENT ON TABLE  opportunity_scores                IS 'Daily-computed metro Opportunity Truth Index scores (0–100) with driver attribution.';
COMMENT ON COLUMN opportunity_scores.metro_code     IS 'Metro identifier — matches permit_sources.city_code (e.g. PHX, NYC, LAX).';
COMMENT ON COLUMN opportunity_scores.score          IS 'Composite opportunity score, 0–100 integer.';
COMMENT ON COLUMN opportunity_scores.classification IS 'FORMATION | BUILDING | STABLE | COOLING | CONTRACTING.';
COMMENT ON COLUMN opportunity_scores.driver_json    IS 'Per-component driver breakdown, top 3 drivers, and metro metadata.';
COMMENT ON COLUMN opportunity_scores.confidence     IS 'HIGH | MEDIUM | LOW — based on how many component signals are live vs fallback.';
COMMENT ON COLUMN opportunity_scores.computed_at    IS 'Timestamp the score was computed.';
COMMENT ON COLUMN opportunity_scores.valid_through  IS 'Serve-fresh cutoff — scores older than this should be recomputed.';

CREATE INDEX IF NOT EXISTS idx_opportunity_scores_metro_latest
    ON opportunity_scores (metro_code, computed_at DESC);

ALTER TABLE opportunity_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_read_opportunity_scores"
    ON opportunity_scores FOR SELECT TO anon USING (true);

CREATE POLICY "service_all_opportunity_scores"
    ON opportunity_scores FOR ALL TO service_role USING (true) WITH CHECK (true);


-- ---------------------------------------------------------------------------
-- Table: watchlists
-- Server-persisted user watchlists keyed by API-key hash. Each row is a single
-- watched entity (metro, state, project, or federal state row). Unlike the
-- earlier localStorage-only "My Markets" list, these persist across devices
-- and power the WatchlistCard + daily signal digest.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS watchlists (
    id            BIGSERIAL    PRIMARY KEY,
    api_key_hash  TEXT         NOT NULL,
    entity_type   TEXT         NOT NULL,          -- 'metro' | 'state' | 'project' | 'federal'
    entity_id     TEXT         NOT NULL,          -- 'PHX' | 'TX' | project UUID | state code
    entity_label  TEXT         NOT NULL,
    added_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    last_signal   JSONB,                          -- cached last alert for this entity

    CONSTRAINT watchlists_owner_entity_unique
        UNIQUE (api_key_hash, entity_type, entity_id)
);

COMMENT ON TABLE  watchlists               IS 'Server-persisted per-API-key watchlists — one row per watched entity.';
COMMENT ON COLUMN watchlists.api_key_hash  IS 'SHA-256 hash of the owning API key — links to api_keys.key_hash.';
COMMENT ON COLUMN watchlists.entity_type   IS 'Entity category: metro, state, project, or federal.';
COMMENT ON COLUMN watchlists.entity_id     IS 'Entity identifier within its type (e.g. PHX for metro, TX for state).';
COMMENT ON COLUMN watchlists.entity_label  IS 'Human-readable label cached at add time (e.g. "Phoenix, AZ").';
COMMENT ON COLUMN watchlists.last_signal   IS 'Most recent alert payload observed for this entity.';

-- Hot path: list a user's watchlist ordered by recency
CREATE INDEX IF NOT EXISTS idx_watchlists_owner_added
    ON watchlists (api_key_hash, added_at DESC);

ALTER TABLE watchlists ENABLE ROW LEVEL SECURITY;

-- No anon policy — all access goes through the service role with the
-- authenticated api_key_hash supplied by the route handler.
CREATE POLICY "service_all_watchlists"
    ON watchlists FOR ALL TO service_role USING (true) WITH CHECK (true);


-- ---------------------------------------------------------------------------
-- PostGIS extension — required for GEOGRAPHY type on entities.geo_point.
-- Pre-enabled on Supabase; this is a no-op if already installed.
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS postgis;


-- ---------------------------------------------------------------------------
-- Column: projects.lifecycle_state
-- Lifecycle phase for tracked projects, driven by event_log signals.
-- Values: inactive|forming|mobilizing|active|stalled|completed|ghost
-- ---------------------------------------------------------------------------
ALTER TABLE projects ADD COLUMN IF NOT EXISTS
  lifecycle_state TEXT NOT NULL DEFAULT 'forming';

COMMENT ON COLUMN projects.lifecycle_state IS
  'Project lifecycle phase: inactive|forming|mobilizing|active|stalled|completed|ghost.';


-- ---------------------------------------------------------------------------
-- Table: entities
-- Canonical entity registry — deduplicated across all data sources.
-- One row per (type, external_id, source) triple.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS entities (
  id           BIGSERIAL    PRIMARY KEY,
  type         TEXT         NOT NULL,
  external_id  TEXT         NOT NULL,
  source       TEXT         NOT NULL,
  label        TEXT         NOT NULL,
  geo_point    GEOGRAPHY(POINT, 4326),
  state_code   TEXT,
  metro_code   TEXT,
  attributes   JSONB        NOT NULL DEFAULT '{}',
  first_seen   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  last_updated TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  UNIQUE (type, external_id, source)
);

COMMENT ON TABLE  entities              IS 'Canonical entity registry — deduplicated across all data sources (sites, permits, projects, contractors, agencies, awards).';
COMMENT ON COLUMN entities.type         IS 'Entity category: site|permit|project|contractor|agency|award.';
COMMENT ON COLUMN entities.external_id  IS 'Source system identifier (e.g. permit number, USASpending award ID).';
COMMENT ON COLUMN entities.source       IS 'Originating data source: census|usaspending|socrata|sam_gov.';
COMMENT ON COLUMN entities.label        IS 'Human-readable display name for this entity.';
COMMENT ON COLUMN entities.geo_point    IS 'WGS-84 point geometry for map rendering and spatial queries.';
COMMENT ON COLUMN entities.state_code   IS 'Two-letter US state code.';
COMMENT ON COLUMN entities.metro_code   IS 'CBSA code linking to msa_boundaries.msa_code.';
COMMENT ON COLUMN entities.attributes   IS 'Source-specific key/value metadata (e.g. contractor DUNS, permit valuation).';
COMMENT ON COLUMN entities.first_seen   IS 'Timestamp when this entity was first ingested.';
COMMENT ON COLUMN entities.last_updated IS 'Timestamp of the most recent upsert for this entity.';

CREATE INDEX IF NOT EXISTS idx_entities_type_source
  ON entities (type, source);

CREATE INDEX IF NOT EXISTS idx_entities_state
  ON entities (state_code);

CREATE INDEX IF NOT EXISTS idx_entities_metro
  ON entities (metro_code);

CREATE INDEX IF NOT EXISTS idx_entities_geo
  ON entities USING GIST (geo_point);

ALTER TABLE entities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_read_entities"
  ON entities FOR SELECT TO anon USING (true);

CREATE POLICY "service_all_entities"
  ON entities FOR ALL TO service_role USING (true) WITH CHECK (true);


-- ---------------------------------------------------------------------------
-- Table: entity_edges
-- Directed graph edges linking related entities across source systems.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS entity_edges (
  id           BIGSERIAL    PRIMARY KEY,
  from_id      BIGINT       NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  to_id        BIGINT       NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  edge_type    TEXT         NOT NULL,
  confidence   FLOAT        NOT NULL DEFAULT 1.0,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  entity_edges            IS 'Directed graph edges linking related entities across source systems.';
COMMENT ON COLUMN entity_edges.from_id    IS 'Source entity — e.g. the permit or site.';
COMMENT ON COLUMN entity_edges.to_id      IS 'Target entity — e.g. the project or contractor.';
COMMENT ON COLUMN entity_edges.edge_type  IS 'Relationship type: permit_to_project|award_to_contractor|site_to_permit.';
COMMENT ON COLUMN entity_edges.confidence IS 'Match confidence (0.0–1.0); 1.0 = exact deterministic link.';

CREATE INDEX IF NOT EXISTS idx_entity_edges_from
  ON entity_edges (from_id);

CREATE INDEX IF NOT EXISTS idx_entity_edges_to
  ON entity_edges (to_id);

CREATE INDEX IF NOT EXISTS idx_entity_edges_type
  ON entity_edges (edge_type);

ALTER TABLE entity_edges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_read_entity_edges"
  ON entity_edges FOR SELECT TO anon USING (true);

CREATE POLICY "service_all_entity_edges"
  ON entity_edges FOR ALL TO service_role USING (true) WITH CHECK (true);


-- ---------------------------------------------------------------------------
-- Table: event_log
-- Immutable chronological event log for all tracked entities.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS event_log (
  id           BIGSERIAL    PRIMARY KEY,
  entity_id    BIGINT       REFERENCES entities(id) ON DELETE SET NULL,
  event_type   TEXT         NOT NULL,
  event_date   TIMESTAMPTZ  NOT NULL,
  source       TEXT         NOT NULL,
  payload      JSONB        NOT NULL DEFAULT '{}',
  signal_value FLOAT,
  ingested_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  event_log               IS 'Immutable chronological event log for all tracked entities.';
COMMENT ON COLUMN event_log.entity_id     IS 'Associated entity; NULL when not yet linked to a canonical entity.';
COMMENT ON COLUMN event_log.event_type    IS 'Event category: permit.filed|permit.issued|permit.amended|award.made|award.modified|site.activated|site.progressing|solicitation.posted|warn.filed|materials.shock.';
COMMENT ON COLUMN event_log.event_date    IS 'Business date the event occurred (may differ from ingested_at).';
COMMENT ON COLUMN event_log.source        IS 'Data source that generated this event.';
COMMENT ON COLUMN event_log.payload       IS 'Full event payload — schema varies by event_type.';
COMMENT ON COLUMN event_log.signal_value  IS 'Normalized signal strength (0–100) for anomaly and alert ranking.';
COMMENT ON COLUMN event_log.ingested_at   IS 'Timestamp when this row was written to the database.';

CREATE INDEX IF NOT EXISTS idx_event_log_entity
  ON event_log (entity_id);

CREATE INDEX IF NOT EXISTS idx_event_log_type
  ON event_log (event_type);

CREATE INDEX IF NOT EXISTS idx_event_log_date
  ON event_log (event_date DESC);

ALTER TABLE event_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_read_event_log"
  ON event_log FOR SELECT TO anon USING (true);

CREATE POLICY "service_all_event_log"
  ON event_log FOR ALL TO service_role USING (true) WITH CHECK (true);


-- ---------------------------------------------------------------------------
-- Table: project_state_history
-- Audit log of lifecycle state transitions for tracked projects.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS project_state_history (
  id               BIGSERIAL    PRIMARY KEY,
  project_id       BIGINT       NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  from_state       TEXT,
  to_state         TEXT         NOT NULL,
  transitioned_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  confidence       FLOAT        NOT NULL DEFAULT 1.0,
  trigger_event_id BIGINT       REFERENCES event_log(id) ON DELETE SET NULL,
  explanation      TEXT
);

COMMENT ON TABLE  project_state_history                   IS 'Audit log of lifecycle state transitions for tracked projects.';
COMMENT ON COLUMN project_state_history.project_id        IS 'Foreign key to projects.id.';
COMMENT ON COLUMN project_state_history.from_state        IS 'Previous lifecycle state; NULL for the initial transition.';
COMMENT ON COLUMN project_state_history.to_state          IS 'New lifecycle state: inactive|forming|mobilizing|active|stalled|completed|ghost.';
COMMENT ON COLUMN project_state_history.transitioned_at   IS 'Timestamp when the transition was recorded.';
COMMENT ON COLUMN project_state_history.confidence        IS 'Confidence in this classification (0.0–1.0).';
COMMENT ON COLUMN project_state_history.trigger_event_id  IS 'The event_log row that triggered this state change.';
COMMENT ON COLUMN project_state_history.explanation       IS 'Human-readable rationale for the transition.';

CREATE INDEX IF NOT EXISTS idx_project_state_history_project
  ON project_state_history (project_id, transitioned_at DESC);

CREATE INDEX IF NOT EXISTS idx_project_state_history_state
  ON project_state_history (to_state);

ALTER TABLE project_state_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_read_project_state_history"
  ON project_state_history FOR SELECT TO anon USING (true);

CREATE POLICY "service_all_project_state_history"
  ON project_state_history FOR ALL TO service_role USING (true) WITH CHECK (true);


-- ---------------------------------------------------------------------------
-- Table: federal_solicitations
-- SAM.gov federal solicitations in construction NAICS codes (236x/237x/238x).
-- Written by /api/cron/solicitations — upserted daily on notice_id.
-- This table is a 3–12 month leading indicator for federal construction spend.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS federal_solicitations (
  id              BIGSERIAL    PRIMARY KEY,
  notice_id       TEXT         UNIQUE NOT NULL,
  title           TEXT         NOT NULL,
  agency          TEXT         NOT NULL,
  office          TEXT,
  state_code      TEXT,
  naics           TEXT,
  posted_date     DATE         NOT NULL,
  response_due    DATE,
  award_date      DATE,
  estimated_value BIGINT,
  contract_type   TEXT,
  status          TEXT         NOT NULL DEFAULT 'OPEN',
  award_notice_id TEXT,
  fetched_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  federal_solicitations                  IS 'SAM.gov construction solicitations (NAICS 236x/237x/238x) — leading indicator for federal spend.';
COMMENT ON COLUMN federal_solicitations.notice_id        IS 'SAM.gov canonical notice identifier — unique per solicitation.';
COMMENT ON COLUMN federal_solicitations.status           IS 'OPEN | AWARDED | CANCELLED | CLOSED.';
COMMENT ON COLUMN federal_solicitations.estimated_value  IS 'Estimated contract value in USD, when disclosed.';
COMMENT ON COLUMN federal_solicitations.award_notice_id  IS 'Links to the award notice when the solicitation converts to a contract.';

CREATE INDEX IF NOT EXISTS idx_sol_state  ON federal_solicitations(state_code);
CREATE INDEX IF NOT EXISTS idx_sol_status ON federal_solicitations(status);
CREATE INDEX IF NOT EXISTS idx_sol_posted ON federal_solicitations(posted_date DESC);

ALTER TABLE federal_solicitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_read_federal_solicitations"
  ON federal_solicitations FOR SELECT TO anon USING (true);

CREATE POLICY "service_all_federal_solicitations"
  ON federal_solicitations FOR ALL TO service_role USING (true) WITH CHECK (true);


-- ---------------------------------------------------------------------------
-- Deduplication indexes for entity ingestion pipeline
-- ---------------------------------------------------------------------------

-- One event per (entity, type, date) — enables ON CONFLICT DO NOTHING dedup
-- in the writeEventLogBatch helper.  NULL entity_ids are exempt (NULL != NULL
-- in PostgreSQL unique indexes), so orphan events remain insertable.
CREATE UNIQUE INDEX IF NOT EXISTS idx_event_log_entity_type_date
  ON event_log (entity_id, event_type, event_date);

-- One edge per (from, to, type) triple — prevents duplicate graph edges.
CREATE UNIQUE INDEX IF NOT EXISTS idx_entity_edges_triple
  ON entity_edges (from_id, to_id, edge_type);


-- ---------------------------------------------------------------------------
-- Table: project_formation_scores
-- Nightly-computed project-level Formation Score (0–100) measuring the
-- probability that a specific construction project will proceed to active
-- formation. One row per (project_id, computed_at) — the most recent row
-- within its valid_through window is served to consumers.
--
-- Five input drivers (weights in parentheses):
--   satellite_bsi      (0.25) — ground truth: BSI 90-day change at the site
--   permit_amendments  (0.25) — behavioral intent: amendment filing activity
--   permit_age         (0.20) — timing: days since first permit event
--   federal_proximity  (0.15) — co-location: nearby USASpending.gov award
--   contractor_track   (0.15) — credibility: prior completions in this metro
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS project_formation_scores (
  id             BIGSERIAL    PRIMARY KEY,
  project_id     BIGINT       NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  score          INTEGER      NOT NULL,
  classification TEXT         NOT NULL,  -- FORMATION | BUILDING | STABLE | COOLING | CONTRACTING
  confidence     TEXT         NOT NULL,  -- HIGH | MEDIUM | LOW
  driver_json    JSONB        NOT NULL,  -- full driver breakdown + top_drivers array
  computed_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  valid_through  TIMESTAMPTZ  NOT NULL,

  CONSTRAINT project_formation_scores_project_computed_unique
    UNIQUE (project_id, computed_at)
);

COMMENT ON TABLE  project_formation_scores                IS 'Nightly project-level Formation Score (0–100) — probability a project proceeds to active construction.';
COMMENT ON COLUMN project_formation_scores.project_id     IS 'Foreign key to projects.id.';
COMMENT ON COLUMN project_formation_scores.score          IS 'Composite formation score, 0–100 integer.';
COMMENT ON COLUMN project_formation_scores.classification IS 'FORMATION | BUILDING | STABLE | COOLING | CONTRACTING.';
COMMENT ON COLUMN project_formation_scores.confidence     IS 'HIGH | MEDIUM | LOW — based on how many of the five input signals are live vs null/fallback.';
COMMENT ON COLUMN project_formation_scores.driver_json    IS 'Per-driver breakdown (all 5) and top_drivers array (top 3 by deviation from neutral).';
COMMENT ON COLUMN project_formation_scores.computed_at    IS 'Timestamp the score was computed.';
COMMENT ON COLUMN project_formation_scores.valid_through  IS 'Serve-fresh cutoff — score should be recomputed after this timestamp.';

CREATE INDEX IF NOT EXISTS idx_project_formation_scores_project_latest
  ON project_formation_scores (project_id, computed_at DESC);

CREATE INDEX IF NOT EXISTS idx_project_formation_scores_score
  ON project_formation_scores (score DESC, computed_at DESC);

ALTER TABLE project_formation_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_read_project_formation_scores"
  ON project_formation_scores FOR SELECT TO anon USING (true);

CREATE POLICY "service_all_project_formation_scores"
  ON project_formation_scores FOR ALL TO service_role USING (true) WITH CHECK (true);


-- ---------------------------------------------------------------------------
-- Table: project_reality_gaps
-- Nightly-computed signed divergence (−100 → +100) between what a project
-- officially declares and what observable signals confirm.
--
--   gap = observed_score − official_score
--   negative: reality is worse than declared (project is lagging or ghost)
--   positive: reality ahead of official record (construction leading paperwork)
--
-- Official side (declared):  permit_valuation · award_amount · announced_milestone
-- Observed side (ground):    satellite_bsi · amendment_cadence · warn_stress
--
-- Classifications:
--   ON_TRACK  gap ≥ −15
--   LAGGING   −50 ≤ gap < −15
--   STALLED   gap < −50 (some observed activity)
--   GHOST     gap < −25 AND observed_score ≤ 20
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS project_reality_gaps (
  id              BIGSERIAL    PRIMARY KEY,
  project_id      BIGINT       NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  gap             INTEGER      NOT NULL,                        -- −100 to +100
  official_score  INTEGER      NOT NULL,                        -- 0–100
  observed_score  INTEGER      NOT NULL,                        -- 0–100
  classification  TEXT         NOT NULL,                        -- ON_TRACK | LAGGING | STALLED | GHOST
  driver_json     JSONB        NOT NULL,                        -- official_drivers, observed_drivers, top_gap_drivers
  computed_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  valid_through   TIMESTAMPTZ  NOT NULL,

  CONSTRAINT project_reality_gaps_project_computed_unique
    UNIQUE (project_id, computed_at)
);

COMMENT ON TABLE  project_reality_gaps                IS 'Nightly signed divergence between declared project momentum and observable ground signals.';
COMMENT ON COLUMN project_reality_gaps.project_id     IS 'Foreign key to projects.id.';
COMMENT ON COLUMN project_reality_gaps.gap            IS 'observed_score − official_score; negative means reality trails the official record.';
COMMENT ON COLUMN project_reality_gaps.official_score IS 'Composite official-momentum score (0–100): valuation + award + milestone.';
COMMENT ON COLUMN project_reality_gaps.observed_score IS 'Composite observed-momentum score (0–100): satellite BSI + amendment cadence + WARN stress.';
COMMENT ON COLUMN project_reality_gaps.classification IS 'ON_TRACK | LAGGING | STALLED | GHOST.';
COMMENT ON COLUMN project_reality_gaps.driver_json    IS 'Full driver breakdown for both official and observed sides, plus top_gap_drivers (top 3 by deviation from neutral).';
COMMENT ON COLUMN project_reality_gaps.computed_at    IS 'Timestamp the gap was computed.';
COMMENT ON COLUMN project_reality_gaps.valid_through  IS 'Serve-fresh cutoff — recompute after this timestamp.';

CREATE INDEX IF NOT EXISTS idx_project_reality_gaps_project_latest
  ON project_reality_gaps (project_id, computed_at DESC);

CREATE INDEX IF NOT EXISTS idx_project_reality_gaps_classification
  ON project_reality_gaps (classification, computed_at DESC);

CREATE INDEX IF NOT EXISTS idx_project_reality_gaps_gap
  ON project_reality_gaps (gap, computed_at DESC);

ALTER TABLE project_reality_gaps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_read_project_reality_gaps"
  ON project_reality_gaps FOR SELECT TO anon USING (true);

CREATE POLICY "service_all_project_reality_gaps"
  ON project_reality_gaps FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- Table: prediction_outcomes
-- Tracks every classification prediction made for an entity so we can compute
-- PAR (Prediction Accuracy Rate) once the horizon window has elapsed.
--
-- Workflow:
--   1. Scoring crons INSERT a row when score >= 70 (HIGH classification).
--   2. The weekly evaluate-predictions cron resolves rows where
--      outcome_due_at <= NOW() AND outcome_observed IS NULL.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS prediction_outcomes (
  id                  BIGSERIAL    PRIMARY KEY,
  entity_type         TEXT         NOT NULL,  -- 'project' | 'metro' | 'site'
  entity_id           TEXT         NOT NULL,
  score_type          TEXT         NOT NULL,  -- 'formation' | 'opportunity' | 'reality_gap'
  predicted_value     FLOAT        NOT NULL,  -- score at prediction time
  predicted_class     TEXT         NOT NULL,  -- HIGH / MEDIUM / LOW or EXPAND / STABLE / CONTRACT
  predicted_at        TIMESTAMPTZ  NOT NULL,
  horizon_days        INT          NOT NULL,  -- 90 | 180 | 360
  outcome_due_at      TIMESTAMPTZ  NOT NULL,  -- predicted_at + horizon_days
  outcome_observed    TEXT,                   -- actual classification when resolved
  outcome_score       FLOAT,                  -- actual score when resolved
  outcome_correct     BOOLEAN,                -- did classification match?
  outcome_checked_at  TIMESTAMPTZ,
  notes               TEXT
);

COMMENT ON TABLE  prediction_outcomes IS 'Per-entity classification predictions with resolved outcomes for PAR computation.';
COMMENT ON COLUMN prediction_outcomes.entity_type      IS 'Grain of entity: project | metro | site.';
COMMENT ON COLUMN prediction_outcomes.entity_id        IS 'Stable identifier for the entity (metro_code, project id, etc.).';
COMMENT ON COLUMN prediction_outcomes.score_type       IS 'Which scoring model produced this prediction: formation | opportunity | reality_gap.';
COMMENT ON COLUMN prediction_outcomes.predicted_value  IS 'Numeric score (0–100) at the time the prediction was made.';
COMMENT ON COLUMN prediction_outcomes.predicted_class  IS 'Classification bucket at prediction time (HIGH/MEDIUM/LOW or equivalent).';
COMMENT ON COLUMN prediction_outcomes.predicted_at     IS 'Wall-clock timestamp when the prediction was written.';
COMMENT ON COLUMN prediction_outcomes.horizon_days     IS 'Days forward the prediction is evaluated against (90, 180, or 360).';
COMMENT ON COLUMN prediction_outcomes.outcome_due_at   IS 'predicted_at + horizon_days — the date on which the outcome should be checked.';
COMMENT ON COLUMN prediction_outcomes.outcome_observed IS 'Actual classification measured at outcome_due_at.';
COMMENT ON COLUMN prediction_outcomes.outcome_score    IS 'Actual numeric score measured at outcome_due_at.';
COMMENT ON COLUMN prediction_outcomes.outcome_correct  IS 'TRUE when predicted_class === outcome_observed.';
COMMENT ON COLUMN prediction_outcomes.outcome_checked_at IS 'Timestamp the evaluate-predictions cron resolved this row.';

-- Fast lookup for the evaluate-predictions cron (unresolved, overdue rows)
CREATE INDEX IF NOT EXISTS idx_pred_outcomes_due
  ON prediction_outcomes (outcome_due_at)
  WHERE outcome_observed IS NULL;

-- PAR aggregation queries: filter by score type and predicted class
CREATE INDEX IF NOT EXISTS idx_pred_outcomes_type
  ON prediction_outcomes (score_type, predicted_class);

ALTER TABLE prediction_outcomes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_read_prediction_outcomes"
  ON prediction_outcomes FOR SELECT TO anon USING (true);

CREATE POLICY "service_all_prediction_outcomes"
  ON prediction_outcomes FOR ALL TO service_role USING (true) WITH CHECK (true);
