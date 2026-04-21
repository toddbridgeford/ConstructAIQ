const MODELS = [
  {
    icon: "◎", tag: "AI ENGINE",   title: "3-Model Ensemble",
    desc: "Holt-Winters seasonality, SARIMA time-series, and XGBoost gradient boosting — accuracy-weighted and updated every 4 hours.",
  },
  {
    icon: "◈", tag: "DETECTION",   title: "Anomaly Signals",
    desc: "Z-score detection across 12 federal data series. Trend reversals, divergence patterns, and acceleration signals — explained.",
  },
  {
    icon: "◉", tag: "GEOGRAPHY",   title: "50-State Intelligence",
    desc: "BEA state-level GDP, permit trends, and regional spend classified HOT / GROWING / COOLING in real time.",
  },
  {
    icon: "◇", tag: "PROCUREMENT", title: "Materials Intelligence",
    desc: "BUY / SELL / HOLD signals for lumber, steel, concrete, copper, WTI, and diesel. Composite index updated hourly.",
  },
]

export function ForecastDeepDive() {
  return (
    <section className="sec sec-dk">
      <div className="wrap">
        <div className="hd-center">
          <p className="eyebrow-lbl">How it works</p>
          <h2 className="h2">Built on institutional-grade models</h2>
          <p className="sub">Transparent forecasting you can explain to a CFO.</p>
        </div>
        <div className="feat-grid" style={{ gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))" }}>
          {MODELS.map(({ icon, tag, title, desc }) => (
            <div key={title} className="feat-card">
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:18 }}>
                <span className="feat-icon">{icon}</span>
                <span className="feat-tag">{tag}</span>
              </div>
              <h4 className="feat-title">{title}</h4>
              <p className="feat-desc">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
