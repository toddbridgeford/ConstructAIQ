# ConstructAIQ API

## Access model

The API uses a two-tier access model.

**Public read (no key required)**
All /api/* endpoints accept requests without an API key.
The product is intentionally open — any browser or
external caller can read market intelligence data.
Rate limiting is not enforced on keyless requests.

Use case: dashboard, embeds, public scripts.

**Keyed access (X-API-Key: caiq_...)**
Requests with a valid API key receive:
- Usage tracking (requests per day/month)
- Rate limit headers (X-RateLimit-Remaining etc.)
- Webhook subscriptions
- Higher planned limits in future tiers

Use case: developer integrations, automated monitoring.

**Protected routes (require CRON_SECRET Bearer token)**
All /api/cron/* routes require:
  Authorization: Bearer YOUR_CRON_SECRET
These are called only by GitHub Actions or Vercel crons.
They mutate database state and must never be called
from the browser or external APIs.

## Standard error shape

All error responses follow this shape:
  { "error": "Human-readable message", "code"?: "MACHINE_CODE" }

HTTP status conventions:
  400 — Invalid parameters
  401 — Missing or invalid authentication
  404 — Resource not found or insufficient data
  429 — Rate limit exceeded
  503 — Upstream API unavailable (degrade gracefully)
  500 — Internal error

## Standard success shape

Collection endpoints:
  { "data": [...], "count": N, "as_of": "ISO-8601" }

Single-resource endpoints:
  { ...resource fields..., "as_of": "ISO-8601" }

All responses include:
  live: boolean  — whether data came from a live source
  as_of or updated_at — data freshness timestamp
