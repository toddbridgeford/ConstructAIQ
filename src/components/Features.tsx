'use client';

const FEATURES = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
    title: 'Permit Intelligence',
    description:
      'Monitor residential, commercial, and infrastructure permit activity across every U.S. jurisdiction. Identify pipeline surges before they move markets.',
    tags: ['Census Bureau', 'Local Agencies', '3,200+ Counties'],
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
    title: 'Labor Market Forecasting',
    description:
      'Predict workforce availability, wage pressures, and skilled trade shortages by region and specialty. Backed by BLS and state labor department feeds.',
    tags: ['BLS', 'State Labor Depts', 'Wage Trends'],
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
    title: 'Material Cost Tracking',
    description:
      'Real-time commodity and material price intelligence — lumber, steel, concrete, copper, and 40+ inputs — correlated to project-level cost forecasts.',
    tags: ['PPI Data', 'Commodity Feeds', '40+ Materials'],
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
    title: 'Federal Contract Pipeline',
    description:
      'Track announced, awarded, and active federal construction contracts from DOT, Army Corps, HUD, DOE, and GSA. Know where government spend is flowing.',
    tags: ['SAM.gov', 'USASpending', 'DOT / HUD / DOE'],
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="10" />
        <path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" />
      </svg>
    ),
    title: 'Regional Market Signals',
    description:
      'Composite leading indicators by MSA and state — integrating permit velocity, migration patterns, zoning changes, and economic activity into one score.',
    tags: ['MSA-Level', 'Migration Data', 'Zoning Activity'],
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
    title: 'Economic Indicator Integration',
    description:
      'Fed rate decisions, GDP revisions, inflation metrics, and Treasury yield curves — automatically mapped to their downstream impact on construction demand.',
    tags: ['Federal Reserve', 'BEA', 'Treasury'],
  },
];

export default function Features() {
  return (
    <section
      id="features"
      style={{
        padding: '96px 24px',
        maxWidth: '1200px',
        margin: '0 auto',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: '64px', maxWidth: '560px' }}>
        <div
          style={{
            fontSize: '10px',
            letterSpacing: '0.24em',
            textTransform: 'uppercase',
            color: 'var(--gold)',
            marginBottom: '16px',
          }}
        >
          Platform Features
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
          Every Signal That Moves
          <br />
          <span style={{ color: 'var(--gold)' }}>Construction Markets</span>
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--text-2)', lineHeight: 1.75 }}>
          We normalize, merge, and model data from 312 sources so you can focus on
          decisions — not data wrangling.
        </p>
      </div>

      {/* Feature Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '1px',
          background: 'var(--border)',
          border: '1px solid var(--border)',
        }}
        className="features-grid"
      >
        {FEATURES.map((f, i) => (
          <div
            key={i}
            style={{
              background: 'var(--bg)',
              padding: '36px 32px',
              transition: 'background 0.2s',
              cursor: 'default',
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLElement).style.background = 'var(--surface)')
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLElement).style.background = 'var(--bg)')
            }
          >
            {/* Icon */}
            <div
              style={{
                width: '44px',
                height: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--gold-dim)',
                border: '1px solid var(--border-2)',
                borderRadius: '2px',
                color: 'var(--gold)',
                marginBottom: '20px',
              }}
            >
              {f.icon}
            </div>

            <h3
              style={{
                fontSize: '13px',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                marginBottom: '10px',
                color: 'var(--text)',
              }}
            >
              {f.title}
            </h3>

            <p
              style={{
                fontSize: '13px',
                color: 'var(--text-2)',
                lineHeight: 1.7,
                marginBottom: '20px',
              }}
            >
              {f.description}
            </p>

            {/* Tags */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {f.tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    fontSize: '10px',
                    letterSpacing: '0.1em',
                    padding: '3px 8px',
                    border: '1px solid var(--border-2)',
                    color: 'var(--text-3)',
                    borderRadius: '2px',
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @media (max-width: 900px) {
          .features-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 560px) {
          .features-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}
