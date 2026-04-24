import { NextResponse }             from "next/server"
import { supabaseAdmin, getLatestObs } from "@/lib/supabase"
import { sendWeeklySignal }           from "@/lib/email"
import { writeSourceHealth }          from "@/lib/sourceHealth"

export const runtime     = "nodejs"
export const dynamic     = "force-dynamic"
export const maxDuration = 10

const PAGE = 20

type Obs = { obs_date: string; value: number }

function momPct(obs: Obs[]): number {
  const last = obs[obs.length - 1]?.value ?? 0
  const prev = obs[obs.length - 2]?.value ?? 0
  return prev > 0 ? ((last - prev) / prev) * 100 : 0
}

export async function GET(request: Request) {
  const auth = (request.headers.get("authorization") ?? "").replace("Bearer ", "")
  if (!auth || auth !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const start = Date.now()
  let sent = 0
  let failed = 0

  try {
    const { searchParams, origin } = new URL(request.url)
    const batch = Math.max(0, parseInt(searchParams.get("batch") ?? "0"))

    // 1. Latest weekly brief
    let brief = ""
    try {
      const { data } = await supabaseAdmin
        .from("weekly_briefs")
        .select("brief_text")
        .order("generated_at", { ascending: false })
        .limit(1)
        .single()
      if (data) brief = data.brief_text as string
    } catch { /* no brief in DB — leave empty */ }

    // 2. Market observations from Supabase
    const [spendObs, permitObs, employObs] = await Promise.all([
      getLatestObs("TTLCONS",       3) as Promise<Obs[]>,
      getLatestObs("PERMIT",        3) as Promise<Obs[]>,
      getLatestObs("CES2000000001", 3) as Promise<Obs[]>,
    ])

    const spendVal  = spendObs[spendObs.length - 1]?.value   ?? 0
    const permitVal = permitObs[permitObs.length - 1]?.value  ?? 0
    const employVal = employObs[employObs.length - 1]?.value  ?? 0
    const spendMom  = momPct(spendObs as Obs[])
    const permitMom = momPct(permitObs as Obs[])
    const employMom = momPct(employObs as Obs[])

    // 3. Top signal from /api/signals
    let topSignal = "No anomaly signals this week."
    try {
      const res = await fetch(`${origin}/api/signals`, { signal: AbortSignal.timeout(8_000) })
      if (res.ok) {
        const d = await res.json()
        const first = Array.isArray(d) ? d[0] : (d?.signals?.[0] ?? null)
        if (first?.description) topSignal = first.description
        else if (first?.title)  topSignal = first.title
      }
    } catch { /* leave default */ }

    // 4. Market verdict
    let verdictText: string                      = "Market conditions remain mixed."
    let verdictType: "EXPAND" | "HOLD" | "CONTRACT" = "HOLD"
    try {
      const res = await fetch(`${origin}/api/verdict`, { signal: AbortSignal.timeout(8_000) })
      if (res.ok) {
        const d = await res.json()
        if (d?.overall)  verdictType = d.overall  as typeof verdictType
        if (d?.headline) verdictText = d.headline as string
      }
    } catch { /* leave default */ }

    // 5. Week label
    const weekOf = new Date().toLocaleDateString("en-US", {
      month: "long", day: "numeric", year: "numeric",
    })

    // 6. Subscriber batch (fetch PAGE+1 to detect if more exist)
    const from = batch * PAGE
    const to   = from + PAGE          // inclusive — gives PAGE+1 rows
    const { data: rows, error: subErr } = await supabaseAdmin
      .from("subscribers")
      .select("email")
      .eq("confirmed", true)
      .is("unsubscribed_at", null)
      .range(from, to)

    if (subErr) {
      return NextResponse.json(
        { error: "Failed to fetch subscribers", details: subErr.message },
        { status: 500 },
      )
    }

    const all       = rows ?? []
    const toProcess = all.slice(0, PAGE)
    const hasMore   = all.length > PAGE

    // 7. Send emails — max 10/sec (100 ms sleep after each 10)
    for (let i = 0; i < toProcess.length; i++) {
      const email = toProcess[i].email as string

      const result = await sendWeeklySignal({
        to: email,
        brief,
        spendVal,
        spendMom,
        permitVal,
        permitMom,
        employVal,
        employMom,
        topSignal,
        verdictText,
        verdictType,
        weekOf,
      })

      if (result.ok) {
        sent++
      } else {
        failed++
        console.error(`[newsletter] Failed for ${email}:`, result.error)
      }

      // Rate limit: pause 1 s after every 10 sends
      if ((i + 1) % 10 === 0 && i < toProcess.length - 1) {
        await new Promise(r => setTimeout(r, 1_000))
      }
    }

    return NextResponse.json({
      sent,
      failed,
      skipped:   0,
      batch,
      nextBatch: hasMore ? batch + 1 : null,
    })
  } finally {
    await writeSourceHealth({
      source_id:              'newsletter_send',
      source_label:           'Newsletter — The Signal',
      category:               'ai',
      status:                 failed > 0 ? 'warn' : 'ok',
      rows_written:           sent,
      duration_ms:            Date.now() - start,
      expected_cadence_hours: 168,
    })
  }
}
