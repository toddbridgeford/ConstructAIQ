import { color, font, type } from "@/lib/theme"

const { bg1: BG1, bd1: BD1, t1: T1, t2: T2, t4: T4 } = color
const MONO = font.mono
const bodySm = type.bodySm

const PARAS = [
  `FRED — the Federal Reserve's data platform — is free. It has 3 million monthly users and is cited in more research papers than any subscription product in economics. Free builds the standard. The standard builds trust. Trust builds everything.`,
  `ConstructAIQ gives every contractor, lender, and economist the same construction intelligence that Bloomberg Terminal users pay $24,000 a year for. The information asymmetry ends here.`,
  `Revenue comes from data licensing, high-volume API access, and enterprise white-label contracts — not from locking knowledge behind a paywall.`,
]

export function FreeModel() {
  return (
    <section style={{ background: BG1, borderTop: `1px solid ${BD1}`, borderBottom: `1px solid ${BD1}` }}>
      <div style={{
        maxWidth: 680, margin: "0 auto",
        padding: "88px 32px",
        textAlign: "center",
      }}>
        <div style={{
          fontFamily: MONO, fontSize: 11, color: T4,
          letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 28,
        }}>
          Our Model
        </div>
        <h2 style={{
          fontFamily: font.sys, fontSize: 40, fontWeight: 700,
          letterSpacing: "-0.03em", lineHeight: 1.08, color: T1,
          marginBottom: 52,
        }}>
          Why free?
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          {PARAS.map((text, i) => (
            <p key={i} style={{
              fontFamily: font.sys,
              fontSize: bodySm.fontSize,
              fontWeight: bodySm.fontWeight,
              letterSpacing: bodySm.letterSpacing,
              lineHeight: bodySm.lineHeight,
              color: T2,
              margin: 0,
            }}>
              {text}
            </p>
          ))}
        </div>
      </div>
    </section>
  )
}
