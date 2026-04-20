"use client"
import { font, color } from "@/lib/theme"

const MONO = font.mono, SYS = font.sys
const AMBER = color.amber, BLUE = color.blue
const BG1 = color.bg1, BG2 = color.bg2, BD1 = color.bd1, BD2 = color.bd2
const T1 = color.t1, T2 = color.t2, T3 = color.t3, T4 = color.t4

interface WeeklyBriefProps {
  brief?: string
  generatedAt?: string
  source?: "ai" | "static"
}

function parseBrief(text: string) {
  const sections: { label: string; content: string }[] = []
  // Guard: coerce to string in case non-string value slips through
  const str = typeof text === "string" ? text : ""
  const parts = str.split(/\n\n/)
  for (const part of parts) {
    const trimmed = part.trim()
    if (!trimmed) continue
    const colonIdx = trimmed.indexOf(":")
    if (colonIdx > 0 && colonIdx < 40) {
      sections.push({ label: trimmed.slice(0, colonIdx).trim(), content: trimmed.slice(colonIdx + 1).trim() })
    } else {
      sections.push({ label: "", content: trimmed })
    }
  }
  return sections
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractBriefString(raw: any): string | undefined {
  if (typeof raw === "string") return raw || undefined
  if (raw && typeof raw === "object" && typeof raw.brief === "string") return raw.brief || undefined
  return undefined
}

export function WeeklyBrief({ brief, generatedAt, source = "static" }: WeeklyBriefProps) {
  // Normalize: handles string, object {brief,generatedAt,source}, or undefined
  const briefText = extractBriefString(brief)
  const weekOf = generatedAt
    ? new Date(generatedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })

  if (!briefText) {
    return (
      <div style={{ background: BG2, borderRadius: 16, padding: 24, border: `1px solid ${BD1}` }}>
        <div style={{ fontFamily: MONO, fontSize: 11, color: T4 }}>Loading intelligence brief…</div>
      </div>
    )
  }

  const sections = parseBrief(briefText)

  return (
    <div style={{ background: BG1, borderRadius: 20, padding: "28px 32px", border: `1px solid ${BD1}` }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <div style={{ fontFamily: MONO, fontSize: 11, color: T4, letterSpacing: "0.1em", marginBottom: 4 }}>CONSTRUCTAIQ WEEKLY INTELLIGENCE BRIEF</div>
          <div style={{ fontFamily: SYS, fontSize: 14, color: T3 }}>Week of {weekOf}</div>
        </div>
        <span style={{ fontFamily: MONO, fontSize: 10, color: source === "ai" ? AMBER : BLUE, background: (source === "ai" ? AMBER : BLUE) + "22", border: `1px solid ${(source === "ai" ? AMBER : BLUE)}44`, borderRadius: 6, padding: "3px 10px" }}>
          {source === "ai" ? "AI GENERATED" : "EDITORIAL"}
        </span>
      </div>
      <div style={{ borderTop: `1px solid ${BD2}`, paddingTop: 20, display: "flex", flexDirection: "column", gap: 18 }}>
        {sections.map((s, i) => (
          <div key={i}>
            {s.label && <div style={{ fontFamily: MONO, fontSize: 11, color: AMBER, letterSpacing: "0.08em", marginBottom: 8 }}>{s.label.toUpperCase()}</div>}
            <div style={{ fontFamily: SYS, fontSize: i === 0 ? 16 : 15, color: i === 0 ? T1 : T2, lineHeight: 1.7 }}>
              {s.content.split("\n").map((line, li) => (
                <div key={li} style={{ marginBottom: line.startsWith("•") ? 4 : 0 }}>
                  {line.startsWith("•") ? (
                    <span style={{ display: "flex", gap: 8 }}>
                      <span style={{ color: AMBER, flexShrink: 0 }}>•</span>
                      <span>{line.slice(1).trim()}</span>
                    </span>
                  ) : line}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
