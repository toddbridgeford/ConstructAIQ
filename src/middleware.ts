import { NextRequest, NextResponse } from 'next/server'
import { validateApiKey } from '@/lib/auth'
import { checkRateLimit, incrementUsage } from '@/lib/ratelimit'

// Middleware runs in Edge Runtime — no `export const runtime` needed.

const PUBLIC_PATHS = new Set(['/api/status', '/api/subscribe', '/api/keys/issue'])

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

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
