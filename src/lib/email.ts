// Email utility using Resend
// Usage: await sendEmail({ to, subject, html })
// If RESEND_API_KEY is not set, logs to console (dev mode)
import { Resend } from "resend"

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
const FROM = "ConstructAIQ <noreply@constructaiq.trade>"
const BASE = "https://constructaiq.trade"

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  if (!resend) {
    console.log("[email] DEV MODE — would send:", { to, subject })
    return { ok: true }
  }
  try {
    const { data, error } = await resend.emails.send({ from: FROM, to, subject, html })
    if (error) throw error
    return { ok: true, id: data?.id }
  } catch (err) {
    console.error("[email] Failed to send:", err)
    return { ok: false, error: err }
  }
}

export function emailHtml(body: string): string {
  return `<!DOCTYPE html><html><body style="background:#000;color:#fff;font-family:-apple-system,sans-serif;padding:40px 24px;max-width:600px;margin:0 auto">${body}</body></html>`
}

// ─── Survey invitation ─────────────────────────────────────────────────────────

interface SurveyInvitationParams {
  to: string
  quarter: string         // 'Q2 2025'
  closes_at: string       // ISO date string
  respondent_count: number
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "long", day: "numeric", year: "numeric",
    })
  } catch { return iso }
}

export async function sendSurveyInvitation({
  to,
  quarter,
  closes_at,
  respondent_count,
}: SurveyInvitationParams) {
  const subject = `ConstructAIQ ${quarter} Survey — 5 questions, 90 seconds`
  const surveyUrl = `${BASE}/survey`
  const unsubscribeUrl = `${BASE}/api/subscribe/unsubscribe?email=${encodeURIComponent(to)}`
  const closesFormatted = fmtDate(closes_at)

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="background:#000;color:#fff;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;padding:0;margin:0">
  <div style="max-width:600px;margin:0 auto;padding:40px 24px">

    <!-- Logo -->
    <div style="margin-bottom:32px">
      <img src="${BASE}/ConstructAIQWhiteLogo.svg" alt="ConstructAIQ" height="24" style="height:24px;width:auto" />
    </div>

    <!-- Eyebrow -->
    <div style="display:inline-block;background:#1a1a1a;border:1px solid #2a2a2a;border-radius:20px;padding:5px 14px;margin-bottom:24px">
      <span style="font-family:ui-monospace,'SF Mono',Consolas,monospace;font-size:11px;color:#f5a623;letter-spacing:0.1em">${quarter} · SURVEY NOW OPEN</span>
    </div>

    <!-- Headline -->
    <h1 style="font-size:28px;font-weight:700;letter-spacing:-0.02em;line-height:1.2;color:#fff;margin:0 0 16px">
      Your ${quarter} Construction Intelligence Survey is open.
    </h1>

    <!-- Subhead -->
    <p style="font-size:16px;color:#a0a0ab;line-height:1.65;margin:0 0 28px">
      5 questions. 90 seconds. Your responses join
      <strong style="color:#fff">${respondent_count > 0 ? respondent_count.toLocaleString() + " other" : "other"}</strong>
      construction professionals to produce the
      <strong style="color:#fff">Backlog Outlook Index (BOI)</strong>,
      <strong style="color:#fff">Margin Expectation Index (MEI)</strong>, and
      <strong style="color:#fff">Labor Availability Index (LAI)</strong> —
      signals that no public API can provide.
    </p>

    <!-- Publish note -->
    <p style="font-size:14px;color:#6e6e73;margin:0 0 32px">
      Results publish free to everyone on <strong style="color:#a0a0ab">${closesFormatted}</strong>.
    </p>

    <!-- CTA button -->
    <div style="margin-bottom:40px">
      <a href="${surveyUrl}" style="display:inline-block;background:#0a84ff;color:#fff;font-size:16px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:12px;letter-spacing:-0.01em">
        Take the Survey →
      </a>
    </div>

    <!-- Question preview -->
    <div style="background:#0d0d0d;border:1px solid #2a2a2a;border-radius:12px;padding:20px 24px;margin-bottom:36px">
      <div style="font-family:ui-monospace,'SF Mono',Consolas,monospace;font-size:10px;color:#6e6e73;letter-spacing:0.1em;margin-bottom:14px">
        QUESTIONS THIS QUARTER
      </div>
      <ol style="margin:0;padding:0 0 0 18px;color:#a0a0ab;font-size:14px;line-height:2">
        <li>How has your backlog changed in the last 6 months?</li>
        <li>What do you expect for margins over the next 6 months?</li>
        <li>How available is qualified labor in your market?</li>
        <li>What is your biggest material cost concern?</li>
        <li>What is your overall market outlook?</li>
      </ol>
    </div>

    <!-- Privacy note -->
    <p style="font-size:13px;color:#6e6e73;line-height:1.6;margin:0 0 32px">
      Your individual responses are never published.
      Only aggregate results are shared.
    </p>

    <!-- Divider -->
    <div style="border-top:1px solid #1a1a1a;padding-top:24px">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">
        <div>
          <div style="font-size:13px;font-weight:600;color:#fff;margin-bottom:4px">ConstructAIQ</div>
          <div style="font-size:12px;color:#6e6e73">Free construction intelligence for everyone.</div>
          <div style="font-size:12px;color:#6e6e73">constructaiq.trade</div>
        </div>
        <a href="${unsubscribeUrl}" style="font-size:12px;color:#6e6e73;text-decoration:underline">Unsubscribe</a>
      </div>
    </div>

  </div>
</body>
</html>`

  const text = `${quarter} Construction Intelligence Survey — ConstructAIQ

5 questions. 90 seconds.

Take the survey: ${surveyUrl}

Questions this quarter:
1. How has your backlog changed in the last 6 months?
2. What do you expect for margins over the next 6 months?
3. How available is qualified labor in your market?
4. What is your biggest material cost concern?
5. What is your overall market outlook?

Results publish free on ${closesFormatted}.
Your individual responses are never published.

ConstructAIQ · constructaiq.trade
Free construction intelligence for everyone.

Unsubscribe: ${unsubscribeUrl}`

  if (!resend) {
    console.log("[email] DEV MODE — survey invitation would send to:", to)
    console.log("[email] Subject:", subject)
    console.log("[email] Text preview:", text.slice(0, 200))
    return { ok: true }
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM,
      to,
      subject,
      html,
      text,
    })
    if (error) throw error
    return { ok: true, id: data?.id }
  } catch (err) {
    console.error("[email] Survey invitation failed:", err)
    return { ok: false, error: err }
  }
}

// ─── API key welcome email ─────────────────────────────────────────────────────

interface WelcomeEmailParams {
  to: string
  key: string
  prefix: string
  plan: string
  surveyOpen?: boolean
  surveyQuarter?: string
}

export async function sendApiKeyWelcome({
  to,
  key,
  prefix,
  plan,
  surveyOpen = false,
  surveyQuarter = "Q2 2025",
}: WelcomeEmailParams) {
  const subject = `Your ConstructAIQ API key — ${prefix}`

  const surveyPs = surveyOpen
    ? `<div style="background:#1a1a1a;border:1px solid #f5a62344;border-radius:10px;padding:16px 20px;margin-top:24px">
        <div style="font-size:12px;font-weight:600;color:#f5a623;margin-bottom:6px">P.S.</div>
        <div style="font-size:14px;color:#a0a0ab;line-height:1.6">
          The ${surveyQuarter} ConstructAIQ Quarterly Survey is open.
          5 questions, 90 seconds — and the results are the only construction intelligence
          signal not available from any public API.
          <a href="${BASE}/survey" style="color:#0a84ff;text-decoration:none"> Take it here →</a>
        </div>
      </div>`
    : ""

  const surveyPsText = surveyOpen
    ? `\nP.S. The ${surveyQuarter} ConstructAIQ Quarterly Survey is open. 5 questions, 90 seconds: ${BASE}/survey\n`
    : ""

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="background:#000;color:#fff;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;padding:0;margin:0">
  <div style="max-width:600px;margin:0 auto;padding:40px 24px">

    <div style="margin-bottom:28px">
      <img src="${BASE}/ConstructAIQWhiteLogo.svg" alt="ConstructAIQ" height="24" style="height:24px;width:auto" />
    </div>

    <h1 style="font-size:24px;font-weight:700;letter-spacing:-0.02em;color:#fff;margin:0 0 12px">
      Your API key is ready.
    </h1>
    <p style="font-size:15px;color:#a0a0ab;margin:0 0 28px">
      ${plan.charAt(0).toUpperCase() + plan.slice(1)} plan · ${to}
    </p>

    <div style="background:#0d0d0d;border:1px solid #2a2a2a;border-radius:12px;padding:20px 24px;margin-bottom:24px">
      <div style="font-family:ui-monospace,'SF Mono',Consolas,monospace;font-size:10px;color:#6e6e73;letter-spacing:0.1em;margin-bottom:10px">
        YOUR API KEY — STORE SECURELY, SHOWN ONCE
      </div>
      <div style="font-family:ui-monospace,'SF Mono',Consolas,monospace;font-size:14px;color:#30d158;word-break:break-all;line-height:1.5">
        ${key}
      </div>
    </div>

    <p style="font-size:13px;color:#6e6e73;margin:0 0 24px">
      This key will not be shown again. Store it in your environment variables or a secrets manager.
    </p>

    <div style="margin-bottom:28px">
      <a href="${BASE}/dashboard" style="display:inline-block;background:#0a84ff;color:#fff;font-size:15px;font-weight:600;text-decoration:none;padding:12px 24px;border-radius:10px">
        Open Dashboard →
      </a>
    </div>

    ${surveyPs}

    <div style="border-top:1px solid #1a1a1a;padding-top:24px;margin-top:32px">
      <div style="font-size:12px;color:#6e6e73">ConstructAIQ · constructaiq.trade · Free construction intelligence for everyone.</div>
    </div>

  </div>
</body>
</html>`

  const text = `Your ConstructAIQ API key

Plan: ${plan}
Key: ${key}

Store this securely — it will not be shown again.

Dashboard: ${BASE}/dashboard
Docs: https://docs.constructaiq.trade
${surveyPsText}
ConstructAIQ · constructaiq.trade`

  if (!resend) {
    console.log("[email] DEV MODE — welcome email would send to:", to)
    return { ok: true }
  }

  try {
    const { data, error } = await resend.emails.send({ from: FROM, to, subject, html, text })
    if (error) throw error
    return { ok: true, id: data?.id }
  } catch (err) {
    console.error("[email] Welcome email failed:", err)
    return { ok: false, error: err }
  }
}
