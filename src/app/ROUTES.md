# Route Inventory

Last audited: 2026-04-23

## Orphan route audit

| Route          | Status              | Redirects to      | Notes                                                                                         |
|----------------|---------------------|-------------------|-----------------------------------------------------------------------------------------------|
| /ccci          | KEEP                | —                 | Construction Cost Competitiveness Index — unique cost analysis tool, not in dashboard. Needs integration into main nav. Uses seeded deterministic data. |
| /distress      | KEEP                | —                 | Construction Distress Index by city — unique market-level financial risk tool. Fetches /api/distress. Needs integration. |
| /globe         | ARCHIVED            | /ground-signal    | Experimental 3D globe ("PHASE 5"). Redirected. GlobeClient.tsx preserved for future use. |
| /government    | KEEP                | —                 | Marketing landing page for government agency users (DOT, Army Corps, HUD, OMB, CBO, State DOTs). Different from /federal data page. Needs nav link. |
| /pricing       | REWRITTEN           | —                 | Old tier-based pricing page replaced with "ConstructAIQ is Free — Here's Why" explaining the open data model and access levels. |
| /compare       | KEEP                | —                 | Sector comparison radar tool (Residential/Commercial/Industrial/Infrastructure/Healthcare etc). Not covered by /portfolio. Needs integration. |
| /market-check  | KEEP                | —                 | City construction market search ("Is My Market HOT or COOLING?"). Distinct from /ask — structured city-level search UI. Needs real data wiring. |

## Active routes (reference)

| Route           | Purpose                                              |
|-----------------|------------------------------------------------------|
| /               | Homepage — marketing                                 |
| /dashboard      | Main intelligence platform                           |
| /federal        | Federal infrastructure tracker (IIJA/IRA data page)  |
| /ground-signal  | Satellite/geospatial intelligence                    |
| /materials      | Full material cost index                             |
| /markets/[state]| State-level construction intelligence                |
| /research       | Research hub — live data and weekly brief            |
| /methodology    | Open model documentation                             |
| /methodology/track-record | Forecast accuracy record                 |
| /forecasts      | Forecast Accuracy Center — PAR, 12-week trend, evaluation explainers |
| /trust          | Trust Center — data provenance, freshness, AI guardrails, limitations |
| /status         | Platform Status — live data freshness, PAR KPIs, source health       |
| /api-access     | REMOVED — API documentation is internal until the developer program is reopened |
| /ask            | AI natural language query interface                  |
| /portfolio      | Portfolio management                                 |
| /sectors        | Sector analysis                                      |
| /permits        | City permit intelligence (40 cities)                 |
| /calendar       | Economic data release calendar                       |
| /about          | About page                                           |
| /contact        | Contact                                              |
| /subscribe      | Newsletter sign-up                                   |
| /embed/[chart]  | Embeddable chart pages                               |
| /cost-estimate  | Cost estimation tool                                 |
| /projects       | Project management                                   |
| /globe          | ARCHIVED → /ground-signal                            |

## CSP notes

As of 2026-04-23:
- `unsafe-eval` removed from both default and embed script-src directives.
- `cdn.jsdelivr.net` added to default script-src (used by react-simple-maps US atlas).
- `unsafe-inline` for scripts retained — required for Next.js inline hydration scripts.
  Future hardening: replace with nonces when Next.js supports stable nonce injection.
