import { NextResponse }          from "next/server"
import { supabaseAdmin }          from "@/lib/supabase"
import { verifyUnsubscribeToken } from "@/lib/email"

export const maxDuration = 10

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const { token } = await request.json()
    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "Token required" }, { status: 400 })
    }

    const email = verifyUnsubscribeToken(token)
    if (!email) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from("subscribers")
      .update({ unsubscribed_at: new Date().toISOString(), active: false })
      .eq("email", email)
      .is("unsubscribed_at", null)

    if (error) {
      console.error("[/api/unsubscribe]", error)
      return NextResponse.json({ error: "Failed to unsubscribe" }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[/api/unsubscribe]", err)
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status:  204,
    headers: {
      "Access-Control-Allow-Origin":  "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  })
}
