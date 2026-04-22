"use client"
import { useState, useMemo } from "react"
import { font, color, radius } from "@/lib/theme"

const MONO = font.mono
const SYS = font.sys

export interface Solicitation {
  id: string
  title: string
  agency: string
  naics: string
  state: string
  estimatedValue: number | null
  closeDate: string | null
  postedDate: string | null
  url: string
}

interface SolicitationsTableProps {
  solicitations: Solicitation[]
}

type NaicsFilter = "all" | "236" | "237" | "238"

const NAICS_LABELS: Record<NaicsFilter, string> = {
  all: "All",
  "236": "Building (236)",
  "237": "Heavy Civil (237)",
  "238": "Specialty (238)",
}

function closeDateStatus(closeDate: string | null): "open" | "closing" | "unknown" {
  if (!closeDate) return "unknown"
  const diff = (new Date(closeDate).getTime() - Date.now()) / 86_400_000
  if (diff <= 7) return "closing"
  return "open"
}

function fmtDate(d: string | null): string {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function fmtValue(v: number | null): string {
  if (v == null) return "—"
  if (v >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(1)}B`
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`
  return `$${v.toFixed(0)}`
}

function downloadCSV(rows: Solicitation[]) {
  const header = ["Agency", "Project Title", "State", "NAICS", "Est. Value", "Close Date", "SAM.gov URL"]
  const lines = [
    header.join(","),
    ...rows.map((r) =>
      [
        `"${(r.agency ?? "").replace(/"/g, '""')}"`,
        `"${(r.title ?? "").replace(/"/g, '""')}"`,
        r.state,
        r.naics,
        r.estimatedValue != null ? r.estimatedValue : "",
        r.closeDate ?? "",
        r.url,
      ].join(",")
    ),
  ]
  const blob = new Blob([lines.join("\n")], { type: "text/csv" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `sam-gov-solicitations-${new Date().toISOString().split("T")[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function SolicitationsTable({ solicitations }: SolicitationsTableProps) {
  const [naicsFilter, setNaicsFilter] = useState<NaicsFilter>("all")

  const filtered = useMemo(() => {
    if (naicsFilter === "all") return solicitations
    return solicitations.filter((s) => s.naics?.startsWith(naicsFilter))
  }, [solicitations, naicsFilter])

  const thBase: React.CSSProperties = {
    fontFamily: MONO,
    fontSize: 10,
    color: color.t4,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    padding: "10px 12px",
    textAlign: "left",
    background: color.bg3,
    fontWeight: 600,
    whiteSpace: "nowrap",
  }

  const tdBase: React.CSSProperties = {
    fontFamily: SYS,
    fontSize: 13,
    color: color.t2,
    padding: "11px 12px",
    borderTop: `1px solid ${color.bd1}`,
    verticalAlign: "middle",
  }

  if (!solicitations || solicitations.length === 0) {
    return (
      <div
        style={{
          background: color.bg2,
          border: `1px solid ${color.bd1}`,
          borderRadius: radius.lg,
          overflow: "hidden",
        }}
      >
        <Header solicitations={[]} naicsFilter={naicsFilter} setNaicsFilter={setNaicsFilter} filtered={[]} />
        <div
          style={{
            padding: "32px 20px",
            textAlign: "center",
            fontFamily: SYS,
            fontSize: 14,
            color: color.t4,
          }}
        >
          {process.env.NEXT_PUBLIC_SAM_CONFIGURED === "true"
            ? "No active solicitations found for NAICS 236/237/238."
            : "SAM_GOV_API_KEY not configured — solicitations unavailable."}
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        background: color.bg2,
        border: `1px solid ${color.bd1}`,
        borderRadius: radius.lg,
        overflow: "hidden",
      }}
    >
      <Header solicitations={solicitations} naicsFilter={naicsFilter} setNaicsFilter={setNaicsFilter} filtered={filtered} />

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ ...thBase, minWidth: 220 }}>Project</th>
              <th style={{ ...thBase, minWidth: 160 }}>Agency</th>
              <th style={thBase}>State</th>
              <th style={thBase}>NAICS</th>
              <th style={{ ...thBase, minWidth: 100 }}>Est. Value</th>
              <th style={{ ...thBase, minWidth: 110 }}>Posted</th>
              <th style={{ ...thBase, minWidth: 110 }}>Close Date</th>
              <th style={thBase}>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s, i) => {
              const status = closeDateStatus(s.closeDate)
              return (
                <tr
                  key={s.id}
                  style={{ background: i % 2 === 0 ? color.bg2 : color.bg1, cursor: "pointer" }}
                  onClick={() => window.open(s.url, "_blank", "noopener,noreferrer")}
                >
                  <td style={{ ...tdBase, fontWeight: 500, color: color.t1, maxWidth: 300 }}>
                    <span
                      style={{
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        lineHeight: "1.4",
                      }}
                    >
                      {s.title}
                    </span>
                  </td>
                  <td style={{ ...tdBase, color: color.t3, fontSize: 12 }}>
                    {/* Show last segment of full parent path for brevity */}
                    {s.agency?.split("\\").pop()?.trim() ?? s.agency}
                  </td>
                  <td style={{ ...tdBase, fontFamily: MONO, fontSize: 12, color: color.t3 }}>{s.state}</td>
                  <td style={{ ...tdBase, fontFamily: MONO, fontSize: 12 }}>{s.naics}</td>
                  <td style={{ ...tdBase, fontFamily: MONO, fontSize: 12 }}>{fmtValue(s.estimatedValue)}</td>
                  <td style={{ ...tdBase, fontFamily: MONO, fontSize: 12, color: color.t4 }}>{fmtDate(s.postedDate)}</td>
                  <td style={{ ...tdBase, fontFamily: MONO, fontSize: 12 }}>{fmtDate(s.closeDate)}</td>
                  <td style={{ ...tdBase }}>
                    <StatusBadge status={status} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <div
          style={{
            padding: "24px 20px",
            textAlign: "center",
            fontFamily: SYS,
            fontSize: 13,
            color: color.t4,
          }}
        >
          No solicitations match the selected NAICS filter.
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: "open" | "closing" | "unknown" }) {
  if (status === "unknown") return <span style={{ color: color.t4, fontFamily: MONO, fontSize: 11 }}>—</span>
  const isClosing = status === "closing"
  return (
    <span
      style={{
        display: "inline-block",
        fontFamily: MONO,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.06em",
        padding: "2px 8px",
        borderRadius: 4,
        color: isClosing ? color.amber : color.green,
        background: isClosing ? color.amberDim : color.greenDim,
      }}
    >
      {isClosing ? "CLOSING SOON" : "OPEN"}
    </span>
  )
}

function Header({
  solicitations,
  filtered,
  naicsFilter,
  setNaicsFilter,
}: {
  solicitations: Solicitation[]
  filtered: Solicitation[]
  naicsFilter: NaicsFilter
  setNaicsFilter: (f: NaicsFilter) => void
}) {
  const filters: NaicsFilter[] = ["all", "236", "237", "238"]

  return (
    <div
      style={{
        padding: "16px 20px 14px",
        borderBottom: `1px solid ${color.bd1}`,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 12,
      }}
    >
      <div>
        <div
          style={{
            fontFamily: MONO,
            fontSize: 10,
            color: color.t4,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginBottom: 4,
          }}
        >
          SAM.gov · Active Solicitations
        </div>
        <div style={{ fontFamily: SYS, fontSize: 16, fontWeight: 600, color: color.t1 }}>
          Federal Bid Opportunities
        </div>
        {/* Filter pills */}
        <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
          {filters.map((f) => {
            const active = naicsFilter === f
            return (
              <button
                key={f}
                onClick={() => setNaicsFilter(f)}
                style={{
                  fontFamily: MONO,
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: "0.04em",
                  padding: "4px 12px",
                  borderRadius: 99,
                  border: `1px solid ${active ? color.blue : color.bd2}`,
                  background: active ? color.blueDim : "transparent",
                  color: active ? color.blue : color.t3,
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                {NAICS_LABELS[f]}
              </button>
            )
          })}
        </div>
      </div>

      {solicitations.length > 0 && (
        <button
          onClick={() => downloadCSV(filtered)}
          style={{
            fontFamily: MONO,
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.04em",
            padding: "7px 14px",
            borderRadius: 8,
            border: `1px solid ${color.bd2}`,
            background: "transparent",
            color: color.t3,
            cursor: "pointer",
            whiteSpace: "nowrap",
            alignSelf: "flex-start",
            marginTop: 4,
          }}
        >
          Download CSV
        </button>
      )}
    </div>
  )
}
