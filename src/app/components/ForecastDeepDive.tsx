import { color, font } from "@/lib/theme"

const MONO = font.mono
const SYS  = font.sys
const { amber:AMBER, bg2:BG2, bd1:BD1, t1:T1, t3:T3 } = color

const MODELS = [
  {
    name:  "Holt-Winters",
    range: "~30–40%",
    desc:  "Exponential smoothing with trend and seasonality components captures recurring monthly patterns in construction spend.",
  },
  {
    name:  "SARIMA",
    range: "~30–40%",
    desc:  "Seasonal ARIMA handles autocorrelation and unit-root dynamics inherent in multi-year spending series.",
  },
  {
    name:  "XGBoost",
    range: "~20–40%",
    desc:  "Gradient boosting adds non-linear regime detection and cross-series feature signals for break-point sensitivity.",
  },
]

export function ForecastDeepDive() {
  return (
    <section className="sec sec-dk">
      <div className="wrap">
        <div className="data-2col">

          {/* Left — explanatory text */}
          <div>
            <p className="eyebrow-lbl">Ensemble methodology</p>
            <h2 className="h2">Three models,<br />one answer</h2>
            <p className="sub" style={{ maxWidth:420 }}>
              Holt-Winters, SARIMA, and XGBoost run independently on the same
              input series. Model weights are determined by inverse MAPE — the
              most accurate model leads the ensemble.
            </p>
            <p className="sub" style={{ maxWidth:420, marginTop:16 }}>
              80% and 95% confidence intervals are computed at every
              12-month horizon so you can see both the central forecast
              and the uncertainty range.
            </p>
          </div>

          {/* Right — model breakdown rows */}
          <div>
            {MODELS.map(m => (
              <div key={m.name}
                   style={{ background:BG2, borderRadius:14, padding:"20px 24px",
                            marginBottom:12, border:`1px solid ${BD1}` }}>
                <div style={{ display:"flex", justifyContent:"space-between",
                              alignItems:"baseline", marginBottom:8 }}>
                  <span style={{ fontFamily:SYS, fontSize:15,
                                 fontWeight:600, color:T1 }}>{m.name}</span>
                  <span style={{ fontFamily:MONO, fontSize:11,
                                 color:AMBER, letterSpacing:"0.06em" }}>{m.range}</span>
                </div>
                <p style={{ fontSize:13, color:T3, lineHeight:1.65 }}>{m.desc}</p>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  )
}
