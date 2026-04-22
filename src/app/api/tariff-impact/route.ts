import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// ── Elasticity parameters from peer-reviewed literature ──────────────────────
// Each: icpi_per_pct (% ICPI increase per 1% tariff)
//       starts_res_per_pct (% residential starts change per 1% tariff)
//       starts_nonres_per_pct (% nonresidential starts change per 1% tariff)
const ELASTICITIES = {
  lumber: {
    icpi_per_pct:          0.35,
    starts_res_per_pct:   -0.25,
    starts_nonres_per_pct: -0.04,
    cite: 'NAHB (2021) "Impact of Lumber Tariffs on Housing"; Mayer & Somerville (2000)',
  },
  steel: {
    icpi_per_pct:          0.22,
    starts_res_per_pct:   -0.05,
    starts_nonres_per_pct: -0.08,
    cite: 'BLS PPI steel weight in construction; Congressional Budget Office (2019)',
  },
  aluminum: {
    icpi_per_pct:          0.08,
    starts_res_per_pct:   -0.02,
    starts_nonres_per_pct: -0.03,
    cite: 'BLS PPI aluminum weight in construction methodology',
  },
}

// ── Current baseline tariff levels (effective as of 2025) ────────────────────
const CURRENT_TARIFFS = { lumber: 14.5, steel: 25.0, aluminum: 10.0 }

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)

  const lumberTariff   = clamp(parseFloat(searchParams.get('lumber')   ?? String(CURRENT_TARIFFS.lumber)),   0, 100)
  const steelTariff    = clamp(parseFloat(searchParams.get('steel')    ?? String(CURRENT_TARIFFS.steel)),    0, 100)
  const aluminumTariff = clamp(parseFloat(searchParams.get('aluminum') ?? String(CURRENT_TARIFFS.aluminum)), 0, 100)

  function compute(lT: number, sT: number, aT: number) {
    const icpi =
      lT * ELASTICITIES.lumber.icpi_per_pct +
      sT * ELASTICITIES.steel.icpi_per_pct  +
      aT * ELASTICITIES.aluminum.icpi_per_pct

    const resStarts =
      lT * ELASTICITIES.lumber.starts_res_per_pct +
      sT * ELASTICITIES.steel.starts_res_per_pct  +
      aT * ELASTICITIES.aluminum.starts_res_per_pct

    const nonresStarts =
      lT * ELASTICITIES.lumber.starts_nonres_per_pct +
      sT * ELASTICITIES.steel.starts_nonres_per_pct  +
      aT * ELASTICITIES.aluminum.starts_nonres_per_pct

    return { icpi, resStarts, nonresStarts }
  }

  // vs. zero-tariff world
  const vz = compute(lumberTariff, steelTariff, aluminumTariff)

  // vs. current baseline tariff levels
  const curr  = compute(CURRENT_TARIFFS.lumber, CURRENT_TARIFFS.steel, CURRENT_TARIFFS.aluminum)
  const delta = {
    icpi:      vz.icpi - curr.icpi,
    resStarts: vz.resStarts - curr.resStarts,
    nonresStarts: vz.nonresStarts - curr.nonresStarts,
  }

  return NextResponse.json({
    assumptions: {
      lumber_tariff:   lumberTariff,
      steel_tariff:    steelTariff,
      aluminum_tariff: aluminumTariff,
    },
    vs_zero_tariff: {
      icpi_increase_pct:              parseFloat(vz.icpi.toFixed(2)),
      residential_starts_impact_pct:  parseFloat(vz.resStarts.toFixed(2)),
      nonresidential_starts_impact_pct: parseFloat(vz.nonresStarts.toFixed(2)),
      cost_per_million_additional:    Math.round(vz.icpi * 10_000),
    },
    vs_current_tariffs: {
      baseline: CURRENT_TARIFFS,
      icpi_change_pct:      parseFloat(delta.icpi.toFixed(2)),
      res_starts_change_pct: parseFloat(delta.resStarts.toFixed(2)),
      nonres_starts_change_pct: parseFloat(delta.nonresStarts.toFixed(2)),
    },
    elasticities_used: [
      { input: 'lumber',   cite: ELASTICITIES.lumber.cite },
      { input: 'steel',    cite: ELASTICITIES.steel.cite  },
      { input: 'aluminum', cite: ELASTICITIES.aluminum.cite },
    ],
    disclaimer: 'Illustrative scenario only. Based on historical elasticities which may not reflect current supply chain conditions or tariff phase-ins.',
    as_of: new Date().toISOString().slice(0, 10),
  }, { headers: { 'Cache-Control': 'public, s-maxage=60' } })
}
