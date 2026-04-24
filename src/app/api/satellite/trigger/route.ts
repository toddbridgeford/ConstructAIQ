import { NextResponse } from 'next/server'

export const maxDuration = 10

export const runtime = 'nodejs'

function cronSecret() { return process.env.CRON_SECRET || '' }

export async function POST(request: Request) {
  const auth = request.headers.get('authorization')
  if (cronSecret() && auth !== `Bearer ${cronSecret()}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const token = process.env.GITHUB_TOKEN
  if (!token) {
    return NextResponse.json({ error: 'GITHUB_TOKEN not configured' }, { status: 500 })
  }

  const r = await fetch(
    'https://api.github.com/repos/toddbridgeford/ConstructAIQ/actions/workflows/satellite.yml/dispatches',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify({ ref: 'main' }),
    }
  )

  if (!r.ok) {
    return NextResponse.json(
      { error: 'Workflow dispatch failed', status: r.status },
      { status: 500 },
    )
  }

  return NextResponse.json({
    ok: true,
    message: 'Satellite pipeline triggered. Results available in ~20 minutes.',
  })
}
