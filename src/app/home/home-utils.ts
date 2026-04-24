import { color, font, signal as SIG } from "@/lib/theme"

export const SYS  = font.sys
export const MONO = font.mono

export const WHITE = color.t1
export const BG    = color.lightBg
export const BD    = color.lightBd
export const T1    = color.bg1
export const T3    = color.t4
export const GREEN = color.green
export const RED   = color.red
export const AMBER = color.amber
export const BLUE  = color.blue

export async function safeFetch(url: string) {
  try { const r = await fetch(url); return r.ok ? r.json() : null } catch { return null }
}

export function fmtMillions(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}T`
  if (v >= 1_000)     return `$${(v / 1_000).toFixed(0)}B`
  return `$${v.toFixed(0)}M`
}

export function trendColor(v: number): string {
  return v > 0.05 ? SIG.expand : v < -0.05 ? SIG.contract : SIG.watch
}

export function verdictFor(
  mom: number,
  posLabel: string,
  negLabel: string,
): { label: string; col: string } {
  if (mom >  0.15) return { label: posLabel, col: SIG.expand   }
  if (mom < -0.15) return { label: negLabel, col: SIG.contract }
  return                   { label: 'WATCH', col: SIG.watch    }
}

export function blsSeries(
  raw: Record<string, unknown> | null,
  id:  string,
): { seriesID: string; data: Array<{ value: string }> } | undefined {
  const series = (raw as {
    data?: {
      Results?: {
        series?: Array<{ seriesID: string; data: Array<{ value: string }> }>
      }
    }
  } | null)?.data?.Results?.series ?? []
  return series.find(s => s.seriesID === id)
}

export interface Card {
  label:   string
  verdict: string | null
  col:     string
  metric:  string
  sub:     string
}

export interface PlatformStats {
  cities_tracked?:     number
  msas_tracked?:       number
  data_sources?:       number
  observations_label?: string
}

export interface VerdictData {
  overall:    string
  confidence: string
  headline:   string
}
