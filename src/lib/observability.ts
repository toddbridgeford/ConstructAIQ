import * as Sentry from '@sentry/nextjs'

/**
 * Stable logging scopes for production-critical routes / libs.
 * Any string is accepted; this list documents the canonical set.
 */
export type ApiScope =
  | 'dashboard'
  | 'federal'
  | 'weeklyBrief'
  | 'status'
  | 'pricewatch'
  | 'forecast'
  | 'cshi'
  | (string & {})

const SECRET_KEY_RE = /(api[_-]?key|secret|token|password|authorization|bearer|service[_-]?role|dsn|sentry|anthropic|cookie|session)/i
const SECRET_VALUE_PREFIX_RE = /^(sk-[A-Za-z0-9_-]{4,}|sk_live_|pk_live_|Bearer\s+|eyJ[A-Za-z0-9_-]+\.)/

/**
 * Recursively redact obvious secret-like fields from a context object.
 * Used so callers can pass structured error context without worrying about
 * accidentally leaking an API key into logs or Sentry.
 *
 * Rules:
 *  - Keys matching SECRET_KEY_RE are replaced with '[redacted]'
 *  - String values starting with sk-/eyJ/Bearer/etc are redacted
 *  - Nested plain objects are walked recursively
 *  - Arrays, primitives, Errors are passed through unchanged (Errors are
 *    converted to their .message so stack frames don't leak local paths)
 */
export function redactContext(
  context?: Record<string, unknown>,
): Record<string, unknown> | undefined {
  if (!context) return undefined
  return walk(context, 0) as Record<string, unknown>
}

function walk(v: unknown, depth: number): unknown {
  if (depth > 5) return '[truncated]'
  if (v === null || v === undefined) return v
  if (v instanceof Error) return v.message
  if (typeof v === 'string') {
    return SECRET_VALUE_PREFIX_RE.test(v) ? '[redacted]' : v
  }
  if (typeof v !== 'object') return v
  if (Array.isArray(v)) return v.map((item) => walk(item, depth + 1))

  const out: Record<string, unknown> = {}
  for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
    if (SECRET_KEY_RE.test(k)) {
      out[k] = '[redacted]'
      continue
    }
    out[k] = walk(val, depth + 1)
  }
  return out
}

/**
 * Log an API-route-or-lib-level error with a stable scope prefix and forward
 * to Sentry when configured. Errors here are best-effort: this function never
 * throws, so callers can call it inside catch blocks without a guard.
 *
 * Reserve for actual exception conditions (live fetch total failure, Claude
 * call failure, Supabase connection failure). Do NOT call from expected
 * empty states or user-input validation paths — those should use logApiWarn
 * or no logging at all.
 */
export function logApiError(
  scope: ApiScope,
  err: unknown,
  context?: Record<string, unknown>,
): void {
  try {
    const safe = redactContext(context)
    const msg  = err instanceof Error ? err.message : String(err)
    if (safe) {
      console.error(`[${scope}]`, msg, safe)
    } else {
      console.error(`[${scope}]`, msg)
    }
    try {
      Sentry.withScope((s) => {
        s.setTag('api_scope', String(scope))
        if (safe) s.setContext('api_context', safe as Record<string, unknown>)
        Sentry.captureException(err instanceof Error ? err : new Error(msg))
      })
    } catch {
      // Sentry SDK errors must never propagate out of the API path.
    }
  } catch {
    // Even console.error theoretically can throw on exotic environments.
  }
}

/**
 * Log a non-exception warning with a stable scope prefix. Does NOT forward to
 * Sentry — use this for expected fallback paths, single-source upstream
 * misses, fire-and-forget cache write failures, etc.
 */
export function logApiWarn(
  scope: ApiScope,
  message: string,
  context?: Record<string, unknown>,
): void {
  try {
    const safe = redactContext(context)
    if (safe) {
      console.warn(`[${scope}]`, message, safe)
    } else {
      console.warn(`[${scope}]`, message)
    }
  } catch {
    // never throw from observability
  }
}
