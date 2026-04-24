// Runtime normalizer for /api/dashboard responses.
// Accepts unknown API JSON and returns a type-safe DashboardData with safe
// defaults for every nullable/missing field — so the dashboard can never
// crash due to API shape drift.
//
// No external dependencies — this runs in the browser Edge and Node contexts.

import type {
  DashboardData,
  DashboardKPI,
  DashboardCshi,
  DashboardForecast,
  DashboardObs,
  SignalItem,
  CommodityItem,
} from './api-types'

// ── primitive coercions ───────────────────────────────────────────────────────

function asStr(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback
}

function asNum(v: unknown, fallback = 0): number {
  const n = Number(v)
  return isFinite(n) ? n : fallback
}

function asNumOrNull(v: unknown): number | null {
  if (v === null || v === undefined) return null
  const n = Number(v)
  return isFinite(n) ? n : null
}

function asStrOrNull(v: unknown): string | null {
  return typeof v === 'string' ? v : null
}

function asArr<T>(v: unknown, mapper: (item: unknown) => T): T[] {
  return Array.isArray(v) ? v.map(mapper) : []
}

function asObj(v: unknown): Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : {}
}

// ── field normalizers ─────────────────────────────────────────────────────────

function normalizeKpi(raw: unknown): DashboardKPI {
  const r = asObj(raw)
  return {
    value:      asNumOrNull(r.value),
    mom_change: asNumOrNull(r.mom_change),
    data_as_of: asStrOrNull(r.data_as_of),
    spark:      asArr(r.spark, asNum),
  }
}

function normalizeCshi(raw: unknown): DashboardCshi | null {
  if (raw === null || raw === undefined) return null
  const r = asObj(raw)
  if (!Object.keys(r).length) return null

  const rawSub = asObj(r.subScores)
  const subScores: DashboardCshi['subScores'] = {}
  for (const key of Object.keys(rawSub)) {
    const sub = asObj(rawSub[key])
    subScores[key] = { score: asNum(sub.score), weight: asNum(sub.weight), label: asStr(sub.label) }
  }

  return {
    score:          asNum(r.score),
    classification: asStr(r.classification, 'NEUTRAL'),
    classColor:     asStr(r.classColor, '#f5a623'),
    weeklyChange:   asNum(r.weeklyChange),
    subScores,
    history: asArr(r.history, item => {
      const h = asObj(item)
      return { week: asStr(h.week), score: asNum(h.score), classification: asStr(h.classification) }
    }),
    momentumLine: asArr(r.momentumLine, item => {
      const m = asObj(item)
      return { week: asStr(m.week), momentum: asNum(m.momentum) }
    }),
    updatedAt: asStr(r.updatedAt),
  }
}

function normalizeForecast(raw: unknown): DashboardForecast | null {
  if (raw === null || raw === undefined) return null
  const r = asObj(raw)
  if (!Object.keys(r).length) return null

  const metrics = asObj(r.metrics)

  return {
    ensemble: asArr(r.ensemble, item => {
      const o = asObj(item)
      return { base: asNum(o.base), lo80: asNum(o.lo80), hi80: asNum(o.hi80), lo95: asNum(o.lo95), hi95: asNum(o.hi95) }
    }),
    models: asArr(r.models, item => {
      const o = asObj(item)
      return { model: asStr(o.model), weight: asNum(o.weight), mape: asNum(o.mape), accuracy: asNum(o.accuracy) }
    }),
    metrics: {
      accuracy: asNum(metrics.accuracy),
      mape:     asNum(metrics.mape),
      models:   asNum(metrics.models),
    },
    history:    asArr(r.history, asNum),
    run_at:     asStr(r.run_at, new Date().toISOString()),
    trained_on: asNum(r.trained_on),
  }
}

function normalizeObsRow(item: unknown): { date: string; value: number } {
  const o = asObj(item)
  return { date: asStr(o.date), value: asNum(o.value) }
}

function normalizeObs(raw: unknown): DashboardObs {
  const r = asObj(raw)
  return {
    TTLCONS_12:       asArr(r.TTLCONS_12,       normalizeObsRow),
    CES2000000001_12: asArr(r.CES2000000001_12, normalizeObsRow),
    PERMIT_12:        asArr(r.PERMIT_12,         normalizeObsRow),
    TTLCONS_24:       asArr(r.TTLCONS_24,        normalizeObsRow),
    WPS081_24:        asArr(r.WPS081_24,         normalizeObsRow),
  }
}

function normalizeSignal(item: unknown): SignalItem {
  const o = asObj(item)
  return {
    type:            asStr(o.type),
    series_id:       asStrOrNull(o.series_id)       ?? undefined,
    title:           asStr(o.title),
    description:     asStr(o.description),
    confidence:      asNum(o.confidence),
    method:          asStrOrNull(o.method)          ?? undefined,
    value_at_signal: asNumOrNull(o.value_at_signal) ?? undefined,
    threshold:       asNumOrNull(o.threshold)       ?? undefined,
    is_active:       typeof o.is_active === 'boolean' ? o.is_active : undefined,
  }
}

function normalizeCommodity(item: unknown): CommodityItem {
  const o   = asObj(item)
  const sig = asStr(o.signal)
  return {
    name:   asStr(o.name),
    value:  asNum(o.value),
    unit:   asStr(o.unit),
    signal: sig === 'BUY' || sig === 'SELL' || sig === 'HOLD' ? sig : 'HOLD',
    mom:    asNumOrNull(o.mom) ?? undefined,
  }
}

// ── public API ────────────────────────────────────────────────────────────────

/**
 * Validate and normalise a raw /api/dashboard payload.
 * Returns null only if the input is not an object (null, primitive, array).
 * All missing or malformed nested fields receive safe defaults so the
 * dashboard can render without throwing.
 */
export function normalizeDashboardData(input: unknown): DashboardData | null {
  if (input === null || input === undefined) return null
  if (typeof input !== 'object' || Array.isArray(input)) return null

  const raw = input as Record<string, unknown>

  return {
    construction_spending: normalizeKpi(raw.construction_spending),
    employment:            normalizeKpi(raw.employment),
    permits:               normalizeKpi(raw.permits),
    cshi:                  normalizeCshi(raw.cshi),
    forecast:              normalizeForecast(raw.forecast),
    signals:               asArr(raw.signals, normalizeSignal),
    commodities:           asArr(raw.commodities, normalizeCommodity),
    brief_excerpt:         asStrOrNull(raw.brief_excerpt),
    brief_as_of:           asStrOrNull(raw.brief_as_of),
    obs:                   normalizeObs(raw.obs),
    fetched_at:            asStr(raw.fetched_at, new Date().toISOString()),
  }
}
