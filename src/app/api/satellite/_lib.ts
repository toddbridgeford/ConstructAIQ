import { Redis } from '@upstash/redis'

export type Classification =
  | 'DEMAND_DRIVEN'
  | 'RECONSTRUCTION'
  | 'FEDERAL_INVESTMENT'
  | 'ORGANIC_GROWTH'
  | 'LOW_ACTIVITY'
  | 'INSUFFICIENT_DATA'

export function classifyActivity(
  bsiChange90d: number | null,
  federalAwards = 0,
  stormEvents = 0,
): Classification {
  if (bsiChange90d === null) return 'INSUFFICIENT_DATA'
  if (Math.abs(bsiChange90d) < 5) return 'LOW_ACTIVITY'
  if (stormEvents > 0 && bsiChange90d > 10) return 'RECONSTRUCTION'
  if (federalAwards > 100 && bsiChange90d > 10) return 'FEDERAL_INVESTMENT'
  if (bsiChange90d > 15) return 'DEMAND_DRIVEN'
  if (bsiChange90d > 5) return 'ORGANIC_GROWTH'
  return 'LOW_ACTIVITY'
}

export const FALSE_POSITIVE_EXPLANATIONS: Record<string, string> = {
  desert:       'Arid terrain produces elevated baseline BSI — naturally high bare soil',
  beach:        'Coastal sand/beach elevates BSI unrelated to construction',
  dry_lake:     'Dry lake bed or playa terrain elevates BSI',
  agricultural: 'Agricultural fields appear as bare soil during fallow/tilled periods',
  fire_scar:    'Recent fire perimeter — burned area may register as bare soil',
  storm:        'Recent storm event — possible reconstruction rather than new construction',
}

// ── Redis cache (optional — skipped gracefully when Upstash is not configured) ──

let _redis: Redis | null | undefined = undefined

function getRedis(): Redis | null {
  if (_redis !== undefined) return _redis
  const url   = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  _redis = url && token ? new Redis({ url, token }) : null
  return _redis
}

const CACHE_TTL_SECONDS = 6 * 60 * 60 // 6 hours

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const r = getRedis()
    if (!r) return null
    return await r.get<T>(key)
  } catch {
    return null
  }
}

export async function cacheSet(key: string, value: unknown): Promise<void> {
  try {
    const r = getRedis()
    if (!r) return
    await r.set(key, value, { ex: CACHE_TTL_SECONDS })
  } catch {
    // non-fatal — fall through to uncached response
  }
}
