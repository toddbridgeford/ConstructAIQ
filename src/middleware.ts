import { NextRequest, NextResponse } from 'next/server'

// These routes never require a key — public by design
const PUBLIC_PATHS = new Set(['/api/status', '/api/subscribe', '/api/keys/issue'])

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (!pathname.startsWith('/api/') || PUBLIC_PATHS.has(pathname)) {
    return NextResponse.next()
  }

  const key = req.headers.get('x-api-key')

  // Key provided: validate its format before it reaches the route handler.
  // Full DB validation (rate limits, active flag) happens inside each route via /api/keys/issue?key=.
  // Unauthenticated requests are still allowed for dashboard-origin compatibility.
  // TODO: enforce key requirement once the dashboard passes x-api-key on all fetches.
  if (key !== null && !key.startsWith('caiq_')) {
    return NextResponse.json({ error: 'Invalid API key format' }, { status: 401 })
  }

  return NextResponse.next()
}

export const config = { matcher: '/api/:path*' }
