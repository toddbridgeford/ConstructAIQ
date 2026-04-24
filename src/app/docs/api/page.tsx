import type { Metadata } from 'next'
import Link from 'next/link'
import { color, font } from '@/lib/theme'

export const metadata: Metadata = {
  title: 'API Documentation — ConstructAIQ',
  description:
    'Free construction market intelligence API. ' +
    'Access forecasts, permits, federal awards, satellite ' +
    'signals, and opportunity scores. No key required for ' +
    'public read access.',
}

// ── Shared style helpers ──────────────────────────────────────

const S = {
  page: {
    minHeight:      '100vh',
    background:     color.bg0,
    color:          color.t1,
    fontFamily:     font.sys,
  } as React.CSSProperties,

  wrap: {
    maxWidth:       880,
    margin:         '0 auto',
    padding:        '48px 40px 120px',
  } as React.CSSProperties,

  section: {
    marginBottom:   56,
    scrollMarginTop: 80,
  } as React.CSSProperties,

  sectionLabel: {
    fontFamily:     font.mono,
    fontSize:       10,
    color:          color.amber,
    letterSpacing:  '0.1em',
    textTransform:  'uppercase' as const,
    marginBottom:   12,
  },

  h1: {
    fontFamily:     font.sys,
    fontSize:       32,
    fontWeight:     700,
    color:          color.t1,
    margin:         '0 0 12px',
    lineHeight:     1.2,
  } as React.CSSProperties,

  h2: {
    fontFamily:     font.sys,
    fontSize:       20,
    fontWeight:     600,
    color:          color.t1,
    margin:         '0 0 16px',
    lineHeight:     1.3,
  } as React.CSSProperties,

  p: {
    fontFamily:     font.sys,
    fontSize:       15,
    color:          color.t2,
    lineHeight:     1.7,
    margin:         '0 0 16px',
  } as React.CSSProperties,

  card: {
    background:     color.bg1,
    border:         `1px solid ${color.bd1}`,
    borderRadius:   12,
    padding:        '20px 24px',
    marginBottom:   16,
  } as React.CSSProperties,

  code: {
    background:     color.bg1,
    border:         `1px solid ${color.bd1}`,
    borderRadius:   8,
    padding:        '14px 18px',
    fontFamily:     font.mono,
    fontSize:       12,
    color:          color.t2,
    lineHeight:     1.8,
    overflowX:      'auto' as const,
    display:        'block',
    marginBottom:   16,
    whiteSpace:     'pre' as const,
  },

  inlineCode: {
    fontFamily:     font.mono,
    fontSize:       12,
    background:     color.bg1,
    color:          color.amber,
    padding:        '2px 7px',
    borderRadius:   4,
    border:         `1px solid ${color.bd1}`,
  } as React.CSSProperties,

  tableWrap: {
    width:          '100%',
    borderCollapse: 'collapse' as const,
    marginBottom:   20,
    fontSize:       14,
  },

  th: {
    textAlign:      'left' as const,
    padding:        '8px 14px',
    borderBottom:   `2px solid ${color.bd1}`,
    fontFamily:     font.mono,
    fontSize:       10,
    color:          color.t4,
    fontWeight:     500,
    letterSpacing:  '0.08em',
    textTransform:  'uppercase' as const,
  },

  td: {
    padding:        '10px 14px',
    borderBottom:   `1px solid ${color.bd1}`,
    color:          color.t2,
    verticalAlign:  'top' as const,
    fontFamily:     font.sys,
    fontSize:       14,
  },

  badge: (bg: string, fg: string) => ({
    background:     bg,
    color:          fg,
    fontFamily:     font.mono,
    fontSize:       10,
    fontWeight:     700,
    letterSpacing:  '0.06em',
    padding:        '3px 8px',
    borderRadius:   4,
    display:        'inline-block' as const,
  }),

  divider: {
    borderTop:      `1px solid ${color.bd1}`,
    margin:         '40px 0',
  } as React.CSSProperties,
} as const

