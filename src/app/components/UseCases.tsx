const USERS = [
  {
    title: "Developers & GCs",
    desc:  "Project timing, cost forecasting, and market entry signals to maximize returns, reduce risk, and lock materials before costs move.",
  },
  {
    title: "Bankers & Lenders",
    desc:  "Construction loan risk, market timing signals, and 12-month spend outlook by region — decision-ready before credit committee.",
  },
  {
    title: "Equity Analysts",
    desc:  "Sector rotation signals for construction and materials equities. Know when to move before consensus catches up.",
  },
]

export function UseCases() {
  return (
    <section className="sec">
      <div className="wrap">
        <div className="hd-center">
          <p className="eyebrow-lbl">Who it&apos;s for</p>
          <h2 className="h2">Built for professionals who move capital</h2>
        </div>
        <div className="serve-grid">
          {USERS.map(({ title, desc }) => (
            <div key={title} className="serve-card">
              <h4 className="serve-role">{title}</h4>
              <p className="serve-desc">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
