'use client';

import { useState } from 'react';

const TERMINAL_LINES = [
  { label: 'LOADING', value: 'census.gov → building_permits_2024.csv', color: 'var(--text-3)' },
  { label: 'PARSING', value: '3,218 county-level records', color: 'var(--text-2)' },
  { label: 'MERGE', value: 'BLS labor_stats + DOT highway_spend', color: 'var(--text-2)' },
  { label: 'MODEL', value: 'forecasting Q3 residential starts ↑ 12.4%', color: 'var(--gold)' },
  { label: 'SIGNAL', value: 'HIGH confidence — Southeast corridor', color: 'var(--gold)' },
  { label: 'OUTPUT', value: 'report ready → dashboard', color: 'var(--text)' },
];

export default function Hero() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) setSubmitted(true);
  };

  return (
    <section
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '120px 24px 80px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background grid */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(var(--border) 1px, transparent 1px),
            linear-gradient(90deg, var(--border) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
          opacity: 0.35,
          pointerEvents: 'none',
        }}
      />

      {/* Radial fade overlay */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse 70% 60% at 50% 50%, transparent 20%, var(--bg) 80%)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          width: '100%',
          position: 'relative',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '64px',
          alignItems: 'center',
        }}
        className="hero-grid"
      >
        {/* Left: Copy */}
        <div style={{ animation: 'fadeUp 0.7s ease both' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '5px 12px',
              border: '1px solid var(--border-2)',
              borderRadius: '2px',
              marginBottom: '28px',
              background: 'var(--surface)',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: 'var(--gold)',
                display: 'inline-block',
                animation: 'pulse-dot 2s ease-in-out infinite',
              }}
            />
            <span
              style={{
                fontSize: '10px',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: 'var(--gold)',
              }}
            >
              AI-Powered Market Intelligence
            </span>
          </div>

          <h1
            style={{
              fontSize: 'clamp(36px, 5vw, 64px)',
              fontWeight: 900,
              lineHeight: 1.05,
              letterSpacing: '-0.01em',
              marginBottom: '20px',
              textTransform: 'uppercase',
            }}
          >
            Construction
            <br />
            <span style={{ color: 'var(--gold)' }}>Intelligence.</span>
            <br />
            Built for Those
            <br />
            Who Build.
          </h1>

          <p
            style={{
              fontSize: '15px',
              lineHeight: 1.75,
              color: 'var(--text-2)',
              maxWidth: '440px',
              marginBottom: '36px',
            }}
          >
            312 federal and state data sources — unified, processed, and distilled into
            market forecasts that economists and industry leaders can act on. From permit
            trends to labor signals, in one platform.
          </p>

          {submitted ? (
            <div
              style={{
                padding: '16px 24px',
                border: '1px solid var(--border-2)',
                borderLeft: '3px solid var(--gold)',
                background: 'var(--surface)',
                fontSize: '13px',
                color: 'var(--text-2)',
                maxWidth: '420px',
              }}
            >
              <span style={{ color: 'var(--gold)', fontWeight: 700 }}>
                You&apos;re on the list.
              </span>{' '}
              We&apos;ll reach out when early access opens.
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              style={{
                display: 'flex',
                gap: '8px',
                flexWrap: 'wrap',
                maxWidth: '460px',
              }}
            >
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                style={{
                  flex: 1,
                  minWidth: '220px',
                  padding: '13px 18px',
                  background: 'var(--surface)',
                  border: '1px solid var(--border-2)',
                  color: 'var(--text)',
                  fontSize: '13px',
                  borderRadius: '2px',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--gold)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--border-2)')}
              />
              <button
                type="submit"
                style={{
                  padding: '13px 28px',
                  background: 'var(--gold)',
                  color: 'var(--bg)',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '11px',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  borderRadius: '2px',
                  transition: 'background 0.2s',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) =>
                  ((e.target as HTMLElement).style.background = 'var(--gold-hover)')
                }
                onMouseLeave={(e) =>
                  ((e.target as HTMLElement).style.background = 'var(--gold)')
                }
              >
                Get Early Access
              </button>
            </form>
          )}

          <p
            style={{
              marginTop: '14px',
              fontSize: '11px',
              color: 'var(--text-3)',
              letterSpacing: '0.08em',
            }}
          >
            No spam. Launch updates only.
          </p>
        </div>

        {/* Right: Terminal */}
        <div
          style={{ animation: 'fadeUp 0.7s 0.15s ease both', opacity: 0 }}
          className="hero-terminal"
        >
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border-2)',
              borderRadius: '4px',
              overflow: 'hidden',
              fontFamily: 'monospace',
              fontSize: '12px',
            }}
          >
            {/* Terminal header */}
            <div
              style={{
                padding: '10px 16px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'var(--surface-2)',
              }}
            >
              {['#C94F47', '#E0A93C', '#4DAE54'].map((c) => (
                <span
                  key={c}
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: c,
                    opacity: 0.8,
                  }}
                />
              ))}
              <span
                style={{
                  marginLeft: '8px',
                  fontSize: '10px',
                  color: 'var(--text-3)',
                  letterSpacing: '0.1em',
                }}
              >
                constructaiq — data pipeline
              </span>
            </div>

            {/* Terminal body */}
            <div style={{ padding: '20px', lineHeight: 2 }}>
              <div style={{ color: 'var(--text-3)', marginBottom: '12px' }}>
                $ aiq run --sources=312 --forecast=Q3-2025
              </div>
              {TERMINAL_LINES.map((line, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    gap: '12px',
                    animation: `fadeUp 0.4s ${0.2 + i * 0.15}s ease both`,
                    opacity: 0,
                  }}
                >
                  <span
                    style={{
                      color: 'var(--text-3)',
                      minWidth: '64px',
                      fontSize: '10px',
                      letterSpacing: '0.12em',
                      paddingTop: '2px',
                    }}
                  >
                    [{line.label}]
                  </span>
                  <span style={{ color: line.color }}>{line.value}</span>
                </div>
              ))}
              <div
                style={{
                  marginTop: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: 'var(--text-3)',
                }}
              >
                <span>$</span>
                <span
                  style={{
                    display: 'inline-block',
                    width: '8px',
                    height: '14px',
                    background: 'var(--gold)',
                    animation: 'pulse-dot 1s ease-in-out infinite',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 880px) {
          .hero-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
          .hero-terminal { display: none !important; }
        }
      `}</style>
    </section>
  );
}
