"use client";
import { useState, useEffect } from "react";

/* ─────────────────────────────────────────────────────────
LOGO — GitHub raw URL (also works once copied to /public/)
───────────────────────────────────────────────────────── */
const LOGO = "https://raw.githubusercontent.com/toddbridgeford/ConstructAIQ/Predictive-Model/ConstructAIQWhiteLogo.svg";

const blue       = "#0A84FF";
const blueHover  = "#409CFF";
const blueDim    = "rgba(10,132,255,0.12)";
const blueBorder = "rgba(10,132,255,0.25)";
const green      = "#30D158";
const red        = "#FF453A";
const amber      = "#FF9F0A";

const TICKS = [
["TTLCONS  $2,190B", "+0.42%", true],
["HOUST  1,487K",    "+7.22%", true],
["PERMIT  1,386K",   "−0.87%", false],
["EMPLOY  8,330K",   "+0.31%", true],
["LUMBER  $512",     "+3.2%",  true],
["STEEL HR  $748",   "−1.4%",  false],
["COPPER  $4.82",    "+0.8%",  true],
["IIJA  $890B",      "ACTIVE", null],
["10YR  4.32%",      "−2bp",   false],
["AGC BCI  58.4",    "+2.1",   true],
];

/* ══════════════════════════════════════════════════════════
GLOBAL STYLES — Apple HIG compliant responsive CSS
══════════════════════════════════════════════════════════ */
function GlobalStyles(){return null;}

/* ── TICKER ──────────────────────────────────────────────────────────────── */
function Ticker() {
const all = [...TICKS, ...TICKS];
return (
<div className="ticker">
<div className="ticker-edge-l" />
<div className="ticker-edge-r" />
<div className="ticker-track fm">
{all.map(([label, chg, up], i) => (
<span key={i} className="ticker-item">
<span style={{ color: "rgba(255,255,255,0.30)" }}>{label}</span>
{chg && <span style={{ color: up === true ? green : up === false ? red : blue, fontWeight: 500 }}>{chg}</span>}
</span>
))}
</div>
</div>
);
}

/* ── NAV ─────────────────────────────────────────────────────────────────── */
function Nav({ scrolled }) {
const [open, setOpen] = useState(false);
return (
<>
<nav className={`nav fa ${scrolled ? "on" : ""}`}>
<a href="/" style={{ display: "flex", alignItems: "center", minHeight: 44 }}>
<img src={LOGO} alt="ConstructAIQ" className="nav-logo-img" />
</a>
<div className="nav-center">
{[["Features","#features"],["Data","#data"],["Pricing","#pricing"],["About","#about"]].map(([l,h]) => (
<a key={l} href={h} className="nav-a">{l}</a>
))}
</div>
<div className="nav-right">
<a href="/dashboard" className="btn-t fm" style={{ fontSize: 10, letterSpacing: "0.1em", height: 40 }}>
LIVE TERMINAL →
</a>
<a href="#access" className="btn-f fa" style={{ height: 40, fontSize: 14 }}>Get Access</a>
</div>
<button className="ham" onClick={() => setOpen(o => !o)} aria-label="Menu">
<svg width="22" height="16" viewBox="0 0 22 16" fill="none">
<rect y="0"  width="22" height="2" rx="1" fill={open ? blue : "rgba(255,255,255,0.66)"} style={{ transition: "fill 0.15s" }} />
<rect y="7"  width="15" height="2" rx="1" fill={open ? blue : "rgba(255,255,255,0.66)"} style={{ transition: "fill 0.15s" }} />
<rect y="14" width="22" height="2" rx="1" fill={open ? blue : "rgba(255,255,255,0.66)"} style={{ transition: "fill 0.15s" }} />
</svg>
</button>
</nav>
<div className={`mob-menu fa ${open ? "open" : ""}`}>
{[["Features","#features"],["Data","#data"],["Pricing","#pricing"],["About","#about"]].map(([l,h]) => (
<a key={l} href={h} className="mob-a" onClick={() => setOpen(false)}>{l}</a>
))}
<div className="mob-ctas">
<a href="/dashboard" className="btn-g fa" onClick={() => setOpen(false)} style={{ fontSize: 14 }}>Open Live Terminal →</a>
<a href="#access" className="btn-fl fa" onClick={() => setOpen(false)}>Get Early Access</a>
</div>
</div>
</>
);
}