// ── Nav anchor helper ─────────────────────────────────────────
function Anchor({ id }: { id: string }) {
  return <span id={id} style={{ scrollMarginTop: 80 }} />
}

// ── Component ─────────────────────────────────────────────────
export default function ApiDocsPage() {
  return (
    <div style={S.page}>
      <div style={S.wrap}>

        {/* ── Back nav ── */}
        <Link href="/api-access"
          style={{ fontFamily: font.sys, fontSize: 13,
            color: color.t4, textDecoration: 'none',
            display: 'inline-block', marginBottom: 32 }}>
          ← Key Portal
        </Link>

        {/* ── Page header ── */}
        <div style={S.sectionLabel}>Developer</div>
        <h1 style={S.h1}>ConstructAIQ API</h1>
        <p style={{ ...S.p, fontSize: 16, marginBottom: 32 }}>
          Free, public API for US construction market
          intelligence. All read endpoints are open
          — no API key required for basic access.
        </p>

        {/* CTA buttons */}
        <div style={{ display: 'flex', gap: 12,
          flexWrap: 'wrap', marginBottom: 48 }}>
          <Link href="/api-access"
            style={{ display: 'inline-flex', alignItems: 'center',
              background: color.amber, color: '#000',
              fontFamily: font.sys, fontSize: 14,
              fontWeight: 600, padding: '10px 20px',
              borderRadius: 8, textDecoration: 'none' }}>
            Get API Key →
          </Link>
          <Link
            href="https://github.com/toddbridgeford/ConstructAIQ"
            target="_blank" rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center',
              background: 'transparent', color: color.t2,
              fontFamily: font.sys, fontSize: 14,
              fontWeight: 500, padding: '10px 20px',
              borderRadius: 8, textDecoration: 'none',
              border: `1px solid ${color.bd1}` }}>
            View on GitHub ↗
          </Link>
        </div>

        {/* ── On-page navigation ── */}
        <div style={{ ...S.card, marginBottom: 48 }}>
          <div style={S.sectionLabel}>On this page</div>
          <div style={{ display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '6px 24px' }}>
            {[
              ['#auth',       'Authentication'],
              ['#base-url',   'Base URL'],
              ['#response',   'Response shape'],
              ['#rate-limits','Rate limits'],
              ['#errors',     'Error format'],
              ['#endpoints',  'Endpoint list'],
              ['#detail',     'Endpoint detail'],
              ['#freshness',  'Data freshness'],
            ].map(([href, label]) => (
              <a key={href} href={href}
                style={{ fontFamily: font.sys, fontSize: 13,
                  color: color.amber, textDecoration: 'none' }}>
                {label}
              </a>
            ))}
          </div>
        </div>

        <hr style={S.divider} />

        {/* ── SECTION: Authentication ── */}
        <div style={S.section} id="auth">
          <h2 style={H2}>Authentication</h2>
          <p style={S.p}>
            All read endpoints work without an API key.
            The product is intentionally open — any browser or
            external caller can access market intelligence data.
          </p>
          <p style={S.p}>
            Add an <code style={S.inlineCode}>X-API-Key</code> header
            for usage tracking and higher rate limits.
          </p>

          <code style={S.code}>{`# Public access — no key required
curl https://constructaiq.trade/api/forecast

# Keyed access — usage tracking + higher limits
curl https://constructaiq.trade/api/forecast \\
  -H "X-API-Key: caiq_your_key_here"`}</code>

          <table style={S.tableWrap}>
            <thead>
              <tr>
                <th style={S.th}>Header</th>
                <th style={S.th}>Required</th>
                <th style={S.th}>Purpose</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={S.td}>
                  <code style={S.inlineCode}>X-API-Key</code>
                </td>
                <td style={S.td}>No</td>
                <td style={S.td}>
                  Usage tracking, rate limit headers,
                  webhook subscriptions
                </td>
              </tr>
            </tbody>
          </table>
          <p style={{ ...S.p, fontSize: 13, color: color.t4 }}>
            Register a free key at{' '}
            <Link href="/api-access"
              style={{ color: color.amber }}>
              /api-access
            </Link>
            . Keys start with <code style={S.inlineCode}>caiq_</code>.
          </p>
        </div>

        <hr style={S.divider} />

        {/* ── SECTION: Base URL ── */}
        <div style={S.section} id="base-url">
          <h2 style={H2}>Base URL</h2>
          <code style={S.code}>https://constructaiq.trade/api</code>
          <p style={S.p}>
            All endpoints are relative to this base.
            HTTPS only.
          </p>
          <div style={{ ...S.card, borderLeft: `3px solid ${color.amber}` }}>
            <p style={{ ...S.p, margin: 0, fontSize: 13 }}>
              <strong>API stability:</strong> Beta.
              Response shapes are documented and followed,
              but may evolve. A{' '}
              <code style={S.inlineCode}>/api/v1</code> version
              prefix is planned for stable contracts.
              Breaking changes will be announced in the{' '}
              <Link href="https://github.com/toddbridgeford/ConstructAIQ/blob/main/CHANGELOG.md"
                target="_blank" rel="noopener noreferrer"
                style={{ color: color.amber }}>
                changelog
              </Link>.
            </p>
          </div>
        </div>

        <hr style={S.divider} />

        {/* ── SECTION: Response shape ── */}
        <div style={S.section} id="response">
          <h2 style={H2}>Standard response shape</h2>
          <p style={S.p}>
            All responses include a <code style={S.inlineCode}>live</code> boolean
            and a freshness timestamp.
          </p>

          <p style={{ ...S.p, fontFamily: font.mono, fontSize: 11,
            color: color.amber, letterSpacing: '0.08em',
            marginBottom: 8 }}>
            COLLECTION ENDPOINTS
          </p>
          <code style={S.code}>{`{
  "data":    [...],        // array of results
  "count":   42,           // total items
  "as_of":   "2026-04-24", // data freshness
  "live":    true          // false if using cached/seed data
}`}</code>

          <p style={{ ...S.p, fontFamily: font.mono, fontSize: 11,
            color: color.amber, letterSpacing: '0.08em',
            marginBottom: 8 }}>
            SINGLE-RESOURCE ENDPOINTS
          </p>
          <code style={S.code}>{`{
  // ...resource fields...
  "as_of":      "2026-04-24",
  "updated_at": "2026-04-24T06:12:00Z",
  "live":       true
}`}</code>
        </div>

        <hr style={S.divider} />

        {/* ── SECTION: Rate limits ── */}
        <div style={S.section} id="rate-limits">
          <h2 style={H2}>Rate limits</h2>
          <table style={S.tableWrap}>
            <thead>
              <tr>
                <th style={S.th}>Access type</th>
                <th style={S.th}>Limit</th>
                <th style={S.th}>Notes</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Public (no key)', 'Not enforced',
                  'Open access for dashboard and embeds'],
                ['Keyed (caiq_...)', '1,000 req/day',
                  'Default; higher limits planned'],
              ].map(([type, limit, note]) => (
                <tr key={type}>
                  <td style={S.td}>{type}</td>
                  <td style={{ ...S.td, fontFamily: font.mono, fontSize: 13 }}>
                    {limit}
                  </td>
                  <td style={{ ...S.td, color: color.t3 }}>{note}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={S.p}>
            Rate-limited responses return HTTP 429 with a{' '}
            <code style={S.inlineCode}>Retry-After</code> header
            and <code style={S.inlineCode}>X-RateLimit-Remaining: 0</code>.
          </p>
        </div>

        <hr style={S.divider} />

        {/* ── SECTION: Error format ── */}
        <div style={S.section} id="errors">
          <h2 style={H2}>Error format</h2>
          <code style={S.code}>{`{
  "error": "Human-readable message",
  "code":  "MACHINE_CODE"            // optional
}`}</code>

          <table style={S.tableWrap}>
            <thead>
              <tr>
                <th style={S.th}>Status</th>
                <th style={S.th}>Code</th>
                <th style={S.th}>Meaning</th>
              </tr>
            </thead>
            <tbody>
              {([
                ['400', 'INVALID_PARAMS',       'Missing or invalid query parameter'],
                ['401', 'UNAUTHORIZED',         'Missing or invalid API key'],
                ['404', 'NOT_FOUND',            'Resource not found or insufficient data'],
                ['429', 'RATE_LIMITED',         'Rate limit exceeded — see Retry-After header'],
                ['503', 'UPSTREAM_UNAVAILABLE', 'External API unavailable — try again later'],
                ['500', 'INTERNAL',             'Internal server error'],
              ] as const).map(([status, code, meaning]) => (
                <tr key={status}>
                  <td style={{ ...S.td, fontFamily: font.mono,
                    fontSize: 13, color: color.red }}>
                    {status}
                  </td>
                  <td style={{ ...S.td }}>
                    <code style={S.inlineCode}>{code}</code>
                  </td>
                  <td style={{ ...S.td, color: color.t3 }}>{meaning}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <hr style={S.divider} />

        {/* ── SECTION: Endpoint table ── */}
        <div style={S.section} id="endpoints">
          <h2 style={H2}>Endpoints</h2>
          <table style={S.tableWrap}>
            <thead>
              <tr>
                <th style={S.th}>Method</th>
                <th style={S.th}>Path</th>
                <th style={S.th}>Description</th>
                <th style={S.th}>Key required</th>
              </tr>
            </thead>
            <tbody>
              {([
                ['GET',  '/api/forecast',              'AI ensemble 12-month forecast',         false],
                ['GET',  '/api/signals',               'Market anomaly signals and alerts',      false],
                ['GET',  '/api/verdict',               'EXPAND / HOLD / CONTRACT verdict',       false],
                ['GET',  '/api/benchmark',             'Historical percentile for a value',      false],
                ['GET',  '/api/federal',               'Federal construction awards by state',   false],
                ['GET',  '/api/solicitations',         'SAM.gov pre-award solicitations',        false],
                ['GET',  '/api/permits',               'City permit activity — 40 cities',       false],
                ['GET',  '/api/permits/[city]',        'Single city permit detail',              false],
                ['GET',  '/api/satellite',             'Sentinel-2 BSI ground disturbance',      false],
                ['GET',  '/api/warn',                  'DOL WARN Act layoff notices',            false],
                ['GET',  '/api/opportunity-score',     'Metro opportunity score (0–100)',         false],
                ['GET',  '/api/reality-gap',           'Official vs observed momentum gap',      false],
                ['GET',  '/api/leading-indicators',    'LICS 6-month forward composite',         false],
                ['GET',  '/api/recession-probability', 'Construction recession probability',     false],
                ['GET',  '/api/par',                   'Prediction Accuracy Rate (live)',         false],
                ['GET',  '/api/sector/[sector]',       'Sector intelligence (residential etc.)', false],
                ['POST', '/api/nlq',                   'Natural language query',                 false],
                ['POST', '/api/watchlist',             'Manage watchlist entities',              true ],
              ] as const).map(([method, path, desc, keyReq]) => (
                <tr key={path}>
                  <td style={S.td}>
                    <span style={S.badge(
                      method === 'GET' ? color.green + '22' : color.blue + '22',
                      method === 'GET' ? color.green : color.blue,
                    )}>
                      {method}
                    </span>
                  </td>
                  <td style={S.td}>
                    <a href={`#${path.replace(/\//g, '-').replace(/[\[\]]/g, '').slice(1)}`}
                      style={{ fontFamily: font.mono, fontSize: 12,
                        color: color.amber, textDecoration: 'none' }}>
                      {path}
                    </a>
                  </td>
                  <td style={{ ...S.td, color: color.t3 }}>{desc}</td>
                  <td style={S.td}>
                    {keyReq
                      ? <span style={S.badge(color.amber + '22', color.amber)}>Yes</span>
                      : <span style={{ fontFamily: font.mono, fontSize: 10,
                          color: color.t4 }}>No</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  )
}

// Local alias to avoid repetition
const H2 = S.h2
