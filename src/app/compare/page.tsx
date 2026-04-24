"use client"
import { useEffect, useState } from "react"
import { font, color } from "@/lib/theme"
import { Nav } from "@/app/components/Nav"

const SYS = font.sys
const MONO = font.mono

const ALL_SECTORS = [
  { id: "residential",    label: "Residential" },
  { id: "commercial",     label: "Commercial" },
  { id: "infrastructure", label: "Infrastructure" },
  { id: "industrial",     label: "Industrial" },
]

const SECTOR_COLORS = [
  color.green, color.blue, color.amber, color.purple, color.red,
  color.cyan, color.yellow, color.orange, color.green,
]

function classColor(c: string) {
  if (c === "EXPANDING")   return color.green
  if (c === "CONTRACTING") return color.red
  if (c === "SLOWING")     return color.amber
  if (c === "STABLE")      return color.blue
  return color.t4
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function SignalsCard({ sectors }: { sectors: any[] }) {
  return (
    <div style={{ background: color.bg2, borderRadius: 16, padding: 24, border: `1px solid ${color.bd1}`, gridColumn: "1 / -1" }}>
      <div style={{ fontFamily: MONO, fontSize: 12, color: color.amber, letterSpacing: "0.08em", marginBottom: 16 }}>PRIMARY SIGNALS COMPARISON</div>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${sectors.length}, 1fr)`, gap: 16 }}>
        {sectors.map((s, i) => (
          <div key={s.id}>
            <div style={{ fontFamily: MONO, fontSize: 10, color: SECTOR_COLORS[i], letterSpacing: "0.08em", marginBottom: 10 }}>
              {s.label?.toUpperCase()}
            </div>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {(s.primary_signals ?? []).map((sig: any) => (
              <div key={sig.id} style={{ marginBottom: 8, padding: "8px 10px", background: color.bg3, borderRadius: 6 }}>
                <div style={{ fontFamily: MONO, fontSize: 9, color: color.t4, marginBottom: 2 }}>{sig.label}</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontFamily: MONO, fontSize: 12, color: color.t1 }}>{sig.value}</span>
                  {sig.yoy !== null && (
                    <span style={{ fontFamily: MONO, fontSize: 10, color: sig.direction === 'UP' ? color.green : sig.direction === 'DOWN' ? color.red : color.t4 }}>
                      {sig.yoy > 0 ? '+' : ''}{sig.yoy.toFixed(1)}%
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ComparePage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [satData, setSatData] = useState<any>(null)
  const [selected, setSelected] = useState<string[]>(["residential", "industrial", "infrastructure"])

  useEffect(() => {
    fetch("/api/compare")
      .then(r => r.json())
      .then(setData)
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetch("/api/satellite")
      .then(r => r.json())
      .then(setSatData)
      .catch(() => {})
  }, [])

  function toggle(id: string) {
    setSelected(prev =>
      prev.includes(id)
        ? prev.filter(s => s !== id)
        : prev.length < 4 ? [...prev, id] : prev
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allSectors: any[] = data?.sectors ?? []
  const activeSectors = allSectors.filter(s => selected.includes(s.id))

  return (
    <div style={{ background: color.bg0, minHeight: "100vh", color: color.t1 }}>
      <Nav />

      {/* Hero */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "56px 24px 32px", textAlign: "center" }}>
        <div style={{ fontFamily: MONO, fontSize: 11, color: color.t4, letterSpacing: "0.12em", marginBottom: 16 }}>SECTOR COMPARISON · ROTATION INTELLIGENCE</div>
        <h1 style={{ fontFamily: SYS, fontSize: 42, fontWeight: 700, color: color.t1, margin: "0 0 16px" }}>Sector Comparison Tool</h1>
        <p style={{ fontFamily: SYS, fontSize: 18, color: color.t3, maxWidth: 580, margin: "0 auto", lineHeight: 1.6 }}>
          Compare momentum, growth, and risk across construction sectors. Identify rotation opportunities before they move.
        </p>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px 80px" }}>
        {/* Sector selector */}
        <div style={{ background: color.bg1, borderRadius: 16, padding: 24, border: `1px solid ${color.bd1}`, marginBottom: 28 }}>
          <div style={{ fontFamily: MONO, fontSize: 11, color: color.t4, letterSpacing: "0.1em", marginBottom: 14 }}>SELECT UP TO 4 SECTORS TO COMPARE</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {ALL_SECTORS.map(s => {
              const isActive = selected.includes(s.id)
              const idx = selected.indexOf(s.id)
              const col = isActive ? SECTOR_COLORS[idx] : color.t4
              return (
                <button
                  key={s.id}
                  onClick={() => toggle(s.id)}
                  style={{
                    fontFamily: SYS, fontSize: 13, padding: "8px 16px", borderRadius: 8, cursor: "pointer",
                    border: `1px solid ${isActive ? col : color.bd2}`,
                    background: isActive ? col + "22" : color.bg2,
                    color: isActive ? col : color.t3,
                    fontWeight: isActive ? 600 : 400,
                  }}
                >
                  {s.label}
                </button>
              )
            })}
          </div>
        </div>

        {!data ? (
          <div style={{ textAlign: "center", padding: 64, fontFamily: MONO, fontSize: 13, color: color.t4 }}>Loading sector data…</div>
        ) : activeSectors.length === 0 ? (
          <div style={{ textAlign: "center", padding: 64, fontFamily: MONO, fontSize: 13, color: color.t4 }}>Select at least one sector above</div>
        ) : (
          <>
            {/* Metric cards row */}
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${activeSectors.length}, 1fr)`, gap: 16, marginBottom: 28 }}>
              {activeSectors.map((s, i) => {
                const sectorBsi = satData?.sectors?.[s.id]
                return (
                  <div key={s.id} style={{ background: color.bg2, borderRadius: 16, padding: 20, border: `1px solid ${SECTOR_COLORS[i]}44` }}>
                    <div style={{ fontFamily: MONO, fontSize: 10, color: SECTOR_COLORS[i], letterSpacing: "0.08em", marginBottom: 8 }}>{s.label?.toUpperCase()}</div>
                    <div style={{ fontFamily: MONO, fontSize: 22, color: classColor(s.verdict), fontWeight: 700, marginBottom: 2 }}>{s.verdict ?? '—'}</div>
                    <div style={{ fontFamily: MONO, fontSize: 9, color: color.t4, marginBottom: 10, letterSpacing: "0.06em" }}>{s.verdict_confidence} CONFIDENCE</div>
                    <div style={{ fontFamily: SYS, fontSize: 12, color: color.t3, lineHeight: 1.5, marginBottom: 12 }}>{s.headline}</div>
                    {/* Satellite BSI metric */}
                    {satData && (
                      <div style={{ marginTop: 4, background: color.bg3, borderRadius: 6, padding: "6px 10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <div style={{ fontFamily: MONO, fontSize: 9, color: color.t4 }}>BSI Δ</div>
                          <div style={{ fontFamily: MONO, fontSize: 13, color: sectorBsi?.bsi_change != null ? (sectorBsi.bsi_change >= 0 ? color.green : color.red) : color.t4 }}>
                            {sectorBsi?.bsi_change != null
                              ? `${sectorBsi.bsi_change >= 0 ? "+" : ""}${sectorBsi.bsi_change.toFixed(2)}`
                              : "—"}
                          </div>
                        </div>
                        <div style={{ fontFamily: MONO, fontSize: 8, color: color.t4, textAlign: "right" }}>SENTINEL-2<br />WEEKLY</div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Primary signals comparison */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 20, marginBottom: 12 }}>
              <SignalsCard sectors={activeSectors} />
            </div>

            {/* Satellite attribution */}
            <div style={{
              fontFamily: MONO, fontSize: 11, color: color.t4,
              textAlign: "center", padding: "12px 0 28px",
              letterSpacing: "0.04em",
            }}>
              Satellite ground signal data: Sentinel-2 BSI · Updated weekly ·{" "}
              <a href="/methodology" style={{ color: color.amber, textDecoration: "none" }}>
                constructaiq.trade/methodology
              </a>
            </div>

            {/* Rotation Signals */}
            {data.rotation_signals?.length > 0 && (
              <div style={{ background: color.bg1, borderRadius: 16, padding: 24, border: `1px solid ${color.bd1}` }}>
                <div style={{ fontFamily: MONO, fontSize: 12, color: color.amber, letterSpacing: "0.08em", marginBottom: 16 }}>ROTATION SIGNALS</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {data.rotation_signals.map((sig: any, i: number) => (
                    <div key={i} style={{ background: color.bg2, borderRadius: 10, padding: "14px 18px", border: `1px solid ${color.bd1}`, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontFamily: MONO, fontSize: 12, color: color.red }}>{sig.from}</span>
                        <span style={{ fontFamily: MONO, fontSize: 16, color: color.t4 }}>→</span>
                        <span style={{ fontFamily: MONO, fontSize: 12, color: color.green }}>{sig.to}</span>
                      </div>
                      <span style={{ fontFamily: MONO, fontSize: 10, color: sig.strength === "STRONG" ? color.green : color.amber, background: (sig.strength === "STRONG" ? color.green : color.amber) + "22", borderRadius: 4, padding: "2px 8px" }}>{sig.strength}</span>
                      <span style={{ fontFamily: SYS, fontSize: 13, color: color.t3, flex: 1 }}>{sig.rationale}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