/* ── PRICING CARD ────────────────────────────────────────────────────────── */
function PCard({ tier, price, unit, desc, features, cta, featured }) {
return (
<div className={`price-card fa ${featured ? "price-feat" : ""}`}>
{featured && <div className="price-badge fm">MOST POPULAR</div>}
<div className="price-tier fm" style={{ color: featured ? blue : "rgba(255,255,255,0.28)" }}>{tier}</div>
<div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
<span className="price-num">{price}</span>
{unit && <span className="price-unit">{unit}</span>}
</div>
<div className="price-desc">{desc}</div>
<div className="price-feats">
{features.map((f, i) => (
<div key={i} className="price-row">
<span className="price-ck">✓</span>
<span className="price-txt">{f}</span>
</div>
))}
</div>
<a href="#access"
className={featured ? "btn-fl fa" : "btn-g fa"}
style={{ width: "100%", fontSize: 14, fontWeight: featured ? 600 : 500, height: 44,
...(featured ? {} : { color: blue, borderColor: "rgba(10,132,255,0.26)", background: "rgba(10,132,255,0.08)", height: 44, borderRadius: 12 })
}}>
{cta}
</a>
</div>
);
}

/* ══════════════════════════════════════════════════════════
MAIN PAGE
══════════════════════════════════════════════════════════ */
export default function Home() {
const [scrolled, setScrolled] = useState(false);

useEffect(() => {
const h = () => setScrolled(window.scrollY > 40);
window.addEventListener("scroll", h, { passive: true });
return () => window.removeEventListener("scroll", h);
}, []);

return (
<div className="fa" style={{ background: "#060608", color: "#fff", minHeight: "100vh", overflowX: "hidden" }}>

<Nav scrolled={scrolled} />
<Ticker />

  {/* ────── HERO ────── */}
  <section className="hero">
    <div className="eyebrow d1 fa">
      <div className="live-dot" />
      <span className="fm" style={{ fontSize: 10, letterSpacing: "0.1em", color: green }}>LIVE</span>
      <div style={{ width: 1, height: 12, background: "rgba(255,255,255,0.12)" }} />
      <span className="fm" style={{ fontSize: 10, letterSpacing: "0.1em", color: "rgba(255,255,255,0.34)" }}>312 SOURCES</span>
    </div>
    <h1 className="hero-h1 fa d2">
      The Construction<br />
      <span className="grad-text">Intelligence Terminal.</span>
    </h1>
    <p className="hero-sub fa d3">
      Market signals.<br />Before the market moves.
    </p>
    <div className="hero-ctas d4">
      <a href="#access" className="btn-fl fa">Get Early Access</a>
      <a href="/dashboard" className="btn-g fa">
        View Live Terminal <span style={{ color: blue }}>→</span>
      </a>
    </div>
    <div className="hero-pills d5">
      {[
        { t: "BULLISH", txt: "Infrastructure Surge", c: green },
        { t: "WARNING", txt: "Craft Labor 12-yr Low", c: amber },
        { t: "DATA",    txt: "BLS +18,400 Jobs",     c: blue  },
        { t: "BEARISH", txt: "Multifamily Pullback", c: red   },
      ].map(({ t, txt, c }, i) => (
        <div key={i} className="pill fa" style={{ background: `${c}10`, border: `1px solid ${c}20` }}>
          <div className="pill-dot" style={{ background: c }} />
          <span className="pill-type fm" style={{ color: c }}>{t}</span>
          <span className="pill-text">{txt}</span>
        </div>
      ))}
    </div>
  </section>

  {/* ────── STATS ────── */}
  <div className="div" />
  <div className="stats">
    {[
      { v: "312",  u: "",    l: "Data Sources",      s: "Federal + State",    c: blue  },
      { v: "94.8", u: "%",   l: "Forecast Accuracy", s: "12-Month Horizon",   c: green },
      { v: "4",    u: " hrs",l: "Data Freshness",    s: "Rolling Updates",    c: amber },
      { v: "50",   u: "+",   l: "Metro Markets",     s: "Full U.S. Coverage", c: blue  },
    ].map((s, i) => (
      <div key={i} className="stat">
        <div className="stat-v fa" style={{ color: s.c }}>
          {s.v}<span style={{ fontSize: "0.44em" }}>{s.u}</span>
        </div>
        <div className="stat-l fa">{s.l}</div>
        <div className="stat-s fm">{s.s}</div>
      </div>
    ))}
  </div>
  <div className="div" />

  {/* ────── FEATURES ────── */}
  <section id="features" className="sec">
    <div className="wrap">
      <div className="hd-center">
        <div className="eyebrow-lbl fm">Platform</div>
        <h2 className="h2">Intelligence that moves<br />at construction speed.</h2>
        <p className="sub">Six modules. One terminal. Zero manual aggregation.</p>
      </div>
      <div className="feat-grid">
        {[
          { icon: "◎", tag: "AI FORECAST", title: "Predictive Market Model",   desc: "Predict spend, permits, and labor 12 months out. 94.8% accuracy." },
          { icon: "◈", tag: "DATA",         title: "312 Sources Unified",       desc: "Every federal feed. All 50 state permit offices. One platform." },
          { icon: "⬡", tag: "SECTORS",      title: "Sector Heat Map",           desc: "8 construction sectors. Real-time momentum scores." },
          { icon: "△", tag: "LABOR",         title: "Craft Labor Intelligence",  desc: "Wage pressure signals across 200+ metropolitan areas." },
          { icon: "◻", tag: "MATERIALS",    title: "Materials Cost Monitor",    desc: "BUY. SELL. HOLD. AI-scored signals on 6 key commodities." },
          { icon: "⬤", tag: "FEDERAL",      title: "Pipeline Tracker",          desc: "$890B in IIJA and federal contracts. None missed." },
        ].map((f, i) => (
          <div key={i} className="feat-card">
            <div className="feat-tag fm">{f.tag}</div>
            <div className="feat-icon">{f.icon}</div>
            <div className="feat-title fa">{f.title}</div>
            <div className="feat-desc fa">{f.desc}</div>
          </div>
        ))}
      </div>
    </div>
  </section>

  {/* ────── HOW IT WORKS ────── */}
  <div className="sec-dk">
    <section className="sec">
      <div className="wrap">
        <div className="hd-center">
          <div className="eyebrow-lbl fm">How It Works</div>
          <h2 className="h2" style={{ fontSize: "clamp(26px,3.5vw,44px)" }}>
            Raw data.<br />Refined signal.
          </h2>
        </div>
        <div className="steps">
          {[
            { n: "01", t: "Ingest",  d: "312 feeds. Every 4 hours. Fully automatic.",          c: blue  },
            { n: "02", t: "Analyze", d: "AI ensemble models. 20 years of construction data.",   c: green },
            { n: "03", t: "Act",     d: "Your signal. Confidence intervals. Before the bid.",   c: amber },
          ].map((s, i) => (
            <div key={i} className="step">
              <div className="step-n fm" style={{ color: s.c }}>{s.n}</div>
              <div className="step-t fa">{s.t}</div>
              <div className="step-d fa">{s.d}</div>
              <div className="step-bar" style={{ background: `linear-gradient(to right, ${s.c}, transparent)` }} />
            </div>
          ))}
        </div>
      </div>
    </section>
  </div>

  {/* ────── DATA SOURCES ────── */}
  <section id="data" className="sec">
    <div className="wrap">
      <div className="data-2col">
        <div>
          <div className="eyebrow-lbl fm">Data Infrastructure</div>
          <h2 className="h2">One platform.<br />Every source<br />that matters.</h2>
          <p className="sub" style={{ marginBottom: 36 }}>
            Federal agencies. State permit offices. Commodity exchanges. Normalized, weighted, refreshed every four hours.
          </p>
          <a href="/dashboard" className="btn-t fm" style={{ fontSize: 10, letterSpacing: "0.1em" }}>
            VIEW LIVE TERMINAL →
          </a>
        </div>
        <div className="srcs fm">
          {["Census Bureau VIP","BLS CES / QCEW","FRED / Fed Reserve","HUD SOCDS","DOT FHWA","AGC Data Digest","USASpending.gov","RSMeans Cost Index","Dodge Construction","50 State Permit APIs","FEMA Flood Maps","EPA Air Quality"].map((s, i) => (
            <div key={i} className="src">{s}</div>
          ))}
        </div>
      </div>
    </div>
  </section>

  {/* ────── TERMINAL STRIP ────── */}
  <div className="t-strip">
    <div className="wrap">
      <div className="t-strip-in">
        <div>
          <div className="fm" style={{ fontSize: 9.5, letterSpacing: "0.16em", color: blue, marginBottom: 8, textTransform: "uppercase" }}>Live — No Login Required</div>
          <div className="fa" style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.025em", color: "#fff" }}>See the full Bloomberg-grade terminal.</div>
        </div>
        <a href="/dashboard" className="btn-fl fa" style={{ flexShrink: 0 }}>Open Terminal</a>
      </div>
    </div>
  </div>

  {/* ────── PRICING ────── */}
  <section id="pricing" className="sec">
    <div className="wrap">
      <div className="hd-center">
        <div className="eyebrow-lbl fm">Pricing</div>
        <h2 className="h2">Plans for every scale.</h2>
        <p className="sub">Early access pricing. Locked in at launch.</p>
      </div>
      <div className="price-grid">
        <PCard tier="Starter"      price="$490"   unit="/mo" desc="New markets. Sharp instincts."   cta="Start Free Trial"  featured={false}
          features={["5 metro dashboards","Monthly AI forecasts","Materials cost index","Permit volume trends","Email support"]} />
        <PCard tier="Professional" price="$1,490" unit="/mo" desc="For ENR 400 firms."              cta="Get Early Access"  featured={true}
          features={["25 metro dashboards","Weekly forecast updates","Full labor market signals","Federal pipeline monitor","Bid intelligence module","API 50k calls/mo","Slack / Teams alerts","Priority support"]} />
        <PCard tier="Enterprise"   price="Custom" unit=""    desc="For ENR 100."                    cta="Contact Sales"     featured={false}
          features={["Unlimited metro coverage","Daily data refresh","Scenario modeling suite","Portfolio stress-testing","Dedicated analyst","Unlimited API access","SSO + audit logs","SLA guarantee"]} />
      </div>
    </div>
  </section>

  {/* ────── WHO WE SERVE ────── */}
  <div id="about" className="sec-dk">
    <section className="sec">
      <div className="wrap">
        <div className="hd-center">
          <div className="eyebrow-lbl fm">Who We Serve</div>
          <h2 className="h2" style={{ fontSize: "clamp(26px,3.5vw,44px)" }}>Built for professionals<br />who move the market.</h2>
        </div>
        <div className="serve-grid">
          {[
            { em: "📊", role: "Economists",      org: "NAHB · AGC · Regional Fed", desc: "Unified construction data. No manual aggregation. Cite it in your next report." },
            { em: "🏗️", role: "Contractors",     org: "ENR 400 to ENR 100",        desc: "Sharpen bids. Time procurement. Expand into new markets with confidence." },
            { em: "🏦", role: "Capital Markets", org: "Lenders · PE · REITs",       desc: "Underwrite deals with forward data. Stress-test portfolios against 12-month forecasts." },
          ].map((a, i) => (
            <div key={i} className="serve-card">
              <div className="serve-em">{a.em}</div>
              <div className="serve-role fa">{a.role}</div>
              <div className="serve-org fm">{a.org}</div>
              <div className="serve-desc fa">{a.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  </div>

  {/* ────── CTA BAND ────── */}
  <section id="access" className="cta-sec">
    <div className="wrap">
      <div className="eyebrow-lbl fm" style={{ marginBottom: 28 }}>Early Access</div>
      <h2 className="cta-h2 fa">
        The market<br />
        <span className="grad-text">doesn't wait.</span>
      </h2>
      <p className="cta-sub fa">Neither should you.</p>
      <div className="cta-form">
        <input type="email" placeholder="your@email.com" className="cta-inp fa" />
        <button className="btn-fl fa">Request Access</button>
      </div>
      <div className="cta-disc fm">No spam — launch updates only</div>
    </div>
  </section>

  {/* ────── FOOTER ────── */}
  <footer className="ftr">
    <div className="wrap">
      <div className="ftr-grid">
        <div>
          <img src={LOGO} alt="ConstructAIQ" style={{ height: 24, marginBottom: 20 }} />
          <p className="fa" style={{ fontSize: 13.5, color: "rgba(255,255,255,0.34)", lineHeight: 1.76, maxWidth: 255, marginBottom: 24, fontWeight: 400, letterSpacing: "-0.005em" }}>
            AI-powered construction market intelligence. 312 sources. One terminal.
          </p>
          <a href="/dashboard" className="btn-t fm" style={{ fontSize: 9.5, letterSpacing: "0.1em", height: 36 }}>OPEN TERMINAL →</a>
        </div>
        {[
          { h: "Product", ls: ["Features","Pricing","Data Sources","API Docs","Changelog"] },
          { h: "Company", ls: ["About","Blog","Careers","Press","Contact"] },
          { h: "Legal",   ls: ["Privacy","Terms","Data Usage","Security","Cookies"] },
        ].map((col, i) => (
          <div key={i}>
            <div className="ftr-hd fm">{col.h}</div>
            <div className="ftr-links">
              {col.ls.map(l => <a key={l} href="#" className="ftr-lnk fa">{l}</a>)}
            </div>
          </div>
        ))}
      </div>
      <div className="ftr-btm">
        <span className="ftr-copy fm">© 2026 ConstructAIQ Inc. All rights reserved.</span>
        <div className="ftr-soc">
          {["LinkedIn","X / Twitter","GitHub"].map(s => <a key={s} href="#" className="ftr-sl fm">{s}</a>)}
        </div>
      </div>
    </div>
  </footer>
</div>

);
}
