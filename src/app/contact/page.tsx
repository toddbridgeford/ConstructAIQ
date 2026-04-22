"use client"
import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { font, color } from '@/lib/theme'
import { Nav } from '@/app/components/Nav'

const SYS  = font.sys
const MONO = font.mono
const AMBER = color.amber
const GREEN = color.green
const RED   = color.red
const BLUE  = color.blue
const BG0   = color.bg0
const BG1   = color.bg1
const BG2   = color.bg2
const BG3   = color.bg3
const BD1   = color.bd1
const BD2   = color.bd2
const T1    = color.t1
const T2    = color.t2
const T3    = color.t3
const T4    = color.t4

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: BG2,
  border: `1px solid ${BD1}`,
  borderRadius: 12,
  padding: "13px 18px",
  color: T1,
  fontSize: 15,
  minHeight: 48,
  fontFamily: SYS,
  outline: "none",
  boxSizing: "border-box",
}

export default function ContactPage() {
  const [name, setName] = useState("")
  const [org, setOrg] = useState("")
  const [role, setRole] = useState("")
  const [email, setEmail] = useState("")
  const [inquiryType, setInquiryType] = useState("Enterprise Pricing")
  const [message, setMessage] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus] = useState<"" | "success" | "error">("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setStatus("")
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, org, role, email, inquiryType, message }),
      })
      if (res.ok) {
        setStatus("success")
        setName(""); setOrg(""); setRole(""); setEmail(""); setMessage("")
        setInquiryType("Enterprise Pricing")
      } else {
        setStatus("error")
      }
    } catch {
      setStatus("error")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: BG0, color: T1, fontFamily: SYS, paddingBottom: "env(safe-area-inset-bottom,20px)" }}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        a{color:inherit;text-decoration:none}
        button{outline:none;font-family:inherit;cursor:pointer;border:none}
        button:hover{opacity:0.85}
        input::placeholder,textarea::placeholder{color:#6e6e73}
        input:focus,textarea:focus,select:focus{border-color:#383838!important;outline:none}
        @media(max-width:768px){
          .contact-layout{flex-direction:column!important}
          .contact-form-col{max-width:100%!important}
        }
      `}</style>

      <Nav />

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "72px 32px 80px" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: BG2, border: `1px solid ${AMBER}44`, borderRadius: 20, padding: "6px 16px", marginBottom: 24 }}>
            <span style={{ fontFamily: MONO, fontSize: 12, color: AMBER }}>✉ Let&apos;s Talk</span>
          </div>

          <h1 style={{ fontFamily: SYS, fontSize: 48, fontWeight: 700, lineHeight: 1.1, color: T1, marginBottom: 16, letterSpacing: "-0.02em" }}>
            Let&apos;s Talk
          </h1>

          <p style={{ fontFamily: SYS, fontSize: 18, color: T3, lineHeight: 1.6, maxWidth: 580, margin: "0 auto" }}>
            For enterprise access, government licensing, partnership inquiries, or custom data integrations — reach out directly.
          </p>
        </div>

        {/* Two-column layout */}
        <div className="contact-layout" style={{ display: "flex", gap: 32, alignItems: "flex-start", justifyContent: "center" }}>

          {/* Left: Form column */}
          <div className="contact-form-col" style={{ flex: "1 1 0", maxWidth: 600 }}>

            {/* Form card */}
            <div style={{
              background: BG1,
              border: `1px solid ${BD1}`,
              borderRadius: 20,
              padding: "40px",
              marginBottom: 32,
            }}>
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                {/* Name */}
                <div>
                  <input
                    type="text"
                    placeholder="Your name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                    style={inputStyle}
                  />
                </div>

                {/* Organization */}
                <div>
                  <input
                    type="text"
                    placeholder="Company / Agency / Institution"
                    value={org}
                    onChange={e => setOrg(e.target.value)}
                    style={inputStyle}
                  />
                </div>

                {/* Role/Title */}
                <div>
                  <input
                    type="text"
                    placeholder="e.g., Portfolio Manager, Director of Planning"
                    value={role}
                    onChange={e => setRole(e.target.value)}
                    style={inputStyle}
                  />
                </div>

                {/* Email */}
                <div>
                  <input
                    type="email"
                    placeholder="you@organization.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    style={inputStyle}
                  />
                </div>

                {/* Inquiry Type */}
                <div>
                  <select
                    value={inquiryType}
                    onChange={e => setInquiryType(e.target.value)}
                    style={{
                      width: "100%",
                      background: BG2,
                      border: `1px solid ${BD1}`,
                      borderRadius: 12,
                      padding: "13px 18px",
                      color: T1,
                      fontSize: 15,
                      minHeight: 48,
                      fontFamily: SYS,
                      appearance: "none",
                      WebkitAppearance: "none",
                      MozAppearance: "none",
                      outline: "none",
                      boxSizing: "border-box",
                      cursor: "pointer",
                    } as React.CSSProperties}
                  >
                    <option value="Enterprise Pricing">Enterprise Pricing</option>
                    <option value="Government Licensing">Government Licensing</option>
                    <option value="Partnership">Partnership</option>
                    <option value="Press / Media">Press / Media</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Message */}
                <div>
                  <textarea
                    rows={5}
                    placeholder="Tell us what you're working on..."
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    required
                    style={{ ...inputStyle, resize: "vertical", minHeight: 120 }}
                  />
                </div>

                {/* Status messages */}
                {status === "success" && (
                  <div style={{ fontFamily: SYS, fontSize: 14, color: GREEN, padding: "12px 16px", background: GREEN + "12", border: `1px solid ${GREEN}33`, borderRadius: 10 }}>
                    ✓ Message received. We&apos;ll be in touch within 1 business day.
                  </div>
                )}
                {status === "error" && (
                  <div style={{ fontFamily: SYS, fontSize: 14, color: RED, padding: "12px 16px", background: RED + "12", border: `1px solid ${RED}33`, borderRadius: 10 }}>
                    Something went wrong. Please email us at hello@constructaiq.trade
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    width: "100%",
                    background: AMBER,
                    color: BG0,
                    fontFamily: MONO,
                    fontSize: 14,
                    fontWeight: 700,
                    minHeight: 50,
                    borderRadius: 12,
                    letterSpacing: "0.06em",
                    padding: "14px 24px",
                    border: "none",
                    cursor: submitting ? "not-allowed" : "pointer",
                    opacity: submitting ? 0.6 : 1,
                    transition: "opacity 0.15s",
                  }}
                >
                  {submitting ? "Sending..." : "Send Message →"}
                </button>
              </form>
            </div>

            {/* Direct email */}
            <div style={{ textAlign: "center", paddingTop: 8 }}>
              <div style={{ fontFamily: MONO, fontSize: 11, color: T4, letterSpacing: "0.1em", marginBottom: 10 }}>OR EMAIL US DIRECTLY</div>
              <a href="mailto:hello@constructaiq.trade" style={{ fontFamily: SYS, fontSize: 18, fontWeight: 600, color: AMBER }}>
                hello@constructaiq.trade
              </a>
            </div>
          </div>

          {/* Right: Info card */}
          <div style={{ flex: "0 0 280px", minWidth: 240 }}>
            <div style={{
              background: BG2,
              border: `1px solid ${BD1}`,
              borderRadius: 16,
              padding: 28,
            }}>
              <div style={{ fontFamily: SYS, fontSize: 16, fontWeight: 600, color: T1, marginBottom: 20 }}>What to expect:</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {[
                  "Response within 1 business day",
                  "Enterprise demos available",
                  "Government procurement support",
                  "Custom integration scoping",
                ].map((item, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <span style={{ fontFamily: MONO, fontSize: 13, color: GREEN, flexShrink: 0, marginTop: 1 }}>✓</span>
                    <span style={{ fontFamily: SYS, fontSize: 14, color: T3, lineHeight: 1.5 }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer style={{ borderTop: `1px solid ${BD1}`, padding: "32px", textAlign: "center" }}>
        <Image src="/ConstructAIQWhiteLogo.svg" width={100} height={20} alt="ConstructAIQ" style={{ height: 20, width: "auto", marginBottom: 12 }} />
        <div style={{ fontFamily: SYS, fontSize: 13, color: T4 }}>Construction Intelligence Platform · constructaiq.trade</div>
        <div style={{ fontFamily: SYS, fontSize: 13, color: T4, marginTop: 6 }}>Data: Census Bureau · BLS · FRED · BEA · EIA · USASpending.gov</div>
      </footer>
    </div>
  )
}
