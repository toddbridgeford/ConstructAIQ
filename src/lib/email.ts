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
