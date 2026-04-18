'use client';

const NAV_COLS = [
  {
    heading: 'Product',
    links: [
      { label: 'Features', href: '#features' },
      { label: 'Data Sources', href: '#data-sources' },
      { label: 'Pricing', href: '#pricing' },
      { label: 'API Docs', href: '#' },
      { label: 'Changelog', href: '#' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About', href: '#' },
      { label: 'Blog', href: '#' },
      { label: 'Careers', href: '#' },
      { label: 'Press', href: '#' },
      { label: 'Contact', href: 'mailto:hello@constructaiq.trade' },
    ],
  },
  {
    heading: 'Resources',
    links: [
      { label: 'Documentation', href: '#' },
      { label: 'Methodology', href: '#' },
      { label: 'Data Dictionary', href: '#' },
      { label: 'Case Studies', href: '#' },
      { label: 'Status', href: '#' },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '#' },
      { label: 'Terms of Service', href: '#' },
      { label: 'Data License', href: '#' },
      { label: 'Cookie Policy', href: '#' },
    ],
  },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer
      style={{
        borderTop: '1px solid var(--border)',
        background: 'var(--surface)',
        padding: '64px 24px 32px',
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
            gap: '48px',
            paddingBottom: '48px',
            borderBottom: '1px solid var(--border)',
            marginBottom: '32px',
          }}
          className="footer-grid"
        >
          {/* Brand Column */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '16px',
              }}
            >
              <img
                src="/ConstructAIQWhiteLogo.svg"
                alt="ConstructAIQ"
                style={{ height: '24px', width: 'auto' }}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                }}
              >
                ConstructAIQ
              </span>
            </div>

            <p
              style={{
                fontSize: '13px',
                color: 'var(--text-2)',
                lineHeight: 1.7,
                maxWidth: '280px',
                marginBottom: '24px',
              }}
            >
              AI-powered construction market intelligence. 312 data sources unified into
              forecasts economists and industry leaders can act on.
            </p>

            {/* Status indicator */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                padding: '6px 12px',
                border: '1px solid var(--border-2)',
                borderRadius: '2px',
                fontSize: '11px',
                color: 'var(--text-3)',
                letterSpacing: '0.08em',
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#4DAE54',
                  display: 'inline-block',
                }}
              />
              All systems operational
            </div>
          </div>

          {/* Nav columns */}
          {NAV_COLS.map((col) => (
            <div key={col.heading}>
              <div
                style={{
                  fontSize: '10px',
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: 'var(--text)',
                  fontWeight: 700,
                  marginBottom: '16px',
                }}
              >
                {col.heading}
              </div>
              <ul
                style={{
                  listStyle: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      style={{
                        fontSize: '13px',
                        color: 'var(--text-3)',
                        transition: 'color 0.2s',
                      }}
                      onMouseEnter={(e) =>
                        ((e.target as HTMLElement).style.color = 'var(--text)')
                      }
                      onMouseLeave={(e) =>
                        ((e.target as HTMLElement).style.color = 'var(--text-3)')
                      }
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <p
            style={{
              fontSize: '11px',
              color: 'var(--text-3)',
              letterSpacing: '0.06em',
            }}
          >
            &copy; {year} ConstructAIQ. All rights reserved.
          </p>

          <p
            style={{
              fontSize: '11px',
              color: 'var(--text-3)',
              letterSpacing: '0.06em',
            }}
          >
            Built for those who build America.
          </p>
        </div>
      </div>

      <style>{`
        @media (max-width: 960px) {
          .footer-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 560px) {
          .footer-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </footer>
  );
}
