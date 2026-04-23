// Typed interfaces for every API response consumed by the dashboard.
// Derived from the actual route handlers in src/app/api/.

// ── /api/cshi ─────────────────────────────────────────────────────────────────

export interface CshiSubScore {
  score:  number
  weight: number
  label:  string
}

export type CshiClassification = 'EXPANDING' | 'NEUTRAL' | 'SLOWING' | 'CONTRACTING'

export interface CshiHistoryPoint {
  week:           string
  score:          number
  classification: string
}

export interface CshiResponse {
  score:          number
  classification: CshiClassification
  classColor:     string
  weeklyChange:   number
  subScores: {
    spendGrowth:           CshiSubScore
    permitVelocity:        CshiSubScore
    employmentMomentum:    CshiSubScore
    materialsCostPressure: CshiSubScore
    regionalMomentum:      CshiSubScore
    federalAwardPace:      CshiSubScore
  }
  history:      CshiHistoryPoint[]
  momentumLine: { week: string; momentum: number }[]
  updatedAt:    string
}

// ── /api/census ───────────────────────────────────────────────────────────────

export interface CensusResponse {
  value?:        number
  latest?:       { value: number; date: string; mom?: number }
  series?:       { date: string; value: number }[]
  observations?: { date: string; value: string }[]
  data_as_of?:   string | null
}

// ── /api/bls ──────────────────────────────────────────────────────────────────

export interface BlsResponse {
  value?:      number
  mom?:        number
  latest?:     { value: number; date: string; mom?: number }
  data_as_of?: string | null
}

// ── /api/signals ──────────────────────────────────────────────────────────────

import type { AnomalyAlert }  from '@/app/dashboard/components/AnomalyFeed'
import type { DivergencePair } from '@/app/dashboard/components/DivergenceDetector'

export interface SignalItem {
  type:             string
  series_id?:       string
  title:            string
  description:      string
  confidence:       number
  method?:          string
  value_at_signal?: number
  threshold?:       number
  is_active?:       boolean
  date?:            string
}

export interface SignalsResponse {
  source:          string
  live:            boolean
  signals:         SignalItem[]
  count:           number
  updated:         string
  generated?:      number
  signals_as_of?:  string | null
  anomalies?:      AnomalyAlert[]
  divergences?:    DivergencePair[]
}

// ── /api/federal ──────────────────────────────────────────────────────────────

export interface FederalProgram {
  name:         string
  authorized:   number
  obligated:    number
  spent:        number
  executionPct: number
  agency:       string
  color:        string
}

export interface FederalAgency {
  name:         string
  obligatedPct: number
  color:        string
}

export interface FederalContractor {
  rank:       number
  name:       string
  awardValue: number
  contracts:  number
  agency:     string
  state:      string
}

export interface FederalMonthlyAward {
  month: string
  value: number
}

export interface FederalStateAllocation {
  state:        string
  allocated:    number
  obligated:    number
  spent:        number
  executionPct: number
  rank:         number
  yoy?:         number
}

export interface FederalResponse {
  programs:         FederalProgram[]
  agencies:         FederalAgency[]
  contractors:      FederalContractor[]
  monthlyAwards:    FederalMonthlyAward[]
  stateAllocations: FederalStateAllocation[]
  solicitations:    unknown[]
  totalAuthorized:  number
  totalObligated:   number
  totalSpent:       number
  dataSource:       string
  fromCache:        boolean
  updatedAt:        string
  error?:           boolean
  cached_at?:       string
  fetchError?:      string
}

// ── /api/pricewatch ───────────────────────────────────────────────────────────

export interface CommodityItem {
  name:       string
  value:      number
  unit:       string
  signal:     'BUY' | 'SELL' | 'HOLD'
  // API fields
  id?:        string
  prevValue?: number
  mom?:       number
  yoy?:       number
  source?:    string
  trend?:     'UP' | 'DOWN' | 'FLAT'
  updated?:   string
  // UI display fields (MaterialsSection fallback data)
  icon?:      string
  mom7d?:     number
  mom30d?:    number
  mom90d?:    number
  sparkData?: number[]
}

