import { NextRequest, NextResponse } from 'next/server'
import { validateApiKey } from '@/lib/auth'
import { checkRateLimit, incrementUsage } from '@/lib/ratelimit'

// Middleware runs in Edge Runtime — no `export const runtime` needed.

const PUBLIC_PATHS = new Set(['/api/status', '/api/subscribe', '/api/keys/issue', '/api/widget-data'])

// ── Pre-launch site lockdown ──────────────────────────────────────────────────
// Set SITE_LOCKED=true in Vercel env vars to password-protect all pages.
// Remove or set to false to go public.
const SITE_LOCKED = process.env.SITE_LOCKED === 'true'
const SITE_USER   = process.env.SITE_USER ?? 'admin'
const SITE_PASS   = process.env.SITE_PASS ?? ''

function isAuthorized(req: NextRequest): boolean {
  const header = req.headers.get('authorization') ?? ''
  if (!header.startsWith('Basic ')) return false
  try {
    const decoded = atob(header.slice(6))
    const colon   = decoded.indexOf(':')
    if (colon === -1) return false
    const user = decoded.slice(0, colon)
    const pass = decoded.slice(colon + 1)
    return user === SITE_USER && pass === SITE_PASS && SITE_PASS !== ''
  } catch {
    return false
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Enforce basic auth on all page routes when site is locked
  if (SITE_LOCKED && !pathname.startsWith('/api/')) {
    if (!isAuthorized(req)) {
      return new NextResponse('Authentication required', {
        status: 401,
        headers: { 'WWW-Authenticate': 'Basic realm="ConstructAIQ — Coming Soon"' },
      })
    }
  }

  if (!pathname.startsWith('/api/') || PUBLIC_PATHS.has(pathname)) {
    return NextResponse.next()
  }

  const key = req.headers.get('x-api-key')

  // No key → dashboard/public access (product is intentionally open)
  if (key === null) {
    return NextResponse.next()
  }

  if (!key.startsWith('caiq_')) {
    return NextResponse.json({ error: 'Invalid API key format' }, { status: 401 })
  }

  const keyInfo = await validateApiKey(key)

  if (!keyInfo.valid) {
    return NextResponse.json({ error: keyInfo.error ?? 'Unauthorized' }, { status: 401 })
  }

  const rpm = keyInfo.rpm_limit ?? 60
  const rpd = keyInfo.rpd_limit ?? 1000
  const rl  = await checkRateLimit(keyInfo.key_hash!, rpm, rpd)

  if (!rl.allowed) {
    const retryAfter = rl.reset ? Math.ceil((rl.reset - Date.now()) / 1000) : 60
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      {
        status: 429,
        headers: {
          'Retry-After':          String(retryAfter),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset':     String(rl.reset ?? ''),
        },
      }
    )
  }

  // Fire-and-forget usage increment — never blocks the request
  incrementUsage(keyInfo.key_hash!).catch(() => undefined)

  const res = NextResponse.next()
  res.headers.set('x-key-plan', keyInfo.plan ?? '')
  res.headers.set('x-key-hash', keyInfo.key_hash!)
  return res
}

export const config = { matcher: '/api/:path*' }
