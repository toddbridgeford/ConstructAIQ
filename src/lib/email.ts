// Email utility using Resend
// Usage: await sendEmail({ to, subject, html })
// If RESEND_API_KEY is not set, logs to console (dev mode)
import { Resend } from "resend"
import crypto from "crypto"

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

// ─── API key welcome email ─────────────────────────────────────────────────────

interface WelcomeEmailParams {
  to: string
  key: string
  prefix: string
  plan: string
}

export async function sendApiKeyWelcome({
  to,
  key,
  prefix,
  plan,
}: WelcomeEmailParams) {
  const subject = `Your ConstructAIQ API key — ${prefix}`

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

// ─── Weekly Signal newsletter ──────────────────────────────────────────────

export function unsubscribeToken(email: string): string {
  const secret = process.env.UNSUBSCRIBE_SECRET ?? "constructaiq-unsub"
  const data   = Buffer.from(email.toLowerCase()).toString("base64url")
  const sig    = crypto.createHmac("sha256", secret).update(email.toLowerCase()).digest("hex")
  return `${data}.${sig}`
}

export function verifyUnsubscribeToken(token: string): string | null {
  try {
    const dotIdx = token.lastIndexOf(".")
    if (dotIdx === -1) return null
    const data  = token.slice(0, dotIdx)
    const sig   = token.slice(dotIdx + 1)
    const email = Buffer.from(data, "base64url").toString("utf8")
    const expected = crypto
      .createHmac("sha256", process.env.UNSUBSCRIBE_SECRET ?? "constructaiq-unsub")
      .update(email.toLowerCase())
      .digest("hex")
    return expected === sig ? email : null
  } catch {
    return null
  }
}

interface WeeklySignalParams {
  to:          string
  brief:       string
  spendVal:    number
  spendMom:    number
  permitVal:   number
  permitMom:   number
  employVal:   number
  employMom:   number
  topSignal:   string
  verdictText: string
  verdictType: "EXPAND" | "HOLD" | "CONTRACT"
  weekOf:      string
}

export async function sendWeeklySignal(params: WeeklySignalParams) {
  const {
    to, brief, spendVal, spendMom, permitVal, permitMom,
    employVal, employMom, topSignal, verdictText, verdictType, weekOf,
  } = params

  const subject = `The Signal — ${weekOf} Construction Market Update`

  const verdictBg =
    verdictType === "EXPAND"   ? "#0a3d1f" :
    verdictType === "CONTRACT" ? "#3d0a0a" : "#3d2a00"

  const briefParas = brief.split(/\n\n+/).slice(0, 3)
    .map(p => `<p style="margin:0 0 16px;line-height:1.7;font-size:15px;color:#ebebf0">${p.replace(/\n/g, "<br>")}</p>`)
    .join("")

  const spendDisp  = spendVal >= 1_000_000
    ? `$${(spendVal / 1_000_000).toFixed(1)}T`
    : spendVal >= 1_000
    ? `$${(spendVal / 1_000).toFixed(1)}b`
    : `$${spendVal.toFixed(0)}M`

  const permitDisp = `${permitVal.toFixed(0)}k ann.`
  const employDisp = employVal >= 1_000
    ? `${(employVal / 1_000).toFixed(1)}M`
    : `${employVal.toFixed(0)}k`

  const token = unsubscribeToken(to)

  const cols = [
    { label: "Spending",   val: spendDisp,  mom: spendMom  },
    { label: "Permits",    val: permitDisp, mom: permitMom },
    { label: "Employment", val: employDisp, mom: employMom },
  ]

  const colsHtml = cols.map(col => {
    const sign  = col.mom >= 0 ? "+" : ""
    const clr   = col.mom >= 0 ? "#30d158" : "#ff453a"
    return `
    <td style="width:33.33%;background:#0d0d0d;padding:20px 16px;border-right:1px solid #2a2a2a;border-bottom:1px solid #2a2a2a;vertical-align:top">
      <div style="font-family:ui-monospace,'SF Mono',Consolas,monospace;font-size:10px;color:#6e6e73;letter-spacing:0.1em;margin-bottom:8px;text-transform:uppercase">${col.label}</div>
      <div style="font-family:ui-monospace,'SF Mono',Consolas,monospace;font-size:22px;color:#fff;font-weight:700;margin-bottom:6px;letter-spacing:-0.02em">${col.val}</div>
      <div style="font-family:ui-monospace,'SF Mono',Consolas,monospace;font-size:12px;color:${clr}">${sign}${col.mom.toFixed(1)}% MoM</div>
    </td>`
  }).join("")

  const ctasHtml = [
    { label: "Open Dashboard",        href: `${BASE}/dashboard` },
    { label: "View Federal Pipeline", href: `${BASE}/federal`   },
    { label: "Ask the Market",        href: `${BASE}/ask`       },
  ].map(cta =>
    `<a href="${cta.href}" style="display:inline-block;background:#1a1a1a;color:#fff;font-size:13px;font-weight:500;text-decoration:none;padding:10px 18px;border-radius:8px;border:1px solid #2a2a2a;margin:0 8px 8px 0">${cta.label}</a>`
  ).join("")

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="background:#000;color:#fff;margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif">
<div style="max-width:600px;margin:0 auto">

  <!-- Header -->
  <div style="background:#000;padding:24px 28px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #2a2a2a">
    <img src="${BASE}/ConstructAIQWhiteLogo.svg" alt="ConstructAIQ" height="20" style="height:20px;width:auto" />
    <span style="font-family:ui-monospace,'SF Mono',Consolas,monospace;font-size:11px;color:#f5a623;letter-spacing:0.14em;font-weight:700">THE SIGNAL</span>
  </div>

  <!-- Verdict banner -->
  <div style="background:${verdictBg};padding:14px 28px">
    <span style="font-size:16px;font-weight:600;color:#fff;letter-spacing:-0.01em">${verdictText}</span>
  </div>

  <!-- Three stat columns -->
  <table style="width:100%;border-collapse:collapse;table-layout:fixed"><tr>${colsHtml}</tr></table>

  <!-- Market Intelligence -->
  <div style="padding:28px;background:#000;border-bottom:1px solid #2a2a2a">
    <div style="font-family:ui-monospace,'SF Mono',Consolas,monospace;font-size:10px;color:#6e6e73;letter-spacing:0.14em;margin-bottom:18px;text-transform:uppercase">This Week&#39;s Market Intelligence</div>
    ${briefParas}
    <a href="${BASE}/dashboard" style="font-family:ui-monospace,'SF Mono',Consolas,monospace;font-size:12px;color:#0a84ff;text-decoration:none;letter-spacing:0.04em">Read full analysis on the dashboard &#8594;</a>
  </div>

  <!-- Signal Alert -->
  <div style="padding:20px 28px;background:#0d0d0d;border-bottom:1px solid #2a2a2a">
    <div style="font-family:ui-monospace,'SF Mono',Consolas,monospace;font-size:10px;color:#f5a623;letter-spacing:0.14em;margin-bottom:10px;text-transform:uppercase">Signal Alert</div>
    <p style="margin:0;font-size:14px;color:#ebebf0;line-height:1.6">${topSignal}</p>
  </div>

  <!-- CTAs -->
  <div style="padding:24px 28px;background:#000;border-bottom:1px solid #2a2a2a">
    ${ctasHtml}
  </div>

  <!-- Footer -->
  <div style="padding:20px 28px;background:#000">
    <p style="margin:0 0 10px;font-size:12px;color:#6e6e73;line-height:1.6">
      You&#39;re subscribed to <strong style="color:#a0a0ab">The Signal</strong> from ConstructAIQ.<br>
      Free construction market intelligence. <a href="${BASE}" style="color:#6e6e73;text-decoration:none">constructaiq.trade</a>
    </p>
    <div style="font-size:12px;color:#6e6e73">
      <a href="${BASE}/unsubscribe?token=${token}" style="color:#6e6e73;text-decoration:underline">Unsubscribe</a>
      &nbsp;&middot;&nbsp;
      <a href="${BASE}/subscribe" style="color:#6e6e73;text-decoration:underline">View in browser</a>
    </div>
  </div>

</div>
</body>
</html>`

  if (!resend) {
    console.log("[email] DEV MODE — weekly signal would send to:", to)
    return { ok: true }
  }

  try {
    const { data, error } = await resend.emails.send({ from: FROM, to, subject, html })
    if (error) throw error
    return { ok: true, id: data?.id }
  } catch (err) {
    console.error("[email] Weekly signal failed:", err)
    return { ok: false, error: err }
  }
}
