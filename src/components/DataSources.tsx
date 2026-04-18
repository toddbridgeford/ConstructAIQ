const CATEGORIES = [
  {
    label: 'Federal Agencies',
    count: 47,
    color: '#C8A96E',
    sources: [
      'U.S. Census Bureau',
      'Bureau of Labor Statistics',
      'Dept. of Transportation',
      'HUD / FHA',
      'Dept. of Energy',
      'Army Corps of Engineers',
      'GSA Public Buildings',
      'EPA Facility Registry',
      'USDA Rural Development',
      'SBA Loan Guarantees',
    ],
  },
  {
    label: 'State Agencies',
    count: 152,
    color: '#7A9E7E',
    sources: [
      '50 State DOTs',
      'State Labor Departments',
      'State Housing Finance Agencies',
      'State Environmental Agencies',
      'State Procurement Offices',
      'Regional Planning Commissions',
      'State Economic Dev. Orgs',
      'Public Utility Commissions',
    ],
  },
  {
    label: 'Local & Municipal',
    count: 87,
    color: '#6A8CAF',
    sources: [
      'Building Permit Databases',
      'Zoning & Land Use Records',
      'Assessor Parcel Data',
      'Local Bid Boards',
      'Metro Planning Orgs',
      'Water / Sewer Authority Data',
      'Municipal Bond Filings',
    ],
  },
  {
    label: 'Economic & Market',
    count: 26,
    color: '#9B7FA6',
    sources: [
      'Federal Reserve (FRED)',
      'Bureau of Economic Analysis',
      'Congressional Budget Office',
      'Producer Price Index (PPI)',
      'NAHB Housing Indices',
      'Dodge Construction Network',
      'RSMeans Cost Data',
    ],
  },
];

const BAR_TOTAL = CATEGORIES.reduce((sum, c) => sum + c.count, 0);

export default function DataSources() {
  return (
    <section
      id="data-sources"
      style={{
        background: 'var(--surface)',
        borderTop: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)',
        padding: '96px 24px',
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '64px',
            alignItems: 'start',
            marginBottom: '64px',
          }}
          className="ds-header-grid"
        >
          <div>
            <div
              style={{
                fontSize: '10px',
                letterSpacing: '0.24em',
                textTransform: 'uppercase',
                color: 'var(--gold)',
                marginBottom: '16px',
              }}
            >
              Data Infrastructure
            </div>
            <h2
              style={{
                fontSize: 'clamp(28px, 4vw, 44px)',
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '-0.01em',
                lineHeight: 1.1,
                marginBottom: '16px',
              }}
            >
              312 Sources.
              <br />
              <span style={{ color: 'var(--gold)' }}>One Platform.</span>
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-2)', lineHeight: 1.75 }}>
              We ingest, normalize, and cross-reference hundreds of public and proprietary
              datasets — updated daily — so your forecasts are built on the most complete
              picture of U.S. construction activity available anywhere.
            </p>
          </div>

          {/* Stacked bar chart */}
          <div>
            <div
              style={{
                fontSize: '10px',
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: 'var(--text-3)',
                marginBottom: '12px',
              }}
            >
              Source composition — 312 total
            </div>

            {/* Bar */}
            <div
              style={{
                height: '12px',
                display: 'flex',
                borderRadius: '2px',
                overflow: 'hidden',
                marginBottom: '24px',
                gap: '2px',
              }}
            >
              {CATEGORIES.map((c) => (
                <div
                  key={c.label}
                  style={{
                    height: '100%',
                    width: `${(c.count / BAR_TOTAL) * 100}%`,
                    background: c.color,
                    transition: 'opacity 0.2s',
                  }}
                  title={`${c.label}: ${c.count}`}
                />
              ))}
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {CATEGORIES.map((c) => (
                <div
                  key={c.label}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
                >
                  <span
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '2px',
                      background: c.color,
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{ fontSize: '12px', color: 'var(--text-2)', flex: 1 }}
                  >
                    {c.label}
                  </span>
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      color: 'var(--text)',
                      minWidth: '32px',
                      textAlign: 'right',
                    }}
                  >
                    {c.count}
                  </span>
                  <span
                    style={{ fontSize: '11px', color: 'var(--text-3)', minWidth: '36px' }}
                  >
                    {Math.round((c.count / BAR_TOTAL) * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Category Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '1px',
            background: 'var(--border)',
            border: '1px solid var(--border)',
          }}
          className="ds-grid"
        >
          {CATEGORIES.map((cat) => (
            <div
              key={cat.label}
              style={{
                background: 'var(--bg)',
                padding: '28px 24px',
              }}
            >
              {/* Category header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '20px',
                  paddingBottom: '16px',
                  borderBottom: `2px solid ${cat.color}`,
                }}
              >
                <span
                  style={{
                    fontSize: '10px',
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    fontWeight: 700,
                    color: 'var(--text)',
                  }}
                >
                  {cat.label}
                </span>
                <span
                  style={{
                    fontSize: '20px',
                    fontWeight: 900,
                    color: cat.color,
                  }}
                >
                  {cat.count}
                </span>
              </div>

              {/* Source list */}
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {cat.sources.map((src) => (
                  <li
                    key={src}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '12px',
                      color: 'var(--text-2)',
                    }}
                  >
                    <span
                      style={{
                        width: '4px',
                        height: '4px',
                        borderRadius: '50%',
                        background: cat.color,
                        flexShrink: 0,
                        opacity: 0.7,
                      }}
                    />
                    {src}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Footer note */}
        <div
          style={{
            marginTop: '24px',
            textAlign: 'center',
            fontSize: '11px',
            color: 'var(--text-3)',
            letterSpacing: '0.06em',
          }}
        >
          All sources updated daily. 312 sources across 4 categories.
          Historical depth varies by source — minimum 5 years of data.
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .ds-header-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
          .ds-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 560px) {
          .ds-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}
