import { TrendingUp, Activity, Sliders } from "lucide-react"
import { color } from "@/lib/theme"

const { amber:AMBER, blue:BLUE, green:GREEN, bg1:BG1, bd1:BD1 } = color

const CARDS = [
  {
    Icon: TrendingUp, accent: AMBER, title: "Forecast",
    desc: "12-month ensemble forecast with 80% and 95% confidence intervals. Three models, one answer.",
  },
  {
    Icon: Activity, accent: BLUE, title: "Signals",
    desc: "Anomaly detection across 10+ government data sources. Know before the market does.",
  },
  {
    Icon: Sliders, accent: GREEN, title: "Scenario",
    desc: "Model rate shocks, IIJA funding changes, and labor cost shifts before committing capital.",
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
          {CARDS.map(({ Icon, accent, title, desc }) => (
            <div key={title} className="feat-card"
                 style={{ background:BG1, border:`1px solid ${BD1}` }}>
              <Icon size={24} color={accent} style={{ marginBottom:20 }} />
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
