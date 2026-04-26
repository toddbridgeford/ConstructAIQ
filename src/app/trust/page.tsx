import type { Metadata } from 'next'
import Link from 'next/link'
import { font } from '@/lib/theme'

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
  fontFamily: SYS, fontSize: 15, lineHeight: 1.8, color: '#333', marginBottom: 16,
}

const sectionH2: React.CSSProperties = {
  fontFamily: SYS, fontSize: 24, fontWeight: 700,
  color: '#111', marginBottom: 16, paddingBottom: 12,
  borderBottom: '2px solid #eee',
}

const h3Style: React.CSSProperties = {
  fontFamily: SYS, fontSize: 17, fontWeight: 600,
  color: '#111', marginBottom: 8, marginTop: 28,
}

const tableStyle: React.CSSProperties = {
  width: '100%', borderCollapse: 'collapse',
  fontFamily: SYS, fontSize: 14,
  marginTop: 20, marginBottom: 8,
}

const thStyle: React.CSSProperties = {
  textAlign: 'left', padding: '10px 14px',
  background: '#f5f5f5', fontWeight: 600,
  fontSize: 11, letterSpacing: '0.05em',
  textTransform: 'uppercase', color: '#555',
  borderBottom: '2px solid #eee',
}

const tdStyle: React.CSSProperties = {
  padding: '10px 14px', borderBottom: '1px solid #eee',
  color: '#333', verticalAlign: 'top', lineHeight: 1.6,
}

const noteStyle: React.CSSProperties = {
  fontFamily: MONO, fontSize: 12, color: '#555', lineHeight: 1.6,
}

const linkStyle: React.CSSProperties = {
  color: '#0a84ff', textDecoration: 'none', fontFamily: SYS, fontSize: 14,
}

