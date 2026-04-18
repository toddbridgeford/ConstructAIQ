'use client';

const PLANS = [
  {
    name: 'Analyst',
    price: '$299',
    period: '/mo',
    description:
      'For individual researchers, consultants, and economists who need comprehensive construction data.',
    highlight: false,
    features: [
      'Access to all 312 data sources',
      'Quarterly market forecasts',
      'Permit trend dashboards',
      'Labor & wage analytics',
      'Material cost tracker',
      'CSV & Excel exports',
      'Email support',
    ],
    cta: 'Start Free Trial',
    note: '14-day free trial. No credit card required.',
  },
  {
    name: 'Team',
    price: '$999',
    period: '/mo',
    description:
      'For teams and organizations that need collaborative access, deeper analytics, and priority data.',
    highlight: true,
    features: [
      'Everything in Analyst',
      'Up to 5 seats',
      'Monthly forecast updates',
      'Regional signal scores',
      'Federal contract pipeline',
      'API access (10K calls/mo)',
      'Custom report builder',
      'Priority support',
    ],
    cta: 'Start Free Trial',
    note: '14-day free trial. No credit card required.',
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description:
      'For large firms, financial institutions, and government bodies that require full data access and dedicated support.',
    highlight: false,
    features: [
      'Everything in Team',
      'Unlimited seats',
      'Daily forecast updates',
      'Unlimited API access',
      'White-label reports',
      'Custom data integrations',
      'Dedicated data analyst',
      'SLA guarantees',
    ],
    cta: 'Contact Sales',
    note: 'Tailored to your organization\'s needs.',
  },
];

const CHECK_ICON = (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export default function Pricing() {
  return (
    <section
      id="pricing"
      style={{
        padding: '96px 24px',
        maxWidth: '1200px',
        margin: '0 auto',
      }}
    >
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '64px' }}>
        <div
          style={{
            fontSize: '10px',
            letterSpacing: '0.24em',
            textTransform: 'uppercase',
            color: 'var(--gold)',
            marginBottom: '16px',
          }}
        >
          Pricing
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
          Simple, Transparent
          <br />
          <span style={{ color: 'var(--gold)' }}>Pricing</span>
        </h2>
        <p
          style={{
            fontSize: '14px',
            color: 'var(--text-2)',
            maxWidth: '480px',
            margin: '0 auto',
            lineHeight: 1.75,
          }}
        >
          All plans include full data access. Upgrade or downgrade at any time.
        </p>
      </div>

      {/* Plans */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '0',
          background: 'var(--border)',
          border: '1px solid var(--border)',
        }}
        className="pricing-grid"
      >
        {PLANS.map((plan) => (
          <div
            key={plan.name}
            style={{
              background: plan.highlight ? 'var(--surface)' : 'var(--bg)',
              padding: '40px 32px',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Popular badge */}
            {plan.highlight && (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: '32px',
                  right: '32px',
                  height: '3px',
                  background: 'var(--gold)',
                }}
              />
            )}

            {/* Plan name */}
            <div
              style={{
                fontSize: '10px',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: plan.highlight ? 'var(--gold)' : 'var(--text-3)',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              {plan.name}
              {plan.highlight && (
                <span
                  style={{
                    fontSize: '9px',
                    padding: '2px 7px',
                    background: 'var(--gold-dim)',
                    border: '1px solid var(--gold)',
                    color: 'var(--gold)',
                    borderRadius: '2px',
                    letterSpacing: '0.14em',
                  }}
                >
                  Most Popular
                </span>
              )}
            </div>

            {/* Price */}
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: '4px',
                marginBottom: '16px',
              }}
            >
              <span
                style={{
                  fontSize: plan.price === 'Custom' ? '36px' : '48px',
                  fontWeight: 900,
                  color: 'var(--text)',
                  letterSpacing: '-0.02em',
                  lineHeight: 1,
                }}
              >
                {plan.price}
              </span>
              {plan.period && (
                <span style={{ fontSize: '14px', color: 'var(--text-3)' }}>
                  {plan.period}
                </span>
              )}
            </div>

            {/* Description */}
            <p
              style={{
                fontSize: '13px',
                color: 'var(--text-2)',
                lineHeight: 1.65,
                marginBottom: '32px',
                minHeight: '52px',
              }}
            >
              {plan.description}
            </p>

            {/* CTA */}
            <a
              href={plan.name === 'Enterprise' ? '#contact' : '#signup'}
              style={{
                display: 'block',
                padding: '13px 20px',
                textAlign: 'center',
                background: plan.highlight ? 'var(--gold)' : 'transparent',
                color: plan.highlight ? 'var(--bg)' : 'var(--text)',
                border: plan.highlight
                  ? '1px solid var(--gold)'
                  : '1px solid var(--border-2)',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                borderRadius: '2px',
                marginBottom: '12px',
                transition: 'all 0.2s',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget;
                if (plan.highlight) {
                  el.style.background = 'var(--gold-hover)';
                } else {
                  el.style.borderColor = 'var(--gold)';
                  el.style.color = 'var(--gold)';
                }
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget;
                if (plan.highlight) {
                  el.style.background = 'var(--gold)';
                } else {
                  el.style.borderColor = 'var(--border-2)';
                  el.style.color = 'var(--text)';
                }
              }}
            >
              {plan.cta}
            </a>

            <p
              style={{
                fontSize: '11px',
                color: 'var(--text-3)',
                textAlign: 'center',
                marginBottom: '32px',
              }}
            >
              {plan.note}
            </p>

            {/* Divider */}
            <div
              style={{
                borderTop: '1px solid var(--border)',
                paddingTop: '24px',
                flex: 1,
              }}
            >
              <ul
                style={{
                  listStyle: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                {plan.features.map((feat) => (
                  <li
                    key={feat}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      fontSize: '13px',
                      color: 'var(--text-2)',
                    }}
                  >
                    <span
                      style={{
                        color: 'var(--gold)',
                        flexShrink: 0,
                        marginTop: '1px',
                      }}
                    >
                      {CHECK_ICON}
                    </span>
                    {feat}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom note */}
      <div
        style={{
          marginTop: '40px',
          padding: '24px 32px',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          flexWrap: 'wrap',
        }}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--gold)"
          strokeWidth="1.5"
          style={{ flexShrink: 0 }}
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <p style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.6 }}>
          All plans are billed monthly. Annual billing available with 20% discount.
          Government and academic institutions may qualify for special pricing —{' '}
          <a
            href="mailto:sales@constructaiq.trade"
            style={{ color: 'var(--gold)', textDecoration: 'underline' }}
          >
            contact us
          </a>
          .
        </p>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .pricing-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}
