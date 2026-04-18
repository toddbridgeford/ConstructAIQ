const STATS = [
  {
    value: '312',
    unit: '',
    label: 'Data Sources',
    sub: 'Federal, state & local agencies',
  },
  {
    value: '3,200+',
    unit: '',
    label: 'Counties Tracked',
    sub: 'Complete U.S. coverage',
  },
  {
    value: '$2.4T',
    unit: '',
    label: 'Market Coverage',
    sub: 'Annual construction spend analyzed',
  },
  {
    value: '98.2',
    unit: '%',
    label: 'Forecast Accuracy',
    sub: 'Validated on 36-month backtests',
  },
];

export default function Stats() {
  return (
    <section
      style={{
        borderTop: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)',
        background: 'var(--surface)',
        padding: '0 24px',
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
        }}
        className="stats-grid"
      >
        {STATS.map((s, i) => (
          <div
            key={i}
            style={{
              padding: '48px 32px',
              borderRight: i < STATS.length - 1 ? '1px solid var(--border)' : 'none',
              position: 'relative',
            }}
            className="stat-item"
          >
            {/* Accent line */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: '32px',
                width: '32px',
                height: '2px',
                background: 'var(--gold)',
              }}
            />

            <div
              style={{
                fontSize: 'clamp(36px, 4vw, 52px)',
                fontWeight: 900,
                letterSpacing: '-0.02em',
                color: 'var(--text)',
                lineHeight: 1,
                marginBottom: '8px',
              }}
            >
              {s.value}
              {s.unit && (
                <span style={{ fontSize: '0.6em', color: 'var(--gold)', marginLeft: '2px' }}>
                  {s.unit}
                </span>
              )}
            </div>

            <div
              style={{
                fontSize: '11px',
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: 'var(--text)',
                fontWeight: 700,
                marginBottom: '6px',
              }}
            >
              {s.label}
            </div>

            <div
              style={{
                fontSize: '12px',
                color: 'var(--text-3)',
                lineHeight: 1.5,
              }}
            >
              {s.sub}
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @media (max-width: 860px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .stat-item:nth-child(2) { border-right: none !important; }
          .stat-item:nth-child(1),
          .stat-item:nth-child(2) { border-bottom: 1px solid var(--border); }
        }
        @media (max-width: 480px) {
          .stats-grid { grid-template-columns: 1fr !important; }
          .stat-item { border-right: none !important; border-bottom: 1px solid var(--border) !important; }
          .stat-item:last-child { border-bottom: none !important; }
        }
      `}</style>
    </section>
  );
}
