const USERS = [
  {
    title: "Construction Lenders",
    desc:  "Underwrite with forward cost and labor signals. 12-month spend forecasts by region — decision-ready before credit committee.",
  },
  {
    title: "GCs & Developers",
    desc:  "See where federal pipeline is accelerating. Lock materials before costs move. Time market entry with AI-grade signals.",
  },
  {
    title: "Analysts & Investors",
    desc:  "Track public contractor backlog in real time. Sector rotation signals for construction equities before consensus catches up.",
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
