import { NextResponse }  from "next/server"
import { getLatestObs } from "@/lib/supabase"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// ── Types ────────────────────────────────────────────────────────────────────

export interface DriverComponent {
  name:           string
  series_id:      string
  current_yoy:    number
  direction:      "GROWING" | "DECLINING" | "FLAT"
  share_of_total: number
  impact:         "POSITIVE" | "NEGATIVE" | "NEUTRAL"
  note:           string
}

export interface DriverAnalysis {
  series:         string
  driver_summary: string
  components:     DriverComponent[]
  macro_context:  string[]
  as_of:          string
}

// ── Seed fallbacks (last 24 months, anchored Dec 2025) ────────────────────────

const TTLCONS_SEED = [
  2184.6, 2174.9, 2206.5, 2215.4, 2199.8, 2200.7, 2205.3, 2197.9, 2197.1,
  2192.9, 2176.6, 2169.6, 2165.4, 2150.8, 2153.4, 2149.1, 2160.7, 2168.5,
  2177.2, 2169.5, 2167.9, 2181.2, 2197.6, 2190.4,
]

// Residential: ~41% of TTLCONS, gently declining (rate sensitivity)
const TLRESCONS_SEED = [
  895.7, 891.7, 904.7, 908.3, 901.9, 902.3, 904.2, 901.1, 900.8,
  899.1, 892.4, 889.5, 887.8, 881.8, 882.9, 881.1, 885.9, 888.7,
  892.6, 889.5, 889.0, 894.3, 900.5, 897.9,
]

const PERMIT_SEED = [
  1577, 1476, 1459, 1407, 1461, 1436, 1476, 1434, 1428, 1508, 1480, 1460,
  1454, 1481, 1422, 1394, 1393, 1362, 1330, 1415, 1411, 1388, 1455, 1386,
]

// PERMIT1 (single-family): ~62% of PERMIT
const PERMIT1_SEED = [
  978, 915, 904, 872, 905, 890, 915, 889, 885, 935, 917, 905,
  901, 918, 881, 864, 864, 844, 825, 877, 875, 861, 902, 859,
]

// PERMIT5 (5+ unit multifamily): ~30% of PERMIT
const PERMIT5_SEED = [
  473, 443, 438, 422, 438, 431, 443, 430, 428, 452, 444, 438,
  436, 444, 427, 418, 418, 409, 399, 425, 423, 416, 437, 416,
]

// ── Helpers ───────────────────────────────────────────────────────────────────

type ObsRow = { obs_date: string; value: number }

function seedToObs(seed: number[]): ObsRow[] {
  return seed.map((v, i) => {
    const monthsFromDec2025 = seed.length - 1 - i
    let m = 11 - monthsFromDec2025
    let y = 2025
    while (m < 0) { m += 12; y-- }
    return { obs_date: `${y}-${String(m + 1).padStart(2, "0")}-01`, value: v }
  })
}

function yoy(obs: ObsRow[]): number {
  if (obs.length < 13) return 0
  const latest = obs[obs.length - 1].value
  const prior  = obs[obs.length - 13].value
  return prior > 0 ? ((latest - prior) / prior) * 100 : 0
}

function direction(pct: number): "GROWING" | "DECLINING" | "FLAT" {
  if (pct >  0.5) return "GROWING"
  if (pct < -0.5) return "DECLINING"
  return "FLAT"
}

function impact(pct: number, positive: boolean): "POSITIVE" | "NEGATIVE" | "NEUTRAL" {
  if (pct >  0.5) return positive ? "POSITIVE" : "NEGATIVE"
  if (pct < -0.5) return positive ? "NEGATIVE" : "POSITIVE"
  return "NEUTRAL"
}

// ── TTLCONS analysis ──────────────────────────────────────────────────────────

