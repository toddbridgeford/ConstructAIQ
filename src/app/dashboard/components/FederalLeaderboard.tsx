"use client"
import { useState } from "react"
import { font, color } from "@/lib/theme"

const MONO = font.mono
const SYS = font.sys

interface FederalContractor {
  rank: number
  name: string
  awardValue: number
  contracts: number
  agency: string
  state: string
}

interface FederalLeaderboardProps {
  contractors: FederalContractor[]
}

type SortKey = "awardValue" | "contracts"

function fmtAward(v: number): string {
  return v >= 1000 ? `$${(v / 1000).toFixed(1)}B` : `$${v.toFixed(0)}M`
}

export function FederalLeaderboard({ contractors }: FederalLeaderboardProps) {
  const [sortKey, setSortKey] = useState<SortKey>("awardValue")
  const [sortAsc, setSortAsc] = useState(false)

  if (!contractors || contractors.length === 0) {
    return (
      <div style={{ padding: 24, color: color.t4, fontFamily: SYS, fontSize: 14, textAlign: "center" }}>
        No contractor data available.
      </div>
    )
  }

  const sorted = [...contractors].sort((a, b) => {
    const diff = a[sortKey] - b[sortKey]
    return sortAsc ? diff : -diff
  })

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortAsc((p) => !p)
    } else {
      setSortKey(key)
      setSortAsc(false)
    }
  }

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <span style={{ color: color.t4, marginLeft: 4 }}>⇅</span>
    return <span style={{ color: color.amber, marginLeft: 4 }}>{sortAsc ? "▲" : "▼"}</span>
  }

  const thStyle: React.CSSProperties = {
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

  const tdStyle: React.CSSProperties = {
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
          Federal Contractor Leaderboard
        </div>
        <div style={{ fontFamily: SYS, fontSize: 16, fontWeight: 600, color: color.t1 }}>
          Top {sorted.length} Federal Contractors
        </div>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ ...thStyle, width: 48 }}>Rank</th>
              <th style={thStyle}>Company</th>
              <th
                style={{ ...thStyle, cursor: "pointer" }}
                onClick={() => handleSort("awardValue")}
              >
                Award Value <SortIcon k="awardValue" />
              </th>
              <th
                style={{ ...thStyle, cursor: "pointer" }}
                onClick={() => handleSort("contracts")}
              >
                Contracts <SortIcon k="contracts" />
              </th>
              <th style={thStyle}>Agency</th>
              <th style={thStyle}>State</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((c, i) => (
              <tr
                key={c.rank}
                style={{ background: i % 2 === 0 ? color.bg2 : color.bg1 }}
              >
                <td style={{ ...tdStyle, fontFamily: MONO, color: color.amber, fontWeight: 700, textAlign: "center" }}>
                  {c.rank}
                </td>
                <td style={{ ...tdStyle, fontWeight: 500, color: color.t1 }}>{c.name}</td>
                <td style={{ ...tdStyle, fontFamily: MONO, fontWeight: 600 }}>{fmtAward(c.awardValue)}</td>
                <td style={{ ...tdStyle, fontFamily: MONO }}>{c.contracts.toLocaleString()}</td>
                <td style={{ ...tdStyle, color: color.t3 }}>{c.agency}</td>
                <td style={{ ...tdStyle, fontFamily: MONO, fontSize: 12, color: color.t4 }}>{c.state}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
