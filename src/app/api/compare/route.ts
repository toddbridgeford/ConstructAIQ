import { NextResponse } from "next/server"

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const base = url.origin

  const [res, com, inf, ind] = await Promise.all([
    fetch(`${base}/api/sector/residential`,   { cache: 'no-store' }).then(r => r.json()),
    fetch(`${base}/api/sector/commercial`,    { cache: 'no-store' }).then(r => r.json()),
    fetch(`${base}/api/sector/infrastructure`,{ cache: 'no-store' }).then(r => r.json()),
    fetch(`${base}/api/sector/industrial`,    { cache: 'no-store' }).then(r => r.json()),
  ])

  return NextResponse.json({
    sectors: [res, com, inf, ind],
  }, {
    headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200" },
  })
}
