import { NextResponse } from 'next/server'

export const maxDuration = 10

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// PUBLIC lightweight endpoint for embeddable widgets.
// Cache TTL: 4 hours (14400 seconds)
//
// NOTE: This endpoint is public and does not require authentication.
// Add "src/app/api/widget-data" to the PUBLIC_PATHS set in middleware.ts
// alongside any other unauthenticated routes (e.g. /api/cshi, /api/status).

export async function GET() {
  try {
    const now = new Date().toISOString()

    return NextResponse.json(
      {
        cshi: {
          value: 72.4,
          classification: 'EXPANDING',
          change: 1.3,
        },
        topStates: ['TX', 'FL', 'AZ', 'NC', 'TN'],
        materials: [
          { name: 'Lumber',  signal: 'BUY',  change: 2.1  },
          { name: 'Steel',   signal: 'HOLD', change: 0.4  },
          { name: 'Copper',  signal: 'SELL', change: -3.2 },
        ],
        spend: {
          value: '2.2B',
          change: 0.3,
        },
        forecast12mo: 4.2,
        ccci: {
          value: 118.4,
          mom: 1.8,
        },
        updatedAt: now,
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=14400',
        },
      }
    )
  } catch (err) {
    console.error('[/api/widget-data]', err)
    return NextResponse.json({ error: 'Failed to load widget data' }, { status: 500 })
  }
}
