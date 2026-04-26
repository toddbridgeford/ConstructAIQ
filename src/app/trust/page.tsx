import type { Metadata } from 'next'
import Link from 'next/link'
import { font, color, space } from '@/lib/theme'

export const metadata: Metadata = {
  title: 'ConstructAIQ Trust Center',
  description:
    'Data sources, freshness, forecast methodology, prediction validation, ' +
    'AI guardrails, and limitations.',
}

// ── Shared style constants (light-theme, matches /methodology) ────────────────

const SYS  = font.sys
const MONO = font.mono

const prose: React.CSSProperties = {
  fontFamily: SYS, fontSize: 15, lineHeight: 1.8, color: color.lightT2, marginBottom: space.md,
}

const sectionH2: React.CSSProperties = {
  fontFamily: SYS, fontSize: 24, fontWeight: 700,
  color: color.lightT1, marginBottom: space.md, paddingBottom: 12,
  borderBottom: `2px solid ${color.lightBd}`,
}

const h3Style: React.CSSProperties = {
  fontFamily: SYS, fontSize: 17, fontWeight: 600,
  color: color.lightT1, marginBottom: space.sm, marginTop: 28,
}

const tableStyle: React.CSSProperties = {
  width: '100%', borderCollapse: 'collapse',
  fontFamily: SYS, fontSize: 14,
  marginTop: space[5], marginBottom: space.sm,
}

const thStyle: React.CSSProperties = {
  textAlign: 'left', padding: '10px 14px',
  background: color.lightBgSub, fontWeight: 600,
  fontSize: 11, letterSpacing: '0.05em',
  textTransform: 'uppercase', color: color.lightT3,
  borderBottom: `2px solid ${color.lightBd}`,
}

const tdStyle: React.CSSProperties = {
  padding: '10px 14px', borderBottom: `1px solid ${color.lightBd}`,
  color: color.lightT2, verticalAlign: 'top', lineHeight: 1.6,
}

const noteStyle: React.CSSProperties = {
  fontFamily: MONO, fontSize: 12, color: color.lightT3, lineHeight: 1.6,
}

const linkStyle: React.CSSProperties = {
  color: color.blue, textDecoration: 'none', fontFamily: SYS, fontSize: 14,
}

const calloutStyle: React.CSSProperties = {
  background: color.lightBg, border: `1px solid ${color.lightBd}`,
  borderLeft: '3px solid #aaa', borderRadius: '0 8px 8px 0',
  padding: '14px 20px', marginBottom: space[5],
  fontFamily: SYS, fontSize: 14, color: color.lightT2, lineHeight: 1.7,
}

// ── Section anchors ───────────────────────────────────────────────────────────

const SECTIONS = [
  { id: 'data-sources',        label: 'Data Sources'              },
  { id: 'freshness',           label: 'Freshness & Source Health' },
  { id: 'forecast-methodology',label: 'Forecast Methodology'      },
  { id: 'prediction-validation',label: 'Prediction Validation'    },
  { id: 'ai-guardrails',       label: 'AI Analyst Guardrails'     },
  { id: 'limitations',         label: 'Limitations'               },
]

// ── Data ──────────────────────────────────────────────────────────────────────