const calloutStyle: React.CSSProperties = {
  background: '#f8f8f8', border: '1px solid #e5e5e5',
  borderLeft: '3px solid #aaa', borderRadius: '0 8px 8px 0',
  padding: '14px 20px', marginBottom: 20,
  fontFamily: SYS, fontSize: 14, color: '#444', lineHeight: 1.7,
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
    <div style={{ minHeight: '100vh', background: '#ffffff', color: '#111111' }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        a { color: inherit; text-decoration: none; }
        @media (max-width: 700px) {
          .tc-shell   { flex-direction: column !important; padding: 24px 20px !important; }
          .tc-nav     { display: none !important; }
          .tc-content { max-width: 100% !important; }
        }
      `}</style>

      <div className="tc-shell" style={{
        maxWidth: 1100, margin: '0 auto',
        display: 'flex', flexDirection: 'row',
        gap: 48, padding: '48px 40px',
      }}>

        {/* ── Left nav ── */}
        <nav className="tc-nav" style={{
          width: 200, flexShrink: 0,
          position: 'sticky', top: 32,
          alignSelf: 'flex-start', height: 'fit-content',
        }}>
          <div style={{
            fontFamily: MONO, fontSize: 10, color: '#888',
            letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16,
          }}>
            Contents
          </div>
          {SECTIONS.map(s => (
            <a key={s.id} href={`#${s.id}`} style={{
              display: 'block', padding: '6px 12px', borderRadius: 6,
              fontFamily: SYS, fontSize: 14, textDecoration: 'none',
              marginBottom: 2, color: '#555', fontWeight: 400,
              borderLeft: '3px solid transparent',
            }}>
              {s.label}
            </a>
          ))}
          <div style={{ marginTop: 24, borderTop: '1px solid #eee', paddingTop: 20 }}>
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
              fontFamily: MONO, fontSize: 10, color: '#888',
              letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16,
            }}>
              ConstructAIQ
            </div>
            <h1 style={{
              fontFamily: SYS, fontSize: 36, fontWeight: 700,
              color: '#111', lineHeight: 1.2, marginBottom: 16,
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

          {/* ── DATA SOURCES ── */}
          <section id="data-sources" style={{ marginBottom: 64, scrollMarginTop: 32 }}>
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
                      <td style={{ ...tdStyle, fontWeight: 600, whiteSpace: 'nowrap', color: '#111' }}>
                        {row.source}
                      </td>
                      <td style={tdStyle}>{row.provides}</td>
                      <td style={{ ...tdStyle, ...noteStyle, whiteSpace: 'nowrap' }}>{row.cadence}</td>
                      <td style={{ ...tdStyle, ...noteStyle, color: '#666' }}>{row.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* ── FRESHNESS AND SOURCE HEALTH ── */}
          <section id="freshness" style={{ marginBottom: 64, scrollMarginTop: 32 }}>
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
              <strong>Aging</strong>, or <strong>Stale</strong> based on how recently
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
          <section id="forecast-methodology" style={{ marginBottom: 64, scrollMarginTop: 32 }}>
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
          <section id="prediction-validation" style={{ marginBottom: 64, scrollMarginTop: 32 }}>
            <h2 style={sectionH2}>Prediction Validation</h2>
            <p style={prose}>
              ConstructAIQ tracks forecast accuracy over time through a system called
              Prediction Accuracy Rate (PAR). PAR is not a marketing number — it is a
              live metric computed from realized outcomes.
            </p>

            <h3 style={h3Style}>How PAR works</h3>
            <p style={prose}>
              When a forecast is generated, the predicted value and confidence interval
              are logged alongside a maturity date (the month being forecast). When that
              month&apos;s actual Census Bureau data is published, the system compares the
              realized value to the predicted range.
            </p>
            <p style={prose}>
              PAR is defined as the fraction of matured predictions where the actual
              value fell within the stated confidence interval. A PAR of 80% on the 80%
              interval means the model is calibrated roughly as expected. A PAR
              consistently above or below that level indicates over- or under-confidence.
            </p>

            <h3 style={h3Style}>Where to find current PAR values</h3>
            <p style={prose}>
              Current PAR values are computed from live data and are not stated here to
              avoid this document going stale. See:
            </p>
            <ul style={{ ...prose, paddingLeft: 24 }}>
              <li style={{ marginBottom: 6 }}>
                <Link href="/methodology/track-record" style={linkStyle}>
                  /methodology/track-record
                </Link>{' '}
                — the full accuracy record with tables by horizon and forecast type
              </li>
              <li>
                <Link href="/api/par" style={linkStyle}>/api/par</Link>{' '}
                — the raw JSON endpoint, available to any caller
              </li>
            </ul>
          </section>

          {/* ── AI ANALYST GUARDRAILS ── */}
          <section id="ai-guardrails" style={{ marginBottom: 64, scrollMarginTop: 32 }}>
            <h2 style={sectionH2}>AI Analyst Guardrails</h2>
            <p style={prose}>
              The <Link href="/ask" style={linkStyle}>Ask the Market</Link> interface
              accepts plain-language questions about construction market conditions.
              Answers are generated by Claude (Anthropic API).
            </p>

            <h3 style={h3Style}>How answers are grounded</h3>
            <p style={prose}>
              Every NLQ response is generated at query time by fetching live data from
              ConstructAIQ&apos;s internal APIs — permits, forecasts, federal awards, signals,
              and opportunity scores — and passing that data to the model as context.
              The model is instructed to answer from the provided data only.
            </p>
            <p style={prose}>
              Responses cite the specific data sources that were queried. If a question
              requires data ConstructAIQ does not have, the system says so explicitly
              rather than guessing.
            </p>

            <h3 style={h3Style}>What the AI will not do</h3>
            <ul style={{ ...prose, paddingLeft: 24 }}>
              <li style={{ marginBottom: 8 }}>
                Fabricate statistics that are not in the data context
              </li>
              <li style={{ marginBottom: 8 }}>
                Supplement the provided data with knowledge from its training data
              </li>
              <li style={{ marginBottom: 8 }}>
                Express certainty about forecast outcomes (it will state the confidence
                interval instead)
              </li>
              <li>
                Answer questions it does not have data to answer (it returns an explicit
                &ldquo;insufficient data&rdquo; response)
              </li>
            </ul>

            <h3 style={h3Style}>Data lag applies to AI answers</h3>
            <p style={prose}>
              If Census Bureau construction spending data lags six weeks, the AI&apos;s answer
              about current spending is equally six weeks behind. The AI does not have access
              to information outside what ConstructAIQ has harvested.
            </p>
          </section>

          {/* ── LIMITATIONS ── */}
          <section id="limitations" style={{ marginBottom: 64, scrollMarginTop: 32 }}>
            <h2 style={sectionH2}>Limitations</h2>
            <p style={prose}>
              ConstructAIQ is a free platform built on public data. There are real
              constraints users should understand before making consequential decisions
              from this data.
            </p>

            <h3 style={h3Style}>Data lag</h3>
            <p style={prose}>
              Most government statistical releases lag real-world conditions by 30–60 days.
              Census construction spending data for March, for example, is typically
              published in late May. The dashboard reflects the most recently published
              data, not current conditions.
            </p>

            <h3 style={h3Style}>Data revision</h3>
            <p style={prose}>
              Census Bureau and BLS data are subject to retroactive revision. Preliminary
              estimates are routinely revised at annual benchmarks; large revisions are
              possible. Forecasts trained on preliminary data may need to be re-evaluated
              once revised data is published.
            </p>

            <h3 style={h3Style}>Satellite data gaps</h3>
            <p style={prose}>
              The Sentinel-2 Bare Soil Index is computed from satellite imagery. Cloud
              cover, seasonal vegetation, and satellite pass timing all affect data
              availability. Gaps occur and are not interpolated — if a period has no
              valid satellite observation, that period shows no data.
            </p>

            <h3 style={h3Style}>Geographic coverage</h3>
            <p style={prose}>
              City permit data covers the Census Bureau survey universe (59 cities).
              Markets outside the survey are not represented. Satellite BSI covers 20
              US metropolitan areas. Federal award data is national but filtered to
              construction NAICS codes, which may not capture all relevant awards.
            </p>

            <h3 style={h3Style}>Federal obligations vs. disbursements</h3>
            <p style={prose}>
              USASpending.gov data reflects contract obligations — the amount of money
              a federal agency has committed to pay. It does not reflect how much has
              actually been spent or whether work has begun. Obligation-to-disbursement
              timelines vary significantly by program and agency.
            </p>

            <h3 style={h3Style}>Forecast uncertainty</h3>
            <p style={prose}>
              Confidence intervals are estimated from historical model residuals. They
              assume the future will behave similarly to the past. Structural breaks —
              recessions, policy changes, natural disasters — are outside the model&apos;s
              scope and will cause realized values to fall outside the stated intervals.
            </p>

            <h3 style={h3Style}>Platform availability</h3>
            <p style={prose}>
              ConstructAIQ uses free-tier APIs from federal agencies. If an upstream
              source goes offline or changes its API, data for that source may gap until
              the harvest pipeline is updated. Source health is visible at{' '}
              <Link href="/status" style={linkStyle}>/status</Link>.
            </p>

            <div style={{ ...calloutStyle, borderLeft: '3px solid #f5a623', marginTop: 28, marginBottom: 0 }}>
              Signals, verdicts, and forecasts on this platform are statistical outputs.
              They are designed to inform decisions, not replace domain expertise.
              Consult qualified professionals before making consequential financial,
              operational, or lending decisions.
            </div>
          </section>

          {/* Footer nav */}
          <div style={{
            borderTop: '1px solid #eee', paddingTop: 32,
            display: 'flex', gap: 24, flexWrap: 'wrap',
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