export interface PricewatchResponse {
  source:         string
  live:           boolean
  commodities:    CommodityItem[]
  compositeIndex: {
    avgMoM:      number
    signal:      'BUY' | 'SELL' | 'HOLD'
    description: string
  }
  updated:        string | null
}

// ── /api/weekly-brief ─────────────────────────────────────────────────────────
// Fields match WeeklyBrief component props exactly (spread as {...brief}).

export interface BriefResponse {
  brief?:       string
  generatedAt?: string
  source?:      'ai' | 'static'
}

// ── /api/warn ─────────────────────────────────────────────────────────────────
// WarnData and WarnNotice are already typed in src/app/api/warn/route.ts.
// Re-export them here so components can import from a single place.

export type { WarnData, WarnNotice } from '@/app/api/warn/route'

// ── Pipeline section (internal or /api/pipeline) ──────────────────────────────
// Re-use the types already exported by the child components.

import type { PipelineStage }       from '@/app/dashboard/components/PipelineTimeline'
import type { CascadeAlert }         from '@/app/dashboard/components/CascadeAlerts'
import type { CycleComparisonProps } from '@/app/dashboard/components/CycleComparison'

export type { PipelineStage, CascadeAlert }

export interface PipelineResponse {
  stages?:          PipelineStage[]
  alerts?:          CascadeAlert[]
  cycleComparison?: CycleComparisonProps
}

// ── Equities section (internal or /api/equities) ─────────────────────────────

import type { ETFData }         from '@/app/dashboard/components/ETFMonitor'
import type { EarningsCompany } from '@/app/dashboard/components/EarningsCards'
import type { SubsectorPoint }  from '@/app/dashboard/components/SectorRotation'

export interface SectorHistoryPoint {
  date:               string
  constructionIndex:  number
  sp500Index:         number
}

export type { ETFData, EarningsCompany, SubsectorPoint }

export interface EquitiesResponse {
  sectorHistory?:  SectorHistoryPoint[]
  etfs?:           ETFData[]
  companies?:      EarningsCompany[]
  sectorRotation?: SubsectorPoint[]
}

// ── /api/dashboard — aggregated dashboard payload ─────────────────────────────

export interface DashboardKPI {
  value:      number | null
  mom_change: number | null
  data_as_of: string | null
  spark?:     number[]
}

export interface DashboardCshi {
  score:          number
  classification: string
  classColor:     string
  weeklyChange:   number
  subScores:      Record<string, { score: number; weight: number; label: string }>
  history:        { week: string; score: number; classification: string }[]
  momentumLine:   { week: string; momentum: number }[]
  updatedAt:      string
}

export interface DashboardForecast {
  ensemble:   { base: number; lo80: number; hi80: number; lo95: number; hi95: number }[]
  models:     { model: string; weight: number; mape: number; accuracy: number }[]
  metrics:    { accuracy: number; mape: number; models: number }
  history:    number[]
  run_at:     string
  trained_on: number
}

export interface DashboardObs {
  TTLCONS_12:       { date: string; value: number }[]
  CES2000000001_12: { date: string; value: number }[]
  PERMIT_12:        { date: string; value: number }[]
  TTLCONS_24:       { date: string; value: number }[]
  WPS081_24:        { date: string; value: number }[]
}

export interface DashboardData {
  construction_spending: DashboardKPI
  employment:            DashboardKPI
  permits:               DashboardKPI
  cshi:                  DashboardCshi
  forecast:              DashboardForecast | null
  signals:               SignalItem[]
  commodities:           CommodityItem[]
  brief_excerpt:         string | null
  brief_as_of:           string | null
  obs:                   DashboardObs
  fetched_at:            string
}
