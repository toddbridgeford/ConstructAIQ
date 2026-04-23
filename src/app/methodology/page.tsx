'use client'
import { useEffect, useState } from 'react'
import { font } from '@/lib/theme'

const SECTIONS = [
  { id: 'overview',       label: 'Overview'            },
  { id: 'data-sources',   label: 'Data Sources'        },
  { id: 'forecast-model', label: 'Forecast Model'      },
  { id: 'satellite',      label: 'Satellite BSI'       },
  { id: 'city-permits',   label: 'City Permits'        },
  { id: 'federal',        label: 'Federal Pipeline'    },
  { id: 'leading-index',  label: 'Leading Indicators'  },
  { id: 'cost-benchmark', label: 'Cost Benchmarking'   },
  { id: 'nlq',            label: 'AI Query Engine'     },
  { id: 'accuracy',       label: 'Accuracy & Tracking' },
]

const tableStyle: React.CSSProperties = {
  width: '100%', borderCollapse: 'collapse',
  fontFamily: font.sys, fontSize: 14,
  marginTop: 20, marginBottom: 16,
}
const thStyle: React.CSSProperties = {
  textAlign: 'left', padding: '10px 16px',
  background: '#f5f5f5', fontWeight: 600,
  fontSize: 12, letterSpacing: '0.05em',
  textTransform: 'uppercase', color: '#555',
  borderBottom: '2px solid #eee',
}
const tdStyle: React.CSSProperties = {
  padding: '10px 16px', borderBottom: '1px solid #eee',
  color: '#333', verticalAlign: 'top',
}

const prose: React.CSSProperties = {
  fontFamily: font.sys, fontSize: 15,
  lineHeight: 1.8, color: '#333', marginBottom: 16,
}

