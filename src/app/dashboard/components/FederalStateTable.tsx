"use client"
import { useState } from "react"
import { font, color } from "@/lib/theme"

const MONO = font.mono
const SYS = font.sys

interface FederalStateAllocation {
  state: string
  allocated: number
  obligated: number
  spent: number
  executionPct: number
  rank: number
}

interface FederalStateTableProps {
  stateAllocations: FederalStateAllocation[]
}

type SortKey = "executionPct" | "allocated" | "obligated" | "spent" | "rank"

function fmtM(v: number): string {
  return v >= 1000 ? `$${(v / 1000).toFixed(1)}B` : `$${v.toFixed(0)}M`
}

function execColor(pct: number): string {
  if (pct > 70) return color.green
  if (pct >= 40) return color.amber
  return color.red
}

function execBg(pct: number): string {
  if (pct > 70) return color.greenDim
  if (pct >= 40) return color.amberDim
  return color.redDim
}

export function FederalStateTable({ stateAllocations }: FederalStateTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("executionPct")
  const [sortAsc, setSortAsc] = useState(false)
  const [showAll, setShowAll] = useState(false)

  if (!stateAllocations || stateAllocations.length === 0) {
    return (
      <div style={{ padding: 24, color: color.t4, fontFamily: SYS, fontSize: 14, textAlign: "center" }}>
        No state allocation data available.
      </div>
    )
  }

  const sorted = [...stateAllocations].sort((a, b) => {
    const diff = a[sortKey] - b[sortKey]
    return sortAsc ? diff : -diff
  })

  const visible = showAll ? sorted : sorted.slice(0, 20)

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortAsc((p) => !p)
    } else {
      setSortKey(key)
      setSortAsc(false)
    }
  }

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <span style={{ color: color.t4, marginLeft: 3 }}>⇅</span>
    return <span style={{ color: color.amber, marginLeft: 3 }}>{sortAsc ? "▲" : "▼"}</span>
  }

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
    cursor: "pointer",
    whiteSpace: "nowrap",
    userSelect: "none",
  }

  const tdBase: React.CSSProperties = {
    fontFamily: SYS,
    fontSize: 13,
    color: color.t2,
    padding: "9px 12px",
    borderTop: `1px solid ${color.bd1}`,
  }

  return (
    <div
      style={{
        background: color.bg2,
        border: `1px solid ${color.bd1}`,
        borderRadius: 16,
        overflow: "hidden",
      }}
    >
      <div style={{ padding: "16px 20px 12px" }}>
        <div style={{ fontFamily: MONO, fontSize: 10, color: color.t4, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 2 }}>
          State Allocation Tracker
        </div>
        <div style={{ fontFamily: SYS, fontSize: 16, fontWeight: 600, color: color.t1 }}>
          Federal Infrastructure Allocations by State
        </div>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ ...thBase, cursor: "pointer" }} onClick={() => handleSort("rank")}>
                Rank <SortIcon k="rank" />
              </th>
              <th style={{ ...thBase, cursor: "default" }}>State</th>
              <th style={thBase} onClick={() => handleSort("allocated")}>
                Allocated <SortIcon k="allocated" />
              </th>
              <th style={thBase} onClick={() => handleSort("obligated")}>
                Obligated <SortIcon k="obligated" />
              </th>
              <th style={thBase} onClick={() => handleSort("spent")}>
                Spent <SortIcon k="spent" />
              </th>
              <th style={thBase} onClick={() => handleSort("executionPct")}>
                % Executed <SortIcon k="executionPct" />
              </th>
            </tr>
          </thead>
          <tbody>
            {visible.map((s, i) => (
              <tr key={s.state} style={{ background: i % 2 === 0 ? color.bg2 : color.bg1 }}>
                <td style={{ ...tdBase, fontFamily: MONO, color: color.amber, fontWeight: 700, textAlign: "center" }}>
                  {s.rank}
                </td>
                <td style={{ ...tdBase, fontWeight: 600, color: color.t1 }}>{s.state}</td>
                <td style={{ ...tdBase, fontFamily: MONO }}>{fmtM(s.allocated)}</td>
                <td style={{ ...tdBase, fontFamily: MONO }}>{fmtM(s.obligated)}</td>
                <td style={{ ...tdBase, fontFamily: MONO }}>{fmtM(s.spent)}</td>
                <td style={{ ...tdBase }}>
                  <span
                    style={{
                      fontFamily: MONO,
                      fontSize: 12,
                      fontWeight: 700,
                      color: execColor(s.executionPct),
                      background: execBg(s.executionPct),
                      borderRadius: 6,
                      padding: "2px 8px",
                    }}
                  >
                    {s.executionPct.toFixed(1)}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {stateAllocations.length > 20 && (
        <div style={{ padding: "12px 20px", borderTop: `1px solid ${color.bd1}` }}>
          <button
            onClick={() => setShowAll((p) => !p)}
            style={{
              background: "transparent",
              border: `1px solid ${color.bd2}`,
              borderRadius: 8,
              padding: "6px 16px",
              fontFamily: MONO,
              fontSize: 12,
              color: color.t3,
              cursor: "pointer",
            }}
          >
            {showAll ? `Show top 20` : `Show all ${stateAllocations.length} states`}
          </button>
        </div>
      )}
    </div>
  )
}
