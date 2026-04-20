import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL  || ''
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const SVC_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Guard createClient calls so module-level evaluation during Next.js
// build (when env vars aren't injected) doesn't throw "supabaseUrl is required".
// At runtime in production the URL is always present.
function makeClient(url: string, key: string, opts?: Parameters<typeof createClient>[2]): SupabaseClient {
  if (!url) return null as unknown as SupabaseClient
  return createClient(url, key, opts)
}

/** Public client — read-only dashboard queries */
export const supabase = makeClient(SUPA_URL, ANON_KEY)

/** Service-role client — write access for cron jobs */
export const supabaseAdmin = makeClient(SUPA_URL, SVC_KEY || ANON_KEY, {
  auth: { persistSession: false },
})

/* ── Typed helpers ─────────────────────────────────────────── */

export interface Observation {
  series_id:       string
  obs_date:        string
  value:           number
  is_revised?:     boolean
  is_preliminary?: boolean
  source_tag?:     string
}

export interface ForecastRow {
  series_id:      string
  model:          string
  run_date:       string
  horizon_month:  string
  horizon_steps:  number
  base_value:     number
  lo80:           number
  hi80:           number
  lo95:           number
  hi95:           number
  mape?:          number
  accuracy?:      number
  alpha?:         number
  beta?:          number
  phi?:           number
  training_n?:    number
  weight?:        number
}

export interface Signal {
  type:            string
  series_id?:      string
  title:           string
  description?:    string
  confidence?:     number
  method?:         string
  value_at_signal?: number
  threshold?: number
}

/** Upsert multiple observations in one call */
export async function upsertObservations(rows: Observation[]) {
  if (!rows.length) return { error: null }
  return supabaseAdmin
    .from('observations')
    .upsert(rows, { onConflict: 'series_id,obs_date' })
}

/** Upsert multiple forecasts in one call */
export async function upsertForecasts(rows: ForecastRow[]) {
  if (!rows.length) return { error: null }
  return supabaseAdmin
    .from('forecasts')
    .upsert(rows, { onConflict: 'series_id,model,run_date,horizon_month' })
}

/** Insert a signal */
export async function insertSignal(sig: Signal) {
  return supabaseAdmin.from('signals').insert(sig)
}

/** Update series last_updated timestamp */
export async function touchSeries(id: string, dataEnd?: string) {
  return supabaseAdmin
    .from('series')
    .update({ last_updated: new Date().toISOString(), ...(dataEnd ? { data_end: dataEnd } : {}) })
    .eq('id', id)
}

/** Get latest N observations for a series */
export async function getLatestObs(seriesId: string, n = 60) {
  const { data } = await supabase
    .from('observations')
    .select('obs_date, value')
    .eq('series_id', seriesId)
    .order('obs_date', { ascending: false })
    .limit(n)
  return data ? data.reverse() : []
}

/** Get latest forecasts for a series */
export async function getLatestForecasts(seriesId: string, model = 'ensemble') {
  const { data } = await supabase
    .from('forecasts')
    .select('*')
    .eq('series_id', seriesId)
    .eq('model', model)
    .order('run_date', { ascending: false })
    .order('horizon_steps', { ascending: true })
    .limit(12)
  return data || []
}
