# Changelog

All notable changes to ConstructAIQ are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Infrastructure
- maxDuration = 10 on all 87 API routes (explicit Hobby compliance)
- data_source_health table (0002 migration)
- writeSourceHealth() wired into all 13 cron types
- Status page: source health grouped by category with permits summary row
- Duplicate anchor ID fixed in /docs/api
- Supabase migrations directory with 0001_initial_schema.sql
- Generated TypeScript types from Supabase schema
- PR template with checklist for schema/cron/data changes
- CODEOWNERS file for required reviews on critical files
- CI: npm run build step added (catches broken builds pre-deploy)
- Data refresh: harvest, forecast, permits now fail loudly

### Data Coverage
- Permit cities expanded from 40 → 72 (Cook County, Detroit, Fort Collins,
  Howard County, King County, Montgomery County, Pierce County,
  Providence, San Diego County, Somerville, and others)

### Data Quality
- Zero synthetic/fabricated fallback data in any route
- Zero hardcoded fallback numbers in UI components
- ModelAccuracy chart uses real /api/forecast/track-record data
- StateDrillDown and MaterialsHeatmap removed seeded fallbacks
- All 30 schema tables documented in migrations/README.md

### Documentation
- /docs/api: 789-line public API documentation (server component, SEO-indexed)
- sitemap.ts: 15 key pages with priorities
- Nav: "API Docs" → /docs/api (key portal accessible from docs intro)
- README: corrected cron architecture (Vercel vs GitHub Actions)
- src/app/api/README.md: API permission matrix and error contract
- .env.example: SITE_PASS changed to obvious placeholder

## Previous work

See git log for full feature history:
  VALUE1–15: benchmarking, personalization, verdicts, portfolio,
             email newsletter, driver analysis, materials page,
             share buttons, forward calendar, trust signals,
             ambient intelligence, sectors, developer portal,
             state pages, custom alerts, recommendation engine

  PAR1–INTG1: prediction outcome tracking, SAM.gov solicitations,
              reality gap surface, metro intelligence SEO,
              embed widgets, weekly intelligence agent,
              contractor profiles, platform health dashboard

  ARCH1–8: fake data removal, type discipline, freshness timestamps,
           CSP hardening, dashboard fetch rationalization,
           test coverage, homepage narrative, mobile nav stability

  FIX1–5: systematic elimination of all synthetic/fake data from
          API routes and UI components (6 audit rounds)
