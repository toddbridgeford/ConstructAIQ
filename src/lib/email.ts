// Email utility using Resend
// Usage: await sendEmail({ to, subject, html })
// If RESEND_API_KEY is not set, logs to console (dev mode)
import { Resend } from "resend"

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
const FROM = "ConstructAIQ <noreply@constructaiq.trade>"

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