const DATA_SOURCES = [
  {
    source:   'US Census Bureau',
    provides: 'Total construction spending (TTLCONS), residential housing starts (HOUST), building permit issuance (PERMIT)',
    cadence:  'Monthly',
    notes:    'Releases approximately 5–6 weeks after the reference month. Preliminary values are routinely revised.',
  },
  {
    source:   'Bureau of Labor Statistics (BLS)',
    provides: 'Construction employment (CES2000000001), construction sector PPI (PCU2362--2362--)',
    cadence:  'Monthly',
    notes:    'Seasonally adjusted. Subject to annual benchmark revision.',
  },
  {
    source:   'Federal Reserve / FRED',
    provides: '30-year mortgage rate, fed funds effective rate, housing starts, and additional macro series',
    cadence:  'Monthly / Weekly',
    notes:    'Fetched via FRED API using published series IDs.',
  },
  {
    source:   'Bureau of Economic Analysis (BEA)',
    provides: 'State-level GDP contribution from the construction sector',
    cadence:  'Quarterly',
    notes:    'Used in state intelligence and regional comparisons.',
  },
  {
    source:   'USASpending.gov',
    provides: 'Federal construction contract awards, filtered to NAICS codes 2361–2389',
    cadence:  'Daily (when live)',
    notes:    'Represents obligations (money committed), not disbursements (money spent or delivered). May serve from a 24-hour Supabase cache if the upstream API is unavailable.',
  },
  {
    source:   'SAM.gov',
    provides: 'Active federal solicitation notices for construction work',
    cadence:  'Periodic (not always live)',
    notes:    'Pre-solicitations and active bids. Sourced from SAM.gov public APIs. May serve cached results; check the freshness indicator on the solicitation feed.',
  },
  {
    source:   'Census Bureau — Building Permit Survey',
    provides: 'Monthly residential permit issuance for surveyed US cities',
    cadence:  'Monthly',
    notes:    'Covers Census Bureau survey universe only. Non-surveyed jurisdictions are not represented.',
  },
  {
    source:   'ESA Sentinel-2 / Copernicus',
    provides: 'Bare Soil Index (BSI) for 20 US metro areas — used as a ground-disturbance signal',
    cadence:  '~Every 12 days per satellite pass; processed monthly',
    notes:    'Cloud cover causes data gaps. BSI is a proxy for ground activity, not a legal record of construction.',
  },
  {
    source:   'DOL WARN Act',
    provides: 'Advance layoff notices filed by construction companies (60-day notice required by law)',
    cadence:  'As filed',
    notes:    'Reflects large layoffs only. Small companies and voluntary departures are not captured.',
  },
  {
    source:   'Energy Information Administration (EIA)',
    provides: 'Diesel and WTI crude oil price series',
    cadence:  'Weekly',
    notes:    'Used as energy and transportation cost inputs in the materials cost index.',
  },
  {
    source:   'Construction cost indices (composite)',
    provides: 'Lumber, steel, concrete, and copper price series from BLS PPI sub-categories and EIA',
    cadence:  'Monthly / Weekly',
    notes:    'Materials signals are derived from BLS Producer Price Indexes (PCU series) and EIA fuel prices. No proprietary cost database is used.',
  },
] as const

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TrustCenterPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#ffffff', color: color.lightT1 }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        a { color: inherit; text-decoration: none; }
        @media (max-width: 700px) {
          .tc-shell        { flex-direction: column !important; padding: 24px 20px !important; }
          .tc-nav          { display: none !important; }
          .tc-content      { max-width: 100% !important; }
          .tc-mobile-nav   { display: flex !important; }
        }
        @media (min-width: 701px) {
          .tc-mobile-nav   { display: none !important; }
        }
      `}</style>

      <div className="tc-shell" style={{
        maxWidth: 1100, margin: '0 auto',
        display: 'flex', flexDirection: 'row',
        gap: space.xxl, padding: `${space.xxl}px ${space[10]}px`,
      }}>

        {/* ── Left nav ── */}
        <nav className="tc-nav" style={{
          width: 200, flexShrink: 0,
          position: 'sticky', top: space.xl,
          alignSelf: 'flex-start', height: 'fit-content',
        }}>
          <div style={{
            fontFamily: SYS, fontSize: 11, color: color.lightT4,
            fontWeight: 500, marginBottom: space.md,
          }}>
            Contents
          </div>
          {SECTIONS.map(s => (
            <a key={s.id} href={`#${s.id}`} style={{
              display: 'block', padding: '6px 12px', borderRadius: 6,
              fontFamily: SYS, fontSize: 14, textDecoration: 'none',
              marginBottom: 2, color: color.lightT3, fontWeight: 400,
              borderLeft: '3px solid transparent',
            }}>
              {s.label}
            </a>
          ))}
          <div style={{ marginTop: space.lg, borderTop: `1px solid ${color.lightBd}`, paddingTop: space[5] }}>
            <Link href="/methodology" style={{ ...linkStyle, display: 'block', marginBottom: 8 }}>
              ← Full Methodology
            </Link>
            <Link href="/dashboard" style={{ ...linkStyle, display: 'block' }}>
              Open Dashboard →
            </Link>
          </div>
        </nav>

        {/* ── Right content ── */}
        <div className="tc-content" style={{ flex: 1, maxWidth: 700 }}>

          {/* Page header */}
          <div style={{ marginBottom: 56 }}>
            <div style={{
              fontFamily: MONO, fontSize: 10, color: color.lightT4,
              letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: space.md,
            }}>
              DATA TRANSPARENCY
            </div>
            <h1 style={{
              fontFamily: SYS, fontSize: 36, fontWeight: 700,
              color: color.lightT1, lineHeight: 1.2, marginBottom: space.md,
            }}>
              Trust Center
            </h1>
            <p style={{ ...prose, marginBottom: 0 }}>
              This page explains where ConstructAIQ data comes from, how fresh it is,
              how forecasts are computed and validated, how the AI analyst is constrained,
              and what the platform cannot do. The goal is to give users a complete and
              honest picture of what they are looking at.
            </p>
          </div>

          {/* Mobile section nav — chips, hidden on desktop */}
          <div className="tc-mobile-nav" style={{
            overflowX: 'auto', whiteSpace: 'nowrap',
            marginBottom: space.xl, gap: space.sm, paddingBottom: 4,
          }}>
            {SECTIONS.map(s => (
              <a key={s.id} href={`#${s.id}`} style={{
                display: 'inline-block', padding: '6px 14px',
                borderRadius: 20, border: `1px solid ${color.lightBd}`,
                fontFamily: SYS, fontSize: 13, color: color.lightT3,
                textDecoration: 'none', marginRight: space.sm,
                backgroundColor: color.lightBgSub,
              }}>
                {s.label}
              </a>
            ))}
          </div>

          {/* ── DATA SOURCES ── */}
          <section id="data-sources" style={{ marginBottom: space[16], scrollMarginTop: space.xl }}>
            <h2 style={sectionH2}>Data Sources</h2>
            <p style={prose}>
              Every data point on ConstructAIQ originates from a public government or
              intergovernmental API. No proprietary data is purchased or licensed.
              No data is scraped from websites.
            </p>
            <p style={prose}>
              The harvest pipeline runs on a daily schedule and stores observations in a
              Supabase time-series database. Most government statistical series have inherent
              publication lag — Census construction spending, for example, is typically
              released five to six weeks after the reference month. The dashboard always
              shows the most recently published data, not current conditions.
            </p>

            <div style={calloutStyle}>
              <strong>Caching and fallback:</strong> When an upstream API is unavailable,
              ConstructAIQ serves the most recently harvested data from its database.
              The UI and API responses include freshness metadata so you can see exactly
              how current the data is. Some sources — particularly federal award and
              solicitation data — may be cached for up to 24 hours. Check the freshness
              indicator on each section or visit{' '}
              <Link href="/status" style={{ ...linkStyle, fontSize: 14 }}>/status</Link>{' '}
              for the current state of each pipeline.
            </div>

            <h3 style={h3Style}>Census Bureau — construction spending</h3>
            <p style={prose}>
              The primary spending series — total construction (TTLCONS), residential
              starts (HOUST), and building permits (PERMIT) — come from the Census Bureau
              Value of Construction Put in Place survey. Releases lag the reference month
              by approximately five to six weeks. Preliminary values are revised at the
              following release and again at annual benchmarks. The forecast models train
              on preliminary values and may diverge slightly from subsequently revised data.
            </p>

            <h3 style={h3Style}>Bureau of Labor Statistics (BLS)</h3>
            <p style={prose}>
              Construction employment (CES2000000001) and sector Producer Price Indexes
              (PCU2362 series for commercial building, PCU237 for civil engineering) come
              from BLS public APIs. Employment data is seasonally adjusted and subject to
              annual benchmark revision. PPI sub-series feed the materials cost signals
              for lumber, steel, concrete, and copper.
            </p>

            <h3 style={h3Style}>Federal Reserve / FRED</h3>
            <p style={prose}>
              Macroeconomic context — 30-year mortgage rates, the federal funds effective
              rate, housing starts (HOUST), and other macro series — is sourced via the
              FRED API using published series IDs. Most macro series are monthly; the
              federal funds rate is weekly. FRED data undergoes the same harvest-and-cache
              cycle as other sources.
            </p>

            <h3 style={h3Style}>USASpending.gov</h3>
            <p style={prose}>
              Federal construction contract awards are pulled from USASpending.gov,
              filtered to NAICS codes 2361–2389. The platform shows obligation amounts —
              the money an agency has contractually committed — not disbursements or
              completed payments. Obligation-to-disbursement timelines vary widely by
              program. The federal infrastructure tracker (IIJA, IRA programs) uses this
              source. Data is refreshed daily when the upstream API is available; otherwise
              the previous harvest is served.
            </p>

            <h3 style={h3Style}>SAM.gov solicitations</h3>
            <p style={prose}>
              Active federal bid opportunities — pre-solicitations, solicitations, and
              sources sought notices for NAICS 236/237/238 — are sourced from the SAM.gov
              public API. The solicitation feed is not guaranteed to be real-time; results
              may reflect a recent snapshot rather than the live feed. Check the freshness
              indicator on the solicitation section.
            </p>

            <h3 style={h3Style}>City permit data</h3>
            <p style={prose}>
              Monthly residential building permit issuance at the city level comes from
              the Census Bureau Building Permit Survey. Coverage is limited to the
              approximately 59 cities in the Census survey universe. Jurisdictions outside
              this universe — many smaller cities and rural areas — are not represented.
              This is a structural limitation of the underlying public data.
            </p>

            <h3 style={h3Style}>Satellite and ground-activity signals</h3>
            <p style={prose}>
              Ground-disturbance signals for 20 US metropolitan areas are derived from
              ESA Sentinel-2 satellite imagery (Copernicus programme) using the Bare Soil
              Index (BSI). Each satellite makes approximately one pass every 12 days under
              clear conditions; the signal is aggregated to a monthly value. Cloud cover,
              seasonal vegetation change, and pass timing can cause gaps. BSI is a proxy
              for construction ground activity, not a legal record of permits or work in
              progress.
            </p>

            <h3 style={h3Style}>WARN Act notices</h3>
            <p style={prose}>
              Advance layoff notices filed by construction companies under the federal
              Worker Adjustment and Retraining Notification (WARN) Act are harvested from
              DOL public filings. WARN notices are required only from employers with 100 or
              more workers laying off 50 or more employees. Small companies, voluntary
              departures, and layoffs below the threshold are not captured. The signal
              reflects large-scale workforce reductions, not industry-wide employment trends.
            </p>

            <h3 style={h3Style}>Construction cost data</h3>
            <p style={prose}>
              Materials cost signals — BUY/SELL/HOLD designations for lumber, steel,
              concrete, copper, diesel, and WTI crude — are derived from BLS Producer
              Price Indexes and EIA weekly price series. No proprietary construction cost
              database is used. The signals reflect commodity price trends, not installed
              construction cost or project bid data, which ConstructAIQ does not collect.
            </p>

            <div style={{ overflowX: 'auto' }}>
              <p style={{ ...prose, marginBottom: 12, marginTop: 28 }}>
                <strong>Summary table</strong>
              </p>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Source</th>
                    <th style={thStyle}>What it provides</th>
                    <th style={thStyle}>Cadence</th>
                    <th style={thStyle}>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {DATA_SOURCES.map(row => (
                    <tr key={row.source}>
                      <td style={{ ...tdStyle, fontWeight: 600, whiteSpace: 'nowrap', color: color.lightT1 }}>
                        {row.source}
                      </td>
                      <td style={tdStyle}>{row.provides}</td>
                      <td style={{ ...tdStyle, ...noteStyle, whiteSpace: 'nowrap' }}>{row.cadence}</td>
                      <td style={{ ...tdStyle, ...noteStyle, color: color.lightT3 }}>{row.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* ── FRESHNESS AND SOURCE HEALTH ── */}
          <section id="freshness" style={{ marginBottom: space[16], scrollMarginTop: space.xl }}>
            <h2 style={sectionH2}>Freshness and Source Health</h2>
            <p style={prose}>
              ConstructAIQ attaches freshness metadata to every data point and API
              response so users can see exactly how current the data is. This section
              explains the vocabulary used throughout the platform.
            </p>

            <h3 style={h3Style}>Data as-of</h3>
            <p style={prose}>
              <strong>Data as-of</strong> is the reference date of the underlying data —
              the end of the period the data describes. For example, if the Census Bureau
              releases construction spending data in late May for the month of March, the
              data as-of date is March 31. The dashboard displays the most recently
              published period, which lags real-world conditions by weeks or months
              depending on the source.
            </p>
            <p style={prose}>
              Data as-of is distinct from when ConstructAIQ fetched the data. A value can
              have been fetched today but still describe conditions from six weeks ago.
            </p>

            <h3 style={h3Style}>Last refreshed</h3>
            <p style={prose}>
              <strong>Last refreshed</strong> is the timestamp of the most recent
              successful pipeline run for a given source — the last time ConstructAIQ
              successfully fetched and stored data from the upstream API. It appears
              on the DataTrustBadge shown under each dashboard section and on{' '}
              <Link href="/status" style={linkStyle}>/status</Link>.
            </p>
            <p style={prose}>
              If last refreshed is recent but data as-of is old, the pipeline is
              healthy — the upstream source simply has not published newer data yet.
              If last refreshed is old, the pipeline may have failed or the upstream
              source may be unavailable.
            </p>

            <h3 style={h3Style}>Cadence</h3>
            <p style={prose}>
              <strong>Cadence</strong> is the expected publication frequency for a
              source. The harvest pipeline runs daily, but each source only publishes
              data at its own pace:
            </p>
            <ul style={{ ...prose, paddingLeft: 24 }}>
              <li style={{ marginBottom: 6 }}>
                <strong>Monthly</strong> — Census Bureau construction spending, BLS employment and PPI, BEA state GDP
              </li>
              <li style={{ marginBottom: 6 }}>
                <strong>Weekly</strong> — EIA diesel and crude prices, FRED mortgage rates
              </li>
              <li style={{ marginBottom: 6 }}>
                <strong>~Every 12 days</strong> — Sentinel-2 satellite passes; processed to monthly signals
              </li>
              <li style={{ marginBottom: 6 }}>
                <strong>As filed</strong> — WARN Act layoff notices (filed by employers on their own schedule)
              </li>
              <li>
                <strong>Periodic</strong> — SAM.gov solicitation notices (harvested when the pipeline runs; not guaranteed to be real-time)
              </li>
            </ul>

            <h3 style={h3Style}>Freshness status labels</h3>
            <p style={prose}>
              The DataTrustBadge on each dashboard section uses one of four status labels:
            </p>
            <ul style={{ ...prose, paddingLeft: 24 }}>
              <li style={{ marginBottom: 8 }}>
                <strong>Fresh</strong> — the pipeline ran successfully within the last 24 hours.
              </li>
              <li style={{ marginBottom: 8 }}>
                <strong>Stale</strong> — the pipeline last ran between 1 and 6 days ago.
                The data may still be the most recently published value from the upstream
                source, but the pipeline has not confirmed it recently.
              </li>
              <li style={{ marginBottom: 8 }}>
                <strong>Delayed</strong> — the pipeline has not run in 7 or more days.
                The data is likely behind. Check{' '}
                <Link href="/status" style={linkStyle}>/status</Link> to see whether a
                pipeline failure is responsible.
              </li>
              <li>
                <strong>Unknown</strong> — no timestamp is available for this source.
                This occurs on initial deployment before the first harvest run completes.
              </li>
            </ul>

            <h3 style={h3Style}>Response mode: live, cached, fallback</h3>
            <p style={prose}>
              API responses and dashboard sections indicate one of three response modes:
            </p>
            <ul style={{ ...prose, paddingLeft: 24 }}>
              <li style={{ marginBottom: 8 }}>
                <strong>Live</strong> — the data was computed from a recent upstream API
                call or a Supabase row written within the expected cadence window.
                <code style={{ fontFamily: MONO, fontSize: 12, marginLeft: 6 }}>live: true</code>
                in API responses.
              </li>
              <li style={{ marginBottom: 8 }}>
                <strong>Cached</strong> — the upstream API was not called this request,
                but a recently harvested row from Supabase was served instead. The data
                is real but was not fetched at this moment. Federal award data, for
                example, is cached for up to 24 hours between harvest runs.
              </li>
              <li>
                <strong>Fallback</strong> — the upstream source was unavailable and no
                recent cache exists. The platform serves the most recently stored data
                (which may be days or weeks old) or static seed data. Fallback responses
                are always labeled in the UI and in API response metadata.
                <code style={{ fontFamily: MONO, fontSize: 12, marginLeft: 6 }}>live: false</code>
                in API responses.
              </li>
            </ul>

            <h3 style={h3Style}>Source health dashboard</h3>
            <p style={prose}>
              <Link href="/status" style={linkStyle}>/status</Link> shows the live
              operational state of every data pipeline. Each source in the Source Health
              table has one of these states:
            </p>
            <ul style={{ ...prose, paddingLeft: 24 }}>
              <li style={{ marginBottom: 6 }}>
                <strong>Fresh</strong> (green) — ran within the expected cadence window and wrote rows.
              </li>
              <li style={{ marginBottom: 6 }}>
                <strong>Degraded</strong> (amber) — ran but wrote fewer rows than expected.
              </li>
              <li style={{ marginBottom: 6 }}>
                <strong>Failed</strong> (red) — the last run produced an error or wrote no rows.
              </li>
              <li style={{ marginBottom: 6 }}>
                <strong>Skipped</strong> — the run was intentionally skipped (e.g., source
                is not yet integrated for the current environment).
              </li>
              <li>
                <strong>Unknown</strong> — no run record exists yet; the pipeline has not
                completed its first run.
              </li>
            </ul>
            <p style={prose}>
              The Data Freshness table on{' '}
              <Link href="/status" style={linkStyle}>/status</Link> aggregates freshness
              per series (rather than per pipeline run) and shows <strong>Current</strong>,{' '}
              <strong>Delayed</strong>, or <strong>Stale</strong> based on how recently
              observations were written to the database for that series.
            </p>

            <div style={calloutStyle}>
              Fallback and cached data is always labeled. When the dashboard shows stale or
              fallback data, the DataTrustBadge surfaces the mode and timestamp so users
              are not misled about the data&apos;s recency. If a source is showing
              fallback data, check{' '}
              <Link href="/status" style={{ ...linkStyle, fontSize: 14 }}>/status</Link>{' '}
              to see whether the pipeline has failed.
            </div>
          </section>

          {/* ── FORECAST METHODOLOGY ── */}
          <section id="forecast-methodology" style={{ marginBottom: space[16], scrollMarginTop: space.xl }}>
            <h2 style={sectionH2}>Forecast Methodology</h2>

            <div style={calloutStyle}>
              Forecasts are statistical model outputs — they are not statements of fact
              about the future. Economic data is noisy, subject to revision, and influenced
              by events no model can anticipate. Every forecast should be read alongside
              its confidence bands, the freshness of the underlying data, and any caveats
              shown on the dashboard.
            </div>

            <h3 style={h3Style}>Forecasts are model outputs, not facts</h3>
            <p style={prose}>
              A forecast is the output of a statistical model trained on historical
              patterns. It reflects what the model expects given the data it was trained
              on — not a determination of what will actually happen. Construction spending
              is affected by interest rate decisions, weather events, legislative changes,
              supply shocks, and many other factors that are structurally outside the
              scope of any time-series model.
            </p>
            <p style={prose}>
              ConstructAIQ does not express certainty about forecast outcomes. The
              dashboard displays directional trends and probability ranges, not point
              predictions presented as facts.
            </p>

            <h3 style={h3Style}>3-model ensemble</h3>
            <p style={prose}>
              ConstructAIQ forecasts are produced by combining three models:
            </p>
            <ul style={{ ...prose, paddingLeft: 24, marginBottom: 16 }}>
              <li style={{ marginBottom: 8 }}>
                <strong>Holt-Winters Double Exponential Smoothing</strong> — captures
                level and trend in a time series without requiring stationarity.
              </li>
              <li style={{ marginBottom: 8 }}>
                <strong>SARIMA(1,1,0)(0,1,0)[12]</strong> — a seasonal autoregressive
                integrated moving-average model tuned for monthly construction series.
              </li>
              <li style={{ marginBottom: 8 }}>
                <strong>XGBoost gradient-boosted tree</strong> — a machine-learning
                model trained on lagged features derived from the same series.
              </li>
            </ul>
            <p style={prose}>
              The three forecasts are blended using accuracy weights. Weights are
              recalculated each run based on each model&apos;s recent mean absolute
              percentage error (MAPE) on held-out data. A model with lower recent
              MAPE receives a higher blend weight for that run.
            </p>

            <h3 style={h3Style}>Confidence bands represent uncertainty</h3>
            <p style={prose}>
              Every forecast includes an 80% and a 95% prediction interval. These
              are not upper and lower bounds on the future — they are estimates of
              where the outcome would fall if the model&apos;s historical error distribution
              holds in the future.
            </p>
            <p style={prose}>
              An 80% band means approximately 80 out of 100 future outcomes would be
              expected to fall within that range, based on past residuals. The 95% band
              is wider and represents a higher-confidence envelope. Wider bands indicate
              higher model uncertainty — typically when series history is short, recent
              volatility is elevated, or the models disagree with each other.
            </p>
            <p style={prose}>
              When the MAPE shown on the dashboard is elevated, the forecast carries
              more uncertainty than usual and the bands should be weighted accordingly.
              The dashboard surfaces a caveat when this is the case.
            </p>

            <h3 style={h3Style}>Forecasts change as data is revised</h3>
            <p style={prose}>
              Forecasts are recomputed each time the cron runs. If the upstream data
              changes — because a government agency published a revision to a prior
              month&apos;s figures — the models retrain on the revised history and the
              forecast may shift.
            </p>
            <p style={prose}>
              Census Bureau construction spending figures are revised at the following
              monthly release and again at annual benchmarks. A large revision to recent
              history can materially change the trend the models detect, and therefore
              change the forecast direction. This is expected behavior, not a bug.
              It reflects the fact that the underlying data itself changed.
            </p>
            <p style={prose}>
              The forecast displayed on the dashboard is the most recently computed run.
              The <code style={{ fontFamily: MONO, fontSize: 13 }}>runAt</code> timestamp
              shown on the DataTrustBadge indicates when that run completed. If the
              pipeline has not run recently, the displayed forecast may be based on
              data that has since been revised.
            </p>

            <h3 style={h3Style}>Backtesting</h3>
            <p style={prose}>
              Backtesting is the process of evaluating a model against historical data
              it did not see during training. ConstructAIQ uses a walk-forward
              backtesting approach: models are trained up to a cutoff date, a forecast
              is generated for the following months, and then realized actuals from
              Census Bureau releases are compared to those predictions once they become
              available.
            </p>
            <p style={prose}>
              Backtest results measure MAPE (mean absolute percentage error) —
              the average percentage by which the forecast missed the realized value —
              and PAR (Prediction Accuracy Rate), which measures how often realized
              outcomes fall within the stated confidence intervals. These metrics are
              computed from realized outcomes and are not adjusted after the fact.
            </p>
            <p style={prose}>
              Current backtest results and accuracy history are available at{' '}
              <Link href="/methodology/track-record" style={linkStyle}>
                /methodology/track-record
              </Link>{' '}
              and via the{' '}
              <Link href="/api/par" style={linkStyle}>/api/par</Link> endpoint.
              This page does not state specific accuracy figures because those figures
              change as new predictions mature.
            </p>

            <h3 style={h3Style}>Using forecasts responsibly</h3>
            <p style={prose}>
              Before acting on a forecast, check:
            </p>
            <ul style={{ ...prose, paddingLeft: 24 }}>
              <li style={{ marginBottom: 8 }}>
                <strong>Data freshness</strong> — the DataTrustBadge beneath the
                forecast chart shows when the forecast was last computed and whether
                the underlying source data is current. A stale forecast based on
                unrevised data carries additional uncertainty.
              </li>
              <li style={{ marginBottom: 8 }}>
                <strong>Confidence band width</strong> — wider bands mean the models
                are less certain. When bands are wide, the directional signal is weaker.
              </li>
              <li style={{ marginBottom: 8 }}>
                <strong>MAPE and caveats</strong> — elevated MAPE triggers a caveat
                on the dashboard. This means recent model error is above the platform&apos;s
                normal range and the forecast should be treated with more caution.
              </li>
              <li>
                <strong>Structural context</strong> — consider whether recent events
                (policy changes, rate moves, supply disruptions) are likely to be
                outside the model&apos;s training distribution. If so, treat the forecast
                as a baseline, not a reliable projection.
              </li>
            </ul>

            <p style={prose}>
              Full model documentation — equations, training procedure, walk-forward
              methodology, and accuracy history — is at{' '}
              <Link href="/methodology" style={linkStyle}>/methodology</Link>.
            </p>
          </section>

          {/* ── PREDICTION VALIDATION ── */}
          <section id="prediction-validation" style={{ marginBottom: space[16], scrollMarginTop: space.xl }}>
            <h2 style={sectionH2}>Prediction Validation</h2>
            <p style={prose}>
              ConstructAIQ tracks whether its forecasts were correct after the fact.
              This section explains how that tracking works, what metrics are computed,
              and where to find current accuracy figures. No specific accuracy values
              are stated here because they change as predictions mature and new actuals
              are published.
            </p>

            <h3 style={h3Style}>What gets tracked</h3>
            <p style={prose}>
              When a forecast run completes, the system logs each predicted value
              together with:
            </p>
            <ul style={{ ...prose, paddingLeft: 24 }}>
              <li style={{ marginBottom: 6 }}>
                The target series and the month being forecast (the maturity date)
              </li>
              <li style={{ marginBottom: 6 }}>
                The point estimate (ensemble midpoint)
              </li>
              <li style={{ marginBottom: 6 }}>
                The 80% and 95% confidence interval bounds at the time of the run
              </li>
              <li>
                The forecast horizon — how many months ahead the prediction was made
              </li>
            </ul>
            <p style={prose}>
              Once the maturity date passes and the Census Bureau publishes actuals
              for that period, the system evaluates each logged prediction against
              the realized value. Predictions in the database are either{' '}
              <strong>pending</strong> (maturity date has not elapsed or actuals have
              not yet been harvested) or <strong>resolved</strong> (compared against
              a realized value).
            </p>

            <h3 style={h3Style}>Prediction Accuracy Rate (PAR)</h3>
            <p style={prose}>
              PAR — Prediction Accuracy Rate — is the fraction of resolved predictions
              where the realized value fell within the stated confidence interval.
            </p>
            <p style={prose}>
              A PAR close to 80% on the 80% interval indicates the model is well
              calibrated: its stated uncertainty matches its observed error rate.
              PAR consistently above 80% on the 80% band suggests the model is
              over-cautious — intervals are wider than they need to be. PAR
              consistently below 80% suggests the model is over-confident — it is
              missing outcomes it claimed to cover.
            </p>
            <p style={prose}>
              PAR is computed separately by confidence interval level (80% and 95%)
              and by forecast horizon (1-month-ahead, 3-month, 6-month, 12-month).
              Shorter horizons are generally more accurate; accuracy degrades as
              the horizon extends.
            </p>

            <h3 style={h3Style}>Forecast vs. actual: directional accuracy</h3>
            <p style={prose}>
              In addition to interval coverage, the system tracks directional
              accuracy — whether the forecast correctly predicted the direction of
              change (growth or contraction) relative to the prior period.
              Directional accuracy matters for decisions that depend on the sign
              of the move rather than the magnitude.
            </p>
            <p style={prose}>
              Directional accuracy is typically higher than raw MAPE would suggest,
              because a forecast can be directionally correct while still
              over- or under-estimating the magnitude. Both metrics are shown on
              the track record page.
            </p>

            <h3 style={h3Style}>Early-stage sample sizes</h3>
            <p style={prose}>
              PAR accumulates as predictions mature. When the platform is young or
              has recently been redeployed, the resolved sample size may be small.
              A PAR computed from a small sample carries wide confidence and should
              not be treated as a stable indicator of model performance. The
              sample size is reported alongside every PAR figure. Weight
              longer-run figures more than recent-window figures when the platform
              is early in its deployment.
            </p>

            <div style={calloutStyle}>
              Current PAR values are sourced from live evaluation records and are
              not stated on this page. This avoids the page going stale between
              edits. Accuracy figures are only shown where they are fetched
              directly from{' '}
              <Link href="/api/par" style={{ ...linkStyle, fontSize: 14 }}>/api/par</Link>{' '}
              or displayed from stored evaluation data on{' '}
              <Link href="/status" style={{ ...linkStyle, fontSize: 14 }}>/status</Link>{' '}
              and{' '}
              <Link href="/methodology/track-record" style={{ ...linkStyle, fontSize: 14 }}>
                /methodology/track-record
              </Link>.
            </div>

            <h3 style={h3Style}>Where to find current accuracy figures</h3>
            <ul style={{ ...prose, paddingLeft: 24 }}>
              <li style={{ marginBottom: 8 }}>
                <Link href="/methodology/track-record" style={linkStyle}>
                  /methodology/track-record
                </Link>{' '}
                — full accuracy record: PAR by confidence level and horizon, MAPE
                history, directional accuracy, and resolved vs. pending prediction counts
              </li>
              <li style={{ marginBottom: 8 }}>
                <Link href="/status" style={linkStyle}>/status</Link>{' '}
                — live platform health dashboard showing current PAR (overall and
                trailing 7-day), prediction activity counts, and a 12-week PAR trend chart
              </li>
              <li>
                <Link href="/api/par" style={linkStyle}>/api/par</Link>{' '}
                — raw JSON endpoint returning{' '}
                <code style={{ fontFamily: MONO, fontSize: 12 }}>overall_par</code>,{' '}
                <code style={{ fontFamily: MONO, fontSize: 12 }}>sample_size</code>, and{' '}
                <code style={{ fontFamily: MONO, fontSize: 12 }}>as_of</code>;
                available to any caller without authentication
              </li>
            </ul>
          </section>

          {/* ── AI ANALYST GUARDRAILS ── */}
          <section id="ai-guardrails" style={{ marginBottom: space[16], scrollMarginTop: space.xl }}>
            <h2 style={sectionH2}>AI Analyst Guardrails</h2>
            <p style={prose}>
              The{' '}
              <Link href="/ask" style={linkStyle}>Ask the Market</Link>{' '}
              interface accepts plain-language questions about construction market
              conditions. Answers are generated by Claude (Anthropic API) using
              data fetched at query time from ConstructAIQ&apos;s internal APIs.
            </p>
            <p style={prose}>
              This section states the guardrails the AI analyst is designed to
              follow. These are design intentions, not a guarantee that every
              response will be perfect. If a response appears to violate these
              rules, treat it with appropriate skepticism.
            </p>

            <h3 style={h3Style}>Answers cite their source data</h3>
            <p style={prose}>
              Every response should identify which data sources were queried to
              produce the answer — for example, Census Bureau construction spending,
              BLS employment, federal award records, or permit data. A response
              that makes a statistical claim without citing a source should be
              treated as unverified.
            </p>
            <p style={prose}>
              The system fetches relevant data at query time and passes it to
              the model as context. The model is instructed to answer from that
              context only, not from general knowledge about construction markets.
            </p>

            <h3 style={h3Style}>Answers state confidence, not certainty</h3>
            <p style={prose}>
              When an answer involves a forecast or a projection, it should state
              the confidence interval or qualify the claim as a model output.
              Phrases like &ldquo;the forecast suggests&rdquo; or &ldquo;the model projects&rdquo; are
              appropriate. Phrases that express certainty about a future outcome
              are not. If a response states a future value as fact rather than as
              a model estimate, it has not followed this guardrail.
            </p>

            <h3 style={h3Style}>Forecasts are labeled as forecasts</h3>
            <p style={prose}>
              Historical data and forecast data are different in kind. An answer
              that quotes a past Census Bureau observation is citing a published
              fact. An answer that quotes a 12-month-ahead projected value is
              citing a model output. The AI is instructed to mark this distinction
              explicitly — not to present forecast values and historical actuals
              in the same register.
            </p>

            <h3 style={h3Style}>Insufficient data is stated, not hidden</h3>
            <p style={prose}>
              If a question requires data ConstructAIQ does not have — a market
              not covered by any source, a metric not tracked, a time period
              before the available history — the answer should say so directly.
              The expected response is an explicit statement that the data is
              not available, not a hedged guess using training-data knowledge.
            </p>

            <h3 style={h3Style}>No invented numbers</h3>
            <p style={prose}>
              The AI is instructed not to fabricate statistics, percentages, or
              dollar figures that are not present in the data context passed to
              it. Any number in an answer should be traceable to a specific
              source in the queried data. If a number cannot be sourced, it
              should not appear in the response.
            </p>
            <p style={prose}>
              This is especially important for figures that sound plausible but
              are not in the data — regional estimates, composite averages, or
              cross-source calculations that were not explicitly computed. The
              AI is not a calculator operating on live data; it is a language
              model operating on a text snapshot of queried results.
            </p>

            <h3 style={h3Style}>No investment, legal, or procurement advice as certainty</h3>
            <p style={prose}>
              ConstructAIQ provides market intelligence, not professional advice.
              The AI should not instruct users to make a specific financial,
              legal, or procurement decision as if that decision were clearly
              correct. Framing such as &ldquo;you should bid on this contract&rdquo; or
              &ldquo;this is a safe investment&rdquo; is outside the scope of what this
              platform is designed to provide.
            </p>
            <p style={prose}>
              Responses may describe market conditions, signal strength, and
              forecast direction. They should present this as context for a
              decision — not as the decision itself. Users making consequential
              financial, operational, or legal choices should consult qualified
              professionals.
            </p>

            <h3 style={h3Style}>Data lag applies to AI answers</h3>
            <p style={prose}>
              The AI analyst can only work with data ConstructAIQ has harvested.
              If the Census Bureau construction spending series lags six weeks,
              any answer about current spending reflects that same six-week lag.
              The AI does not have access to information that has not been
              ingested into the platform — it cannot fill gaps from external
              knowledge or real-time web data.
            </p>

            <div style={calloutStyle}>
              These guardrails are system design intentions enforced through
              prompt instructions. They are not a technical constraint that
              makes violations impossible. If a response appears to violate
              these rules — fabricating a number, expressing certainty about
              a forecast, or omitting a source citation — that is a failure
              to be noted, not an expected behavior.
            </div>
          </section>

          {/* ── LIMITATIONS ── */}
          <section id="limitations" style={{ marginBottom: space[16], scrollMarginTop: space.xl }}>
            <h2 style={sectionH2}>Limitations</h2>
            <p style={prose}>
              ConstructAIQ is a free platform built on public data. The limitations
              below are real and consequential. Read them before relying on this
              platform for decisions that matter.
            </p>

            <h3 style={h3Style}>Public data can lag by weeks or months</h3>
            <p style={prose}>
              Most government statistical series reflect conditions from the recent
              past, not the present. Census Bureau construction spending data for a
              given month is typically published five to six weeks later. BLS
              employment data for a reference month is released roughly two weeks
              after month end. BEA state GDP data is quarterly and released months
              after the reference quarter.
            </p>
            <p style={prose}>
              The dashboard always shows the most recently published data — not
              current market conditions. A user reading the dashboard in late April
              is likely looking at February or early March data for most series.
              This lag is inherent to public government statistics and cannot be
              eliminated.
            </p>

            <h3 style={h3Style}>Public data can be revised after publication</h3>
            <p style={prose}>
              Preliminary government estimates are routinely revised. Census Bureau
              construction spending figures are revised at the following monthly
              release and again at annual benchmarks. BLS employment data undergoes
              annual benchmark revisions that can substantially change prior-period
              figures. Large revisions — moving an estimate by several percent — are
              not uncommon after major economic events.
            </p>
            <p style={prose}>
              ConstructAIQ forecasts train on whatever figures the upstream source
              currently reports. If a prior period is revised, the next forecast run
              will train on the revised history, and the forecast may shift. A
              forecast computed before a revision and one computed after may differ
              materially, both being correct given the data available at the time.
            </p>

            <h3 style={h3Style}>Permit data is incomplete and inconsistent across jurisdictions</h3>
            <p style={prose}>
              City-level permit data comes from the Census Bureau Building Permit
              Survey, which covers a defined universe of approximately 59 cities.
              Jurisdictions outside this universe are not represented. Coverage
              varies: some surveyed cities report every month; others have gaps.
              Permit definitions, fee structures, and reporting procedures differ
              by municipality — a single-family permit in one jurisdiction is not
              directly comparable to one in another.
            </p>
            <p style={prose}>
              Permit issuance measures authorization to build, not construction
              starts or completions. A permit may be issued months before work
              begins, and some permits are never acted upon. Permit trends are a
              leading signal, not a count of actual construction activity.
            </p>

            <h3 style={h3Style}>Some feeds may be cached or in fallback mode</h3>
            <p style={prose}>
              ConstructAIQ depends on free-tier public APIs. When an upstream
              source is temporarily unavailable, the platform serves the most
              recently harvested data from its database rather than returning an
              error. For some sources — particularly federal award and solicitation
              data — this cache may be up to 24 hours old. In less common
              situations, the platform may serve static fallback data that is
              days or weeks behind.
            </p>
            <p style={prose}>
              Every section and API response includes freshness metadata indicating
              the response mode (live, cached, or fallback) and the timestamp of
              the last successful data fetch. If you see a &ldquo;fallback&rdquo; or
              &ldquo;stale&rdquo; indicator, the data shown may not reflect the current
              state of the upstream source. Check{' '}
              <Link href="/status" style={linkStyle}>/status</Link> to see which
              pipelines are running normally.
            </p>

            <h3 style={h3Style}>Forecasts are probabilistic, not determinate</h3>
            <p style={prose}>
              Every forecast is a probability distribution over possible futures,
              not a statement about what will happen. The confidence intervals are
              derived from historical model residuals — they describe how the
              model has behaved in the past, not how the future will behave.
            </p>
            <p style={prose}>
              The models do not account for structural breaks: events that fall
              outside the historical distribution the models were trained on.
              A sudden shift in interest rates, a major policy change, or an
              economic shock will cause realized outcomes to fall outside the
              stated intervals. This is not a model failure — it is an inherent
              limitation of statistical forecasting. Treat confidence bands as
              an estimate of normal-conditions uncertainty, not a guarantee
              that extreme outcomes are impossible.
            </p>
            <p style={prose}>
              Forecast accuracy degrades with horizon. A 1-month-ahead forecast
              is more reliable than a 12-month-ahead forecast. The platform tracks
              this by horizon — see{' '}
              <Link href="/methodology/track-record" style={linkStyle}>
                /methodology/track-record
              </Link>{' '}
              for current figures.
            </p>

            <h3 style={h3Style}>AI explanations depend on available source data</h3>
            <p style={prose}>
              The AI analyst can only reason about data that has been ingested
              into ConstructAIQ. If a source is stale, in fallback mode, or
              covers only a subset of markets, the AI&apos;s answers reflect those
              same constraints. An AI explanation of &ldquo;current&rdquo; construction
              conditions in a given market is only as current as the most recently
              harvested data for that market — which may lag real conditions by
              weeks.
            </p>
            <p style={prose}>
              The AI does not supplement ConstructAIQ data with external knowledge
              or real-time web data. Questions about markets, periods, or metrics
              not covered by an ingested source will return an explicit
              &ldquo;insufficient data&rdquo; response rather than a generated estimate.
            </p>

            <h3 style={h3Style}>Verify critical decisions against original records</h3>
            <p style={prose}>
              ConstructAIQ aggregates public data to surface signals and trends.
              It is not a primary source. For decisions with legal, financial, or
              operational consequences, verify the underlying figures against the
              original government or agency records:
            </p>
            <ul style={{ ...prose, paddingLeft: 24 }}>
              <li style={{ marginBottom: 6 }}>
                Construction spending — <a href="https://www.census.gov/construction/c30/c30index.html" style={{ ...linkStyle, fontSize: 14 }}>Census Bureau C30</a>
              </li>
              <li style={{ marginBottom: 6 }}>
                Employment — <a href="https://www.bls.gov/ces/" style={{ ...linkStyle, fontSize: 14 }}>BLS Current Employment Statistics</a>
              </li>
              <li style={{ marginBottom: 6 }}>
                Federal awards — <a href="https://www.usaspending.gov" style={{ ...linkStyle, fontSize: 14 }}>USASpending.gov</a>
              </li>
              <li style={{ marginBottom: 6 }}>
                Federal solicitations — <a href="https://sam.gov" style={{ ...linkStyle, fontSize: 14 }}>SAM.gov</a>
              </li>
              <li>
                Building permits — <a href="https://www.census.gov/construction/bps/" style={{ ...linkStyle, fontSize: 14 }}>Census Bureau Building Permits Survey</a>
              </li>
            </ul>
            <p style={prose}>
              ConstructAIQ may show an aggregated or processed version of these
              figures that differs from the primary source due to lag, caching,
              or the series definitions used. When accuracy matters, go to the source.
            </p>

            <div style={{ ...calloutStyle, borderLeft: `3px solid ${color.amber}`, marginTop: 28, marginBottom: 0 }}>
              Signals, forecasts, and AI explanations on this platform are
              analytical outputs intended to inform decisions. They are not
              professional advice. Consult qualified professionals before making
              consequential financial, legal, operational, or procurement decisions.
            </div>
          </section>

          {/* Footer nav */}
          <div style={{
            borderTop: `1px solid ${color.lightBd}`, paddingTop: space.xl,
            display: 'flex', gap: space.lg, flexWrap: 'wrap',
          }}>
            <Link href="/methodology" style={linkStyle}>Full Methodology →</Link>
            <Link href="/status" style={linkStyle}>Source Health →</Link>
            <Link href="/methodology/track-record" style={linkStyle}>Forecast Track Record →</Link>
            <Link href="/dashboard" style={linkStyle}>Open Dashboard →</Link>
          </div>

        </div>
      </div>
    </div>
  )
}