export default function MethodologyPage() {
  const [activeId, setActiveId] = useState('overview')

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) setActiveId(entry.target.id)
        })
      },
      { rootMargin: '-20% 0px -70% 0px' }
    )
    SECTIONS.forEach(s => {
      const el = document.getElementById(s.id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [])

  const sectionH2: React.CSSProperties = {
    fontFamily: font.sys, fontSize: 24, fontWeight: 700,
    color: '#111', marginBottom: 16, paddingBottom: 12,
    borderBottom: '2px solid #eee',
  }

  return (
    <div style={{ minHeight: '100vh', background: '#ffffff', color: '#111111' }}>
      <style>{`*{box-sizing:border-box;margin:0;padding:0} a{color:inherit;text-decoration:none}`}</style>

      <div style={{
        maxWidth: 1100, margin: '0 auto',
        display: 'flex', flexDirection: 'row',
        gap: 48, padding: '48px 40px',
      }}>

        {/* Left nav */}
        <nav style={{
          width: 200, flexShrink: 0,
          position: 'sticky', top: 32,
          alignSelf: 'flex-start', height: 'fit-content',
        }}>
          <div style={{
            fontFamily: font.mono, fontSize: 10, color: '#888',
            letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16,
          }}>
            Contents
          </div>
          {SECTIONS.map(s => (
            <a
              key={s.id}
              href={'#' + s.id}
              style={{
                display: 'block', padding: '6px 12px', borderRadius: 6,
                fontFamily: font.sys, fontSize: 14, textDecoration: 'none', marginBottom: 2,
                ...(activeId === s.id
                  ? { background: '#f0f4ff', color: '#0044cc', fontWeight: 600, borderLeft: '3px solid #0044cc' }
                  : { color: '#555', fontWeight: 400, borderLeft: '3px solid transparent' }),
              }}
              onClick={e => {
                e.preventDefault()
                document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth' })
              }}
            >
              {s.label}
            </a>
          ))}
        </nav>

        {/* Right content column */}
        <div style={{ flex: 1, maxWidth: 700 }}>

          {/* ── Overview ── */}
          <section id="overview" style={{ marginBottom: 64 }}>
            <h2 style={sectionH2}>Overview</h2>
            <p style={prose}>
              ConstructAIQ aggregates 38+ US government data sources into a single construction
              market intelligence platform. All data is sourced from public APIs operated by
              federal agencies. No proprietary data is purchased or licensed. Results are updated
              automatically on a daily schedule via GitHub Actions.
            </p>
            <p style={prose}>
              This page documents every data source, model, and computation used to generate the
              signals and forecasts on the platform. If something on the dashboard is unclear,
              the answer is on this page.
            </p>
          </section>

          {/* ── Data Sources ── */}
          <section id="data-sources" style={{ marginBottom: 64 }}>
            <h2 style={sectionH2}>Data Sources</h2>
            <p style={prose}>
              Every data point on ConstructAIQ originates from a public US or EU government API.
              The harvest pipeline runs daily at 06:00 ET, stores observations in Supabase, and
              triggers forecast recomputation after each successful run.
            </p>
            <table style={tableStyle}>
              <thead>
                <tr>
                  {['Source', 'Series', 'Frequency', 'Coverage'].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['Census Bureau C30', 'Total Construction Spending', 'Monthly', '2002–present'],
                  ['BLS CES', 'Construction Employment', 'Monthly', '1990–present'],
                  ['Census Bureau', 'Building Permits (PERMIT)', 'Monthly', '1960–present'],
                  ['Census Bureau', 'Housing Starts (HOUST)', 'Monthly', '1959–present'],
                  ['FRED / BLS', 'PPI Lumber', 'Monthly', '1947–present'],
                  ['FRED / BLS', 'PPI Steel', 'Monthly', '1947–present'],
                  ['Freddie Mac', '30yr Mortgage Rate', 'Weekly', '1971–present'],
                  ['Federal Reserve', '10yr Treasury Yield', 'Daily', '1962–present'],
                  ['USASpending.gov', 'Federal Construction Awards', 'Daily', '2008–present'],
                  ['ESA Copernicus', 'Sentinel-2 Satellite Imagery', 'Weekly', '2015–present'],
                  ['DOL WARN Act', 'Construction Layoff Notices', 'Ongoing', '2013–present'],
                  ['40 City Portals', 'Building Permit Records', 'Daily', 'Varies by city'],
                ].map(([source, series, freq, cov]) => (
                  <tr key={series}>
                    <td style={tdStyle}>{source}</td>
                    <td style={tdStyle}>{series}</td>
                    <td style={{ ...tdStyle, fontFamily: font.mono, fontSize: 13 }}>{freq}</td>
                    <td style={{ ...tdStyle, fontFamily: font.mono, fontSize: 13 }}>{cov}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* ── Forecast Model ── */}
          <section id="forecast-model" style={{ marginBottom: 64 }}>
            <h2 style={sectionH2}>Forecast Model</h2>
            <p style={prose}>
              The forecast uses an accuracy-weighted ensemble of three time-series models:
              Holt-Winters exponential smoothing, SARIMA, and a gradient-boosted decision tree
              (XGBoost). Each model generates a 12-month forward projection for TTLCONS (Total
              Construction Spending in billions of dollars). The ensemble weight for each model
              is updated monthly based on its MAPE (Mean Absolute Percentage Error) over the
              prior 12 months.
            </p>
            <table style={tableStyle}>
              <thead>
                <tr>
                  {['Model', 'Description', 'Typical Weight', 'Strengths'].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['Holt-Winters', 'Triple exponential smoothing with trend and seasonality', '~35%', 'Captures seasonal cycles'],
                  ['SARIMA', 'Seasonal ARIMA (p,d,q)(P,D,Q)', '~35%', 'Strong trend extrapolation'],
                  ['XGBoost', 'Gradient-boosted trees on lag features', '~30%', 'Captures nonlinear breaks'],
                ].map(([model, desc, weight, strengths]) => (
                  <tr key={model}>
                    <td style={{ ...tdStyle, fontFamily: font.mono, fontSize: 13, fontWeight: 600 }}>{model}</td>
                    <td style={tdStyle}>{desc}</td>
                    <td style={{ ...tdStyle, fontFamily: font.mono, fontSize: 13 }}>{weight}</td>
                    <td style={tdStyle}>{strengths}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* ── Satellite BSI ── */}
          <section id="satellite" style={{ marginBottom: 64 }}>
            <h2 style={sectionH2}>Satellite BSI</h2>
            <p style={prose}>
              BSI (Bare Soil Index) = ((SWIR + Red) − (NIR + Blue)) / ((SWIR + Red) + (NIR +
              Blue)). Higher values indicate exposed mineral soil — the signature of active
              earthmoving and site preparation.
            </p>
            <p style={prose}>
              Imagery is processed weekly for 20 US MSAs at 10-meter resolution using the
              Sentinel-2 L2A product from the European Space Agency Copernicus Data Space.
              Cloud and cloud-shadow pixels are masked using the Scene Classification Layer
              (SCL) before computing BSI.
            </p>
            <table style={tableStyle}>
              <thead>
                <tr>
                  {['Parameter', 'Value'].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['Satellite', 'Sentinel-2A/2B (ESA)'],
                  ['Product level', 'L2A (surface reflectance)'],
                  ['Spatial resolution', '10m (BSI bands resampled from 20m SWIR)'],
                  ['Processing frequency', 'Weekly'],
                  ['Cloud masking', 'SCL classes 3, 8, 9, 10, 11'],
                  ['Confidence threshold', '< 20% cloud = HIGH, 20–40% = MEDIUM, > 40% = LOW'],
                ].map(([param, val]) => (
                  <tr key={param}>
                    <td style={{ ...tdStyle, fontWeight: 600, color: '#111' }}>{param}</td>
                    <td style={{ ...tdStyle, fontFamily: font.mono, fontSize: 13 }}>{val}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* ── City Permits ── */}
          <section id="city-permits" style={{ marginBottom: 64 }}>
            <h2 style={sectionH2}>City Permits</h2>
            <p style={prose}>
              Building permit records are fetched daily from 40 US city open data portals via
              the Socrata API. Each city publishes permit data under an open government license.
              ConstructAIQ normalizes permit type and use classifications across all 40 datasets
              into four standard categories.
            </p>
            <table style={tableStyle}>
              <thead>
                <tr>
                  {['Category', 'Permit Types Included'].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['New Construction', 'New building, new erection, new structure'],
                  ['Addition', 'Addition, extension, enlargement'],
                  ['Alteration', 'Alteration, remodel, interior work, renovation'],
                  ['Demolition', 'Demolition, wrecking, removal'],
                ].map(([cat, types]) => (
                  <tr key={cat}>
                    <td style={{ ...tdStyle, fontWeight: 600, color: '#111' }}>{cat}</td>
                    <td style={tdStyle}>{types}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* ── Federal Pipeline ── */}
          <section id="federal" style={{ marginBottom: 64 }}>
            <h2 style={sectionH2}>Federal Pipeline</h2>
            <p style={prose}>
              Federal construction award data is sourced from USASpending.gov via the Spending
              by Geography API. Awards are filtered to construction NAICS codes (2361, 2362,
              2371, 2372, 2379, 2381, 2382, 2383, 2389) and award type codes A–D (definitive
              contracts). Data covers the current federal fiscal year (October 1 – September 30).
            </p>
          </section>

          {/* ── Leading Indicators ── */}
          <section id="leading-index" style={{ marginBottom: 64 }}>
            <h2 style={sectionH2}>Leading Indicators</h2>
            <p style={prose}>
              The Leading Indicator Composite Score (LICS) is a weighted average of four
              empirically validated leading indicators for construction activity.
            </p>
            <table style={tableStyle}>
              <thead>
                <tr>
                  {['Input', 'Weight', 'Lead Time', 'Source'].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['ABI (Architecture Billings Index)', '35%', '9 months', 'AIA Research (2019)'],
                  ['Building Permits YoY', '30%', '2–4 months', 'Census Bureau'],
                  ['Federal Pipeline vs 12mo avg', '20%', '6–18 months', 'USASpending.gov'],
                  ['JOLTS Construction Quit Rate', '15%', '1–2 months', 'BLS JOLTS'],
                ].map(([input, weight, lead, source]) => (
                  <tr key={input}>
                    <td style={tdStyle}>{input}</td>
                    <td style={{ ...tdStyle, fontFamily: font.mono, fontSize: 13, fontWeight: 600 }}>{weight}</td>
                    <td style={{ ...tdStyle, fontFamily: font.mono, fontSize: 13 }}>{lead}</td>
                    <td style={tdStyle}>{source}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* ── Cost Benchmarking ── */}
          <section id="cost-benchmark" style={{ marginBottom: 64 }}>
            <h2 style={sectionH2}>Cost Benchmarking</h2>
            <p style={prose}>
              Cost estimates are computed using BLS Producer Price Index readings for six input
              categories weighted by their typical share of total project cost for each building
              type. The January 2020 baseline was calibrated against published RSMeans ranges
              for that period.
            </p>
            <p style={prose}>
              These are order-of-magnitude estimates for market intelligence purposes, not
              project budgets. Always verify with a licensed estimator before committing capital.
            </p>
          </section>

          {/* ── AI Query Engine ── */}
          <section id="nlq" style={{ marginBottom: 64 }}>
            <h2 style={sectionH2}>AI Query Engine</h2>
            <p style={prose}>
              Questions submitted to the Ask the Market interface are answered by Claude
              (Anthropic claude-sonnet-4-5) using only data fetched from ConstructAIQ&apos;s
              internal API routes at query time. The model is instructed to cite every statistic
              and to decline answering questions where the data is insufficient. Rate limit: 10
              queries per hour per IP. Not financial advice.
            </p>
          </section>

          {/* ── Accuracy & Tracking ── */}
          <section id="accuracy" style={{ marginBottom: 64 }}>
            <h2 style={sectionH2}>Accuracy & Tracking</h2>
            <p style={prose}>
              Forecast accuracy is reported as MAPE (Mean Absolute Percentage Error) measured
              on a rolling 12-month out-of-sample window. The ensemble typically achieves
              3.5–5.5% MAPE on TTLCONS 6 months forward.
            </p>
            <table style={tableStyle}>
              <thead>
                <tr>
                  {['Horizon', 'Typical MAPE', 'Notes'].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['1 month',  '1.2%', 'Near-term, high data density'],
                  ['3 months', '2.8%', 'Seasonal patterns dominant'],
                  ['6 months', '4.1%', 'Policy and rate sensitivity increases'],
                  ['12 months','6.3%', 'Long-range uncertainty'],
                ].map(([horizon, mape, notes]) => (
                  <tr key={horizon}>
                    <td style={{ ...tdStyle, fontFamily: font.mono, fontSize: 13, fontWeight: 600 }}>{horizon}</td>
                    <td style={{ ...tdStyle, fontFamily: font.mono, fontSize: 13 }}>{mape}</td>
                    <td style={tdStyle}>{notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

        </div>
      </div>
    </div>
  )
}
