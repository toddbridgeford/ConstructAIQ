"use client"
import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { ChevronRight, ChevronLeft, Send } from "lucide-react"
import { color, font, layout as L, signal as SIG } from "@/lib/theme"

interface SignalItem {
  type:        string
  title:       string
  description: string
}

interface Props {
  open:        boolean
  onToggle:    () => void
  activePage?: string
}

const SYS  = font.sys
const MONO = font.mono

function firstSentence(text: string): string {
  const match = text.match(/[^.!?]*[.!?]/)
  return match ? match[0].trim() : text.slice(0, 120)
}

function signalColor(type: string): string {
  if (type === 'BULLISH' || type === 'BUY')  return SIG.expand
  if (type === 'BEARISH' || type === 'SELL') return SIG.contract
  if (type === 'WARNING')                    return SIG.watch
  return SIG.neutral
}

interface PageInsight {
  label: string
  title: string
  body:  string
  color: string
}

export function ContextPanel({ open, onToggle, activePage }: Props) {
  const [topSignal, setTopSignal]         = useState<SignalItem | null>(null)
  const [briefExcerpt, setBriefExcerpt]   = useState<string | null>(null)
  const [pageInsight, setPageInsight]     = useState<PageInsight | null>(null)
  const [question, setQuestion]           = useState('')
  const [answer, setAnswer]               = useState<string | null>(null)
  const [asking, setAsking]               = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/signals')
      .then(r => r.ok ? r.json() : null)
      .then((data: { signals?: SignalItem[] } | null) => {
        if (data?.signals?.[0]) setTopSignal(data.signals[0])
      })
      .catch(() => null)

    fetch('/api/weekly-brief')
      .then(r => r.ok ? r.json() : null)
      .then((data: { brief?: string } | null) => {
        if (data?.brief) setBriefExcerpt(firstSentence(data.brief))
      })
      .catch(() => null)
  }, [])

  // Page-specific contextual insight
  useEffect(() => {
    setPageInsight(null)
    if (!activePage) return

    if (activePage.startsWith('/federal')) {
      fetch('/api/federal')
        .then(r => r.ok ? r.json() : null)
        .then((data: { stateAllocations?: { state: string; obligated: number }[] } | null) => {
          if (!data?.stateAllocations?.length) return
          const top = [...data.stateAllocations].sort((a, b) => b.obligated - a.obligated)[0]
          setPageInsight({
            label: 'Top Award State',
            title: top.state,
            body:  `$${top.obligated >= 1000 ? (top.obligated / 1000).toFixed(1) + 'B' : top.obligated.toFixed(0) + 'M'} in federal construction awards`,
            color: SIG.federal,
          })
        })
        .catch(() => null)
    } else if (activePage.startsWith('/permits')) {
      fetch('/api/permits')
        .then(r => r.ok ? r.json() : null)
        .then((data: { cities?: { city_name: string; monthly: { permit_count: number }[] }[] } | null) => {
          if (!data?.cities?.length) return
          let best: { city_name: string; pct: number } | null = null
          for (const c of data.cities) {
            const m = c.monthly.slice(-2)
            if (m.length < 2 || m[0].permit_count === 0) continue
            const pct = ((m[1].permit_count - m[0].permit_count) / m[0].permit_count) * 100
            if (!best || Math.abs(pct) > Math.abs(best.pct)) best = { city_name: c.city_name, pct }
          }
          if (!best) return
          setPageInsight({
            label: 'Largest MoM Move',
            title: best.city_name,
            body:  `${best.pct >= 0 ? '+' : ''}${best.pct.toFixed(1)}% month-over-month permit change`,
            color: best.pct >= 0 ? SIG.expand : SIG.contract,
          })
        })
        .catch(() => null)
    } else if (activePage.startsWith('/materials')) {
      fetch('/api/materials-intelligence')
        .then(r => r.ok ? r.json() : null)
        .then((data: { materials?: { name: string; ppi_change_pct?: number }[] } | null) => {
          if (!data?.materials?.length) return
          const sorted = [...data.materials]
            .filter(m => m.ppi_change_pct != null)
            .sort((a, b) => Math.abs(b.ppi_change_pct ?? 0) - Math.abs(a.ppi_change_pct ?? 0))
          if (!sorted.length) return
          const top = sorted[0]
          const pct = top.ppi_change_pct ?? 0
          setPageInsight({
            label: 'Largest PPI Move',
            title: top.name,
            body:  `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}% PPI change this month`,
            color: pct >= 0 ? SIG.watch : SIG.contract,
          })
        })
        .catch(() => null)
    } else if (activePage.startsWith('/dashboard')) {
      fetch('/api/signals')
        .then(r => r.ok ? r.json() : null)
        .then((data: { signals?: (SignalItem & { type: string; date?: string })[] } | null) => {
          if (!data?.signals) return
          const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000
          const warn = data.signals.find(s =>
            /warn/i.test(s.type) && (!s.date || new Date(s.date).getTime() > cutoff)
          )
          if (!warn) return
          setPageInsight({
            label: 'WARN Act Filing',
            title: warn.title,
            body:  firstSentence(warn.description),
            color: SIG.contract,
          })
        })
        .catch(() => null)
    }
  }, [activePage])

  async function handleAsk() {
    const q = question.trim()
    if (!q || asking) return
    setAsking(true)
    setAnswer(null)
    try {
      const res  = await fetch('/api/nlq', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ question: q }),
      })
      const data = await res.json() as { answer?: string; error?: string }
      setAnswer(data.answer ?? data.error ?? 'No response.')
      setQuestion('')
    } catch {
      setAnswer('Failed to reach the AI engine.')
    } finally {
      setAsking(false)
    }
  }

  return (
    <>
      {/* Toggle tab — always visible, anchored at right edge */}
      <button
        onClick={onToggle}
        title={open ? 'Collapse panel' : 'Expand panel'}
        style={{
          position:  'fixed',
          right:     open ? L.contextPanel : 0,
          top:       '50%',
          transform: 'translateY(-50%)',
          zIndex:    401,
          width:     20,
          height:    52,
          background:  color.bg2,
          border:    `1px solid ${color.bd2}`,
          borderRight: open ? 'none' : `1px solid ${color.bd2}`,
          borderRadius: open ? '6px 0 0 6px' : '6px 0 0 6px',
          display:   'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color:     color.t3,
          cursor:    'pointer',
          transition: 'right 0.2s ease',
        }}
      >
        {open ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>

      {/* Panel */}
      <aside
        style={{
          position:  'fixed',
          right:     0,
          top:       0,
          bottom:    0,
          width:     open ? L.contextPanel : 0,
          background: color.bg2,
          borderLeft: `1px solid ${color.bd1}`,
          overflowX: 'hidden',
          overflowY: open ? 'auto' : 'hidden',
          zIndex:    400,
          transition: 'width 0.2s ease',
          fontFamily: SYS,
          display:   'flex',
          flexDirection: 'column',
          gap:       0,
        }}
      >
        {open && (
          <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 0, minWidth: L.contextPanel }}>

            {/* ── Page Context ─────────────────────────────── */}
            {pageInsight && (
              <>
                <Section label={pageInsight.label}>
                  <div style={{
                    borderLeft:   `2px solid ${pageInsight.color}`,
                    paddingLeft:  10,
                  }}>
                    <div style={{
                      fontSize:     13,
                      fontWeight:   600,
                      color:        pageInsight.color,
                      marginBottom: 4,
                      lineHeight:   1.35,
                    }}>
                      {pageInsight.title}
                    </div>
                    <p style={{ fontSize: 12, color: color.t3, lineHeight: 1.5, margin: 0 }}>
                      {pageInsight.body}
                    </p>
                  </div>
                </Section>
                <Divider />
              </>
            )}

            {/* ── Signal Alert ─────────────────────────────── */}
            <Section label="Signal Alert">
              {topSignal ? (
                <div>
                  <div style={{
                    fontSize:      13,
                    fontWeight:    600,
                    color:         signalColor(topSignal.type),
                    marginBottom:  6,
                    lineHeight:    1.4,
                  }}>
                    {topSignal.title}
                  </div>
                  <p style={{
                    fontSize:   12,
                    color:      color.t3,
                    lineHeight: 1.5,
                    margin:     0,
                  }}>
                    {firstSentence(topSignal.description)}
                  </p>
                </div>
              ) : (
                <Skeleton lines={2} />
              )}
            </Section>

            <Divider />

            {/* ── Ask the Market ───────────────────────────── */}
            <Section label="Ask the Market">
              <div style={{ display: 'flex', gap: 6, marginBottom: answer ? 10 : 0 }}>
                <input
                  ref={inputRef}
                  value={question}
                  onChange={e => setQuestion(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleAsk() }}
                  placeholder="Ask about construction data…"
                  disabled={asking}
                  style={{
                    flex:        1,
                    height:      32,
                    padding:     '0 10px',
                    background:  color.bg3,
                    border:      `1px solid ${color.bd2}`,
                    borderRadius: 6,
                    color:       color.t1,
                    fontSize:    12,
                    fontFamily:  SYS,
                    outline:     'none',
                    opacity:     asking ? 0.6 : 1,
                  }}
                />
                <button
                  onClick={handleAsk}
                  disabled={asking || !question.trim()}
                  style={{
                    width:       32,
                    height:      32,
                    flexShrink:  0,
                    background:  asking || !question.trim() ? color.bg3 : color.blue,
                    border:      `1px solid ${asking || !question.trim() ? color.bd2 : color.blue}`,
                    borderRadius: 6,
                    color:       color.t1,
                    display:     'flex',
                    alignItems:  'center',
                    justifyContent: 'center',
                    cursor:      asking || !question.trim() ? 'default' : 'pointer',
                    transition:  'background 0.12s',
                  }}
                >
                  <Send size={12} />
                </button>
              </div>

              {asking && (
                <p style={{ fontSize: 11, color: color.t3, margin: '6px 0 0', fontFamily: MONO }}>
                  Querying…
                </p>
              )}

              {answer && !asking && (
                <p style={{
                  fontSize:    12,
                  color:       color.t2,
                  lineHeight:  1.5,
                  margin:      '6px 0 0',
                  padding:     '8px 10px',
                  background:  color.bg3,
                  borderRadius: 6,
                  border:      `1px solid ${color.bd1}`,
                }}>
                  {firstSentence(answer)}
                </p>
              )}

              <Link href="/ask" style={{
                display:       'block',
                marginTop:     answer || asking ? 8 : 0,
                fontSize:      11,
                color:         color.blue,
                fontFamily:    MONO,
                letterSpacing: '0.04em',
              }}>
                Full interface →
              </Link>
            </Section>

            <Divider />

            {/* ── Weekly Brief ─────────────────────────────── */}
            <Section label="Weekly Brief">
              {briefExcerpt ? (
                <div>
                  <p style={{
                    fontSize:   12,
                    color:      color.t2,
                    lineHeight: 1.6,
                    margin:     '0 0 8px',
                  }}>
                    {briefExcerpt}
                  </p>
                  <Link href="/weekly-brief" style={{
                    fontSize:      11,
                    color:         color.blue,
                    fontFamily:    MONO,
                    letterSpacing: '0.04em',
                  }}>
                    Read full brief →
                  </Link>
                </div>
              ) : (
                <Skeleton lines={3} />
              )}
            </Section>

          </div>
        )}
      </aside>
    </>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ padding: '16px 0' }}>
      <div style={{
        fontSize:      10,
        fontFamily:    font.mono,
        fontWeight:    500,
        color:         color.t4,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        marginBottom:  10,
      }}>
        {label}
      </div>
      {children}
    </div>
  )
}

function Divider() {
  return (
    <div style={{ height: 1, background: color.bd1, margin: '0 0' }} />
  )
}

function Skeleton({ lines }: { lines: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          style={{
            height:      12,
            borderRadius: 4,
            background:  `linear-gradient(90deg, ${color.bg3} 25%, ${color.bg4} 50%, ${color.bg3} 75%)`,
            backgroundSize: '200% 100%',
            animation:   'shimmer 1.5s infinite',
            width:       i === lines - 1 ? '60%' : '100%',
          }}
        />
      ))}
    </div>
  )
}
