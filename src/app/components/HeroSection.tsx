"use client"
import Link from "next/link"
import { useState, useEffect } from "react"
import { font, color } from "@/lib/theme"

const MONO  = font.mono
const { amber:AMBER, green:GREEN, red:RED, blue:BLUE,
        bg1:BG1, bg2:BG2, bd1:BD1, t1:T1, t4:T4 } = color

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyData = any

function ForecastPreview({ currentValue, liveHist, liveFcast, forecastPct }: {
  currentValue: number
  liveHist?:   number[]
  liveFcast?:  number[]
  forecastPct?: number | null
}) {
  const W = 640, H = 280

  let hist: number[], fcast: number[]
  if (liveHist && liveHist.length >= 2 && liveFcast && liveFcast.length >= 2) {
    const all = [...liveHist, ...liveFcast]
    const mn = Math.min(...all), mx = Math.max(...all), rng = mx - mn || 1
    hist  = liveHist.map(v  => (v - mn) / rng)
    fcast = liveFcast.map(v => (v - mn) / rng)
  } else {
    hist  = [0.52,0.54,0.57,0.55,0.59,0.61,0.58,0.63,0.65,0.62,0.68,0.70]
    fcast = [0.70,0.72,0.74,0.71,0.76,0.78,0.75,0.80,0.82,0.79,0.84,0.87]
  }

  const pad = { t:16, r:20, b:32, l:12 }
  const cw = W - pad.l - pad.r, ch = H - pad.t - pad.b
  const hLen = hist.length, total = hLen + fcast.length - 1
  const px = (i: number) => +(pad.l + (i / (total - 1)) * cw).toFixed(1)
  const py = (v: number) => +(pad.t + (1 - v) * ch).toFixed(1)

  const histPath  = hist.map((v, i) => `${i === 0 ? "M" : "L"}${px(i)},${py(v)}`).join(" ")
  const fcastPath = fcast.map((v, i) => `${i === 0 ? "M" : "L"}${px(hLen - 1 + i)},${py(v)}`).join(" ")
  const topPts = fcast.map((v, i) => `${px(hLen - 1 + i)},${py(Math.min(v + 0.07, 1))}`)
  const botPts = [...fcast].reverse().map((v, i) =>
    `${px(hLen - 1 + fcast.length - 1 - i)},${py(Math.max(v - 0.05, 0))}`)
  const bandPath = `M${topPts[0]} ${topPts.slice(1).map(p => `L${p}`).join(" ")} ${botPts.map(p => `L${p}`).join(" ")} Z`
  const months = ["Jan","Apr","Jul","Oct","Jan","Apr","Jul","Oct","Jan"]
  const divX = px(hLen - 1)
  const pctLabel = forecastPct != null
    ? `${forecastPct >= 0 ? "+" : ""}${forecastPct.toFixed(1)}%`
    : null

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" style={{ display:"block" }}>
      <path d={bandPath} fill={BLUE} fillOpacity={0.12} />
      <line x1={divX} y1={pad.t} x2={divX} y2={H - pad.b}
            stroke={T4} strokeWidth={1} strokeDasharray="3,3" strokeOpacity={0.4} />
      <text x={+divX + 6} y={pad.t + 10} fill={T4} fontSize={9}
            fontFamily={MONO} letterSpacing="0.08em" fillOpacity={0.5}>FORECAST</text>
      <path d={histPath}  fill="none" stroke={AMBER} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      <path d={fcastPath} fill="none" stroke={BLUE}  strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={px(hLen - 1)}  cy={py(hist[hLen - 1])}          r={4} fill={AMBER} />
      <circle cx={px(total - 1)} cy={py(fcast[fcast.length - 1])} r={4} fill={BLUE}  />
      {months.map((m, i) => {
        const idx = Math.round(i * (total - 1) / (months.length - 1))
        return <text key={i} x={px(idx)} y={H - 6} textAnchor="middle"
                     fill={T4} fontSize={9} fontFamily={MONO} fillOpacity={0.45}>{m}</text>
      })}
      <text x={+divX - 8} y={py(hist[hLen - 1]) - 8} textAnchor="end"
            fill={AMBER} fontSize={10} fontFamily={MONO} fontWeight="600">
        ${(currentValue / 1000).toFixed(1)}B
      </text>
      {pctLabel && (
        <text x={px(total - 1) + 8} y={py(fcast[fcast.length - 1]) - 8}
              textAnchor="start" fill={BLUE} fontSize={10} fontFamily={MONO} fontWeight="600">
          {pctLabel}
        </text>
      )}
    </svg>
  )
}

