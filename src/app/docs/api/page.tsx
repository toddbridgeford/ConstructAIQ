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

      </div>
    </div>
  )
}

// Local alias to avoid repetition
const H2 = S.h2
