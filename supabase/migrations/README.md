# Database Migrations

## Convention

Each migration file is named:
  NNNN_descriptive_name.sql

Where NNNN is a 4-digit sequential number.
Applied in order. Never edit applied migrations.

## Applying migrations

In Supabase SQL Editor, run migration files in order.
Or use the Supabase CLI:
  supabase db push

## Current migration history

| # | File | Applied | Description |
|---|------|---------|-------------|
| 0001 | 0001_initial_schema.sql | 2026-04-23 | Full initial schema — 30 tables |
| 0002 | 0002_data_source_health.sql | 2026-04-24 | Per-source health tracking |

## Adding a migration

1. Create the next numbered file
2. Write only the incremental change (ALTER TABLE, CREATE TABLE, etc.)
3. Test locally with: supabase db push --local
4. Update this README with the new entry

## Schema at a glance

30 tables across 6 domains:
  Core data:    series, observations, forecasts
  Federal:      federal_cache, federal_solicitations, contractor_profiles
  Permits:      permit_sources, city_permits, permit_monthly_agg
  Satellite:    msa_boundaries, satellite_bsi, signal_fusion
  Intelligence: opportunity_scores, project_formation_scores,
                project_reality_gaps, prediction_outcomes
  Users:        api_keys, watchlists, push_subscriptions,
                push_notifications_log, webhook_subscriptions
  Platform:     weekly_briefs, nlq_queries, embed_impressions
  Projects:     projects, project_events, project_state_history,
                entities, entity_edges, event_log

Keep schema.sql as a symlink or copy at the repo root
for backwards compatibility with existing tooling.

## Refreshing generated types

Run: npm run db:types
Commit the result alongside any schema changes.