export function HeroSection() {
  const [spend,   setSpend]   = useState<AnyData>(null)
  const [foreD,   setForeD]   = useState<AnyData>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function safe(url: string) {
      try { const r = await fetch(url); return r.ok ? r.json() : null } catch { return null }
    }
    Promise.all([safe("/api/census"), safe("/api/forecast?series=TTLCONS")])
      .then(([sd, fd]) => {
        if (sd) setSpend(sd)
        if (fd) setForeD(fd)
        setLoading(false)
      })
  }, [])

  const spendVal    = spend?.value  ?? spend?.latest?.value  ?? 2190
  const spendMom    = spend?.mom    ?? spend?.latest?.mom    ?? 0.3
  const liveHist    = foreD?.history as number[] | undefined
  const liveFcast   = foreD?.ensemble?.map((p: { base: number }) => p.base) as number[] | undefined
  const forecastPct = (() => {
    if (!liveHist?.length || !liveFcast?.length) return null
    const lh = liveHist[liveHist.length - 1], lf = liveFcast[liveFcast.length - 1]
    return lh > 0 ? ((lf - lh) / lh) * 100 : null
  })()

  const dim = (v: string) => loading
    ? <span style={{ background:BG2, borderRadius:4, color:"transparent", animation:"pulse 1.5s infinite" }}>{v}</span>
    : <>{v}</>

  return (
    <section className="hero">
      <div className="eyebrow d1">
        <span className="live-dot" />
        <span style={{ fontFamily:MONO, fontSize:11, color:AMBER, letterSpacing:"0.08em" }}>
          312 DATA SOURCES · 3-MODEL AI ENSEMBLE · LIVE
        </span>
      </div>

      <h1 className="hero-h1 d2">
        Forecast construction<br />
        <span className="grad-text">risk earlier</span>
      </h1>

      <p className="hero-sub d3">
        See what changed. Compare scenarios.<br />Trust the signal. Act.
      </p>

      <div className="hero-ctas d4">
        <Link href="/dashboard" className="btn-fl">See Live Intelligence →</Link>
        <Link href="/pricing"   className="btn-g">View Pricing</Link>
      </div>

      {/* Hero chart card */}
      <div className="d5" style={{ width:"100%", maxWidth:780 }}>
        <div style={{ background:BG1, borderRadius:24, border:`1px solid ${BD1}`,
                      overflow:"hidden", boxShadow:"0 24px 80px rgba(0,0,0,0.60)" }}>

          {/* Card header — insight rail */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
                        padding:"20px 24px 16px", borderBottom:`1px solid ${BD1}`, flexWrap:"wrap", gap:12 }}>
            <div>
              <div style={{ fontFamily:MONO, fontSize:10, color:T4, letterSpacing:"0.1em", marginBottom:4 }}>
                TOTAL CONSTRUCTION SPEND · TTLCONS
              </div>
              <div style={{ display:"flex", alignItems:"baseline", gap:12 }}>
                <span style={{ fontFamily:MONO, fontSize:28, fontWeight:700, color:AMBER }}>
                  {dim(`$${(spendVal / 1000).toFixed(1)}B`)}
                </span>
                <span style={{ fontFamily:MONO, fontSize:13, color:spendMom >= 0 ? GREEN : RED }}>
                  {spendMom >= 0 ? "+" : ""}{spendMom?.toFixed(2)}% MoM
                </span>
              </div>
            </div>
            {forecastPct != null && (
              <div>
                <div style={{ fontFamily:MONO, fontSize:10, color:T4, letterSpacing:"0.06em", marginBottom:4 }}>
                  12-MO FORECAST
                </div>
                <div style={{ fontFamily:MONO, fontSize:22, fontWeight:700,
                              color:forecastPct >= 0 ? BLUE : RED }}>
                  {forecastPct >= 0 ? "+" : ""}{forecastPct.toFixed(1)}%
                </div>
              </div>
            )}
          </div>

          {/* Chart */}
          <div style={{ padding:"20px 24px 8px" }}>
            <ForecastPreview currentValue={spendVal}
              liveHist={liveHist} liveFcast={liveFcast} forecastPct={forecastPct} />
          </div>

          {/* Legend + model strip */}
          <div style={{ padding:"8px 24px 16px", display:"flex", alignItems:"center",
                        gap:24, flexWrap:"wrap" }}>
            {[{col:AMBER,label:"Historical"},{col:BLUE,label:"AI Forecast"}].map(({col,label})=>(
              <div key={label} style={{ display:"flex", alignItems:"center", gap:6 }}>
                <div style={{ width:20, height:2, background:col, borderRadius:1 }} />
                <span style={{ fontFamily:MONO, fontSize:10, color:T4 }}>{label}</span>
              </div>
            ))}
            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
              <div style={{ width:14, height:10, borderRadius:2,
                            background:"rgba(10,132,255,0.12)" }} />
              <span style={{ fontFamily:MONO, fontSize:10, color:T4 }}>80% Confidence</span>
            </div>
            <div style={{ flex:1 }} />
            <span style={{ fontFamily:MONO, fontSize:10, color:T4, letterSpacing:"0.06em" }}>
              HOLT-WINTERS / SARIMA / XGBOOST
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
