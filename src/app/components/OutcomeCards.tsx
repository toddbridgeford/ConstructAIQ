import { color } from "@/lib/theme"

const { amber: AMBER, blue: BLUE, green: GREEN } = color

const CARDS = [
  {
    n: "01", accent: AMBER, title: "Forecast",
    desc: "12-month ensemble AI forecast with 80% and 95% confidence intervals — three accuracy-weighted models, updated every 4 hours.",
  },
  {
    n: "02", accent: BLUE, title: "Signals",
    desc: "Z-score anomaly detection across 12 federal data series. Trend reversals, divergence patterns, and acceleration alerts — explained.",
  },
  {
    n: "03", accent: GREEN, title: "Scenario",
    desc: "Rate shock, IIJA funding, labor supply, and material cost controls. Compute adjusted forecasts in real time before committing capital.",
  },
]

export function OutcomeCards() {
  return (
    <section className="sec">
      <div className="wrap">
        <div className="hd-center">
          <p className="eyebrow-lbl">What you get</p>
          <h2 className="h2">One system. Every signal.</h2>
        </div>
        <div className="feat-grid">
          {CARDS.map(({ n, accent, title, desc }) => (
            <div key={n} className="feat-card">
              <div style={{ fontFamily:"'SF Mono','Fira Code',monospace", fontSize:11,
                            color:accent, fontWeight:700, opacity:0.5, marginBottom:20 }}>{n}</div>
              <h3 className="feat-title" style={{ fontSize:22 }}>{title}</h3>
              <p className="feat-desc">{desc}</p>
              <div style={{ height:2, width:32, background:accent, borderRadius:1,
                            opacity:0.5, marginTop:24 }} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