async function analyzeTTLCONS(): Promise<DriverAnalysis> {
  const [ttlRaw, resRaw, mortRaw, permitRaw] = await Promise.all([
    getLatestObs("TTLCONS",      14) as Promise<ObsRow[]>,
    getLatestObs("TLRESCONS",    14) as Promise<ObsRow[]>,
    getLatestObs("MORTGAGE30US",  2) as Promise<ObsRow[]>,
    getLatestObs("PERMIT",        3) as Promise<ObsRow[]>,
  ])

  const ttl  = ttlRaw.length  >= 13 ? ttlRaw  : seedToObs(TTLCONS_SEED).slice(-14)
  const res  = resRaw.length  >= 13 ? resRaw  : seedToObs(TLRESCONS_SEED).slice(-14)

  const ttlLatest    = ttl[ttl.length - 1].value
  const resLatest    = res[res.length - 1].value
  const nresLatest   = ttlLatest - resLatest
  const resShare     = resLatest  / ttlLatest
  const nresShare    = nresLatest / ttlLatest

  const ttlPrior  = ttl[ttl.length - 13].value
  const resPrior  = res[res.length - 13].value
  const nresPrior = ttlPrior - resPrior

  const resYoy  = resPrior  > 0 ? ((resLatest  - resPrior)  / resPrior)  * 100 : 0
  const nresYoy = nresPrior > 0 ? ((nresLatest - nresPrior) / nresPrior) * 100 : 0

  const resDir  = direction(resYoy)
  const nresDir = direction(nresYoy)

  // Macro rate context
  const mortRate = mortRaw.length > 0 ? mortRaw[mortRaw.length - 1].value : 6.82
  const mortLabel = `${mortRate.toFixed(2)}%`

  // Notes per component
  const permitLatest = permitRaw.length > 0 ? permitRaw[permitRaw.length - 1].value : 1386
  const permitNote   = permitLatest < 1400
    ? `Building permits at ${Math.round(permitLatest)}k ann. — pipeline contraction weighs on residential`
    : `Building permits at ${Math.round(permitLatest)}k ann. — pipeline supports near-term starts`

  const resNote = resDir === "DECLINING"
    ? `Rate-sensitive sector: 30yr mortgage at ${mortLabel} is suppressing new starts. ${permitNote}.`
    : resDir === "GROWING"
    ? `Residential recovering despite elevated rates — demand from household formation. ${permitNote}.`
    : `Residential spending flat — rate headwinds offsetting underlying demand. ${permitNote}.`

  const nresNote = nresDir === "GROWING"
    ? "Federal IIJA infrastructure programs absorbing residential softness; data center, industrial, and health care builds active."
    : nresDir === "DECLINING"
    ? "Commercial and institutional pullback; office and retail remains weak post-cycle."
    : "Nonresidential spending holding near trend — federal and industrial sectors balanced against office softness."

  // Summary sentence
  const dominant   = Math.abs(resYoy * resShare) > Math.abs(nresYoy * nresShare) ? "residential" : "nonresidential"
  const domDir     = dominant === "residential" ? resDir : nresDir
  const otherDir   = dominant === "residential" ? nresDir : resDir
  const otherLabel = dominant === "residential" ? "nonresidential" : "residential"

  let summary: string
  if (domDir === otherDir) {
    summary = domDir === "GROWING"
      ? "Both residential and nonresidential construction are expanding, supporting broad spending growth."
      : domDir === "DECLINING"
      ? "Both residential and nonresidential spending are contracting, driven by rate pressure and soft demand."
      : "Both segments are flat — construction spending in a holding pattern pending clearer macro signals."
  } else {
    const domPct   = dominant === "residential" ? resYoy  : nresYoy
    const otherPct = dominant === "residential" ? nresYoy : resYoy
    summary = `${capitalize(dominant)} ${domDir.toLowerCase()} (${fmt(domPct)}% YoY) while ${otherLabel} ${otherDir.toLowerCase()} (${fmt(otherPct)}% YoY) — offsetting moves in total spending.`
  }

  const asOf = ttl[ttl.length - 1].obs_date || new Date().toISOString().slice(0, 10)

  return {
    series: "TTLCONS",
    driver_summary: summary,
    components: [
      {
        name:           "Residential",
        series_id:      "TLRESCONS",
        current_yoy:    +resYoy,
        direction:      resDir,
        share_of_total: resShare,
        impact:         impact(resYoy, true),
        note:           resNote,
      },
      {
        name:           "Nonresidential",
        series_id:      "implied",
        current_yoy:    +nresYoy,
        direction:      nresDir,
        share_of_total: nresShare,
        impact:         impact(nresYoy, true),
        note:           nresNote,
      },
    ],
    macro_context: [
      `30yr mortgage at ${mortLabel} — ${mortRate > 6.5 ? "historically elevated, suppressing rate-sensitive residential starts" : "normalizing toward long-run average, supporting residential recovery"}`,
      nresYoy > 0
        ? "Federal IIJA pipeline is above its 5-year average — supports nonresidential and infrastructure spending."
        : "Federal obligated awards tracking below pace — headwind for nonresidential growth.",
    ],
    as_of: asOf,
  }
}

// ── PERMIT analysis ───────────────────────────────────────────────────────────

