export interface ForecastPoint { base: number; lo80: number; hi80: number; lo95: number; hi95: number }
export interface ModelResult   { model: string; weight: number; mape: number; accuracy: number; forecast: ForecastPoint[] }
export interface ForecastData  {
  ensemble:  ForecastPoint[]
  models:    ModelResult[]
  metrics: {
    accuracy:       number
    mape:           number
    models:         number
    yoy_implied?:   number
    hwWeight?:      number
    sarimaWeight?:  number
    xgboostWeight?: number
    n?:             number
  }
  trainedOn: number
  runAt:     string
  history?:  number[]
}
export interface Signal    { type: string; title: string; description?: string; confidence?: number }
export interface NewsItem  { title: string; summary?: string; source: string; sentiment: string; tags?: string[] }
export interface Commodity { name: string; value: number; mom: number; yoy: number; unit: string; signal: string; trend: string }
export interface StateData { code: string; name: string; permits: number; yoyChange: number; signal?: string }
export interface Tab       { id: string; icon: string; label: string; badge: number | null }