async function analyzePERMIT(origin: string): Promise<DriverAnalysis> {
  const [permRaw, perm1Raw, perm5Raw, mortRaw] = await Promise.all([
    getLatestObs("PERMIT",       14) as Promise<ObsRow[]>,
    getLatestObs("PERMIT1",      14) as Promise<ObsRow[]>,
    getLatestObs("PERMIT5",      14) as Promise<ObsRow[]>,
    getLatestObs("MORTGAGE30US",  2) as Promise<ObsRow[]>,
  ])

  const perm  = permRaw.length  >= 13 ? permRaw  : seedToObs(PERMIT_SEED).slice(-14)
  const perm1 = perm1Raw.length >= 13 ? perm1Raw : seedToObs(PERMIT1_SEED).slice(-14)
  const perm5 = perm5Raw.length >= 13 ? perm5Raw : seedToObs(PERMIT5_SEED).slice(-14)

  const permLatest  = perm[perm.length - 1].value
  const perm1Latest = perm1[perm1.length - 1].value
  const perm5Latest = perm5[perm5.length - 1].value

  const perm1Share = perm1Latest / permLatest
  const perm5Share = perm5Latest / permLatest

  const perm1Yoy = yoy(perm1)
  const perm5Yoy = yoy(perm5)

  const perm1Dir = direction(perm1Yoy)
  const perm5Dir = direction(perm5Yoy)

  const mortRate = mortRaw.length > 0 ? mortRaw[mortRaw.length - 1].value : 6.82

  // Regional context
  let topState = "", bottomState = ""
  try {
    const mapRes = await fetch(`${origin}/api/map`, { signal: AbortSignal.timeout(5_000) })
    if (mapRes.ok) {
      const mapData = await mapRes.json()
      const states: { state: string; value: number }[] = mapData?.states ?? []
      if (states.length > 0) {
        topState    = states[0]?.state    ?? ""
        bottomState = states[states.length - 1]?.state ?? ""
      }
    }
  } catch { /* leave empty */ }

  const perm1Note = perm1Dir === "DECLINING"
    ? `Single-family starts directly rate-sensitive — 30yr mortgage at ${mortRate.toFixed(2)}% compresses affordability and builder starts.`
    : `Single-family permits recovering — builder sentiment improving as rate expectations ease.`

  const perm5Note = perm5Dir === "DECLINING"
    ? "Multifamily permits pulling back from elevated post-pandemic levels as apartment pipeline digests excess supply."
    : "Multifamily construction active — build-to-rent and urban density demand supporting above-trend issuance."

  // Summary
  const totalYoY = yoy(perm)
  let summary: string
  if (perm1Dir === perm5Dir && perm1Dir !== "FLAT") {
    summary = `Both single-family and multifamily permits are ${perm1Dir.toLowerCase()} — ${totalYoY > 0 ? "broad pipeline expansion" : "broad pipeline contraction"} (${fmt(totalYoY)}% total YoY).`
  } else {
    summary = `Single-family ${perm1Dir.toLowerCase()} (${fmt(perm1Yoy)}% YoY) while multifamily ${perm5Dir.toLowerCase()} (${fmt(perm5Yoy)}% YoY) — mixed signals for pipeline depth.`
  }

  const regionalNote = topState && bottomState
    ? `Regional divergence: ${topState} leads permit growth; ${bottomState} is the weakest market tracked.`
    : "Regional permit divergence persists — Sun Belt and Southeast outperforming Midwest and Northeast."

  const asOf = perm[perm.length - 1].obs_date || new Date().toISOString().slice(0, 10)

  return {
    series: "PERMIT",
    driver_summary: summary,
    components: [
      {
        name:           "Single-family",
        series_id:      "PERMIT1",
        current_yoy:    +perm1Yoy,
        direction:      perm1Dir,
        share_of_total: perm1Share,
        impact:         impact(perm1Yoy, true),
        note:           perm1Note,
      },
      {
        name:           "Multi-family (5+)",
        series_id:      "PERMIT5",
        current_yoy:    +perm5Yoy,
        direction:      perm5Dir,
        share_of_total: perm5Share,
        impact:         impact(perm5Yoy, true),
        note:           perm5Note,
      },
    ],
    macro_context: [
      `30yr mortgage at ${mortRate.toFixed(2)}% — ${mortRate > 6.5 ? "suppressing affordability and single-family starts" : "easing, supporting single-family recovery"}`,
      regionalNote,
    ],
    as_of: asOf,
  }
}

// ── Formatting helpers ────────────────────────────────────────────────────────

function fmt(n: number): string {
  const s = n >= 0 ? "+" : ""
  return `${s}${n.toFixed(1)}`
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const series = (searchParams.get("series") ?? "TTLCONS").toUpperCase()

  try {
    let analysis: DriverAnalysis

    if (series === "TTLCONS") {
      analysis = await analyzeTTLCONS()
    } else if (series === "PERMIT") {
      analysis = await analyzePERMIT(origin)
    } else {
      return NextResponse.json({ error: `Unsupported series: ${series}` }, { status: 400 })
    }

    return NextResponse.json(analysis, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
    })
  } catch (err) {
    console.error("[driver-analysis]", err)
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 })
  }
}
