"use client"
import { useState, useRef, useEffect } from "react"
import { color, font, radius, TAP, type as typeScale } from "@/lib/theme"

const SYS  = font.sys
const MONO = font.mono

interface QA {
  question: string
  answer:   string
  sources:  string[]
  error?:   boolean
}

const FALLBACK_SUGGESTIONS = [
  "What is the current state of US construction spending?",
  "Which states have the most active federal construction awards?",
  "What is the current material cost pressure trend?",
  "How has construction employment changed in the last year?",
  "What does the forecast show for the next 6 months?",
]

function sourceLabel(url: string): string {
  if (url.includes('forecast'))  return 'Forecast'
  if (url.includes('bls'))       return 'BLS'
  if (url.includes('federal'))   return 'USASpending'
  if (url.includes('pricewatch'))return 'PPI'
  if (url.includes('signals'))   return 'Signals'
  if (url.includes('map'))       return 'Census · Map'
  if (url.includes('satellite')) return 'Satellite'
  if (url.includes('rates'))     return 'FRED · Rates'
  if (url.includes('PERMIT'))    return 'Census · Permits'
  if (url.includes('HOUST'))     return 'Census · Starts'
  if (url.includes('CES'))       return 'BLS · Employment'
  if (url.includes('TTLCONS'))   return 'Census · Spending'
  if (url.includes('obs'))       return 'Census'
  return url.split('/api/')[1]?.split('?')[0] ?? url
}

function dedupeSources(sources: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const s of sources) {
    const label = sourceLabel(s)
    if (!seen.has(label)) { seen.add(label); out.push(label) }
  }
  return out
}

export function NLQInterface() {
  const [history, setHistory]       = useState<QA[]>([])
  const [input, setInput]           = useState("")
  const [loading, setLoading]       = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>(FALLBACK_SUGGESTIONS)
  const bottomRef                   = useRef<HTMLDivElement>(null)
  const inputRef                    = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch("/api/nlq/popular")
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (Array.isArray(d?.questions) && d.questions.length > 0) {
          setSuggestions(d.questions)
        }
      })
      .catch(() => { /* keep fallback */ })
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [history, loading])

  async function ask(question: string) {
    if (!question.trim() || loading) return
    setInput("")
    setLoading(true)

    try {
      const res = await fetch("/api/nlq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      })
      const data = await res.json()

      if (!res.ok) {
        setHistory(h => [...h, {
          question,
          answer: data.error ?? "Query failed — try again or browse the dashboard directly.",
          sources: [],
          error: true,
        }])
      } else {
        setHistory(h => [...h, {
          question,
          answer: data.answer,
          sources: data.sources_queried ?? [],
        }])
      }
    } catch {
      setHistory(h => [...h, {
        question,
        answer: "Query failed — try again or browse the dashboard directly.",
        sources: [],
        error: true,
      }])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  function onKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); ask(input) }
  }

  const shown = history.slice(-10)

  return (
    <div style={{
      background:   color.bg1,
      border:       `1px solid ${color.bd1}`,
      borderRadius: radius.xl2,
      overflow:     "hidden",
      fontFamily:   SYS,
    }}>
      {/* Conversation area */}
      <div style={{
        minHeight:  shown.length > 0 ? 240 : 0,
        maxHeight:  480,
        overflowY:  "auto",
        padding:    shown.length > 0 ? "20px 20px 0" : 0,
        display:    "flex",
        flexDirection: "column",
        gap:        16,
      }}>
        {shown.map((qa, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {/* Question bubble — right-aligned */}
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <div style={{
                background:   color.bg3,
                color:        color.t1,
                borderRadius: `${radius.lg}px ${radius.lg}px 4px ${radius.lg}px`,
                padding:      "10px 14px",
                fontSize:     14,
                maxWidth:     "78%",
                lineHeight:   1.5,
              }}>
                {qa.question}
              </div>
            </div>

            {/* Answer bubble — left-aligned */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6, maxWidth: "90%" }}>
              <div style={{
                background:   qa.error ? color.bg2 : color.bg1,
                border:       `1px solid ${qa.error ? color.bd2 : color.bd1}`,
                color:        qa.error ? color.t3 : color.t2,
                borderRadius: `4px ${radius.lg}px ${radius.lg}px ${radius.lg}px`,
                padding:      "12px 14px",
                fontSize:     14,
                lineHeight:   1.65,
                whiteSpace:   "pre-wrap",
              }}>
                {qa.answer}
              </div>

              {/* Source pills */}
              {qa.sources.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5, paddingLeft: 2 }}>
                  {dedupeSources(qa.sources).map(label => (
                    <span key={label} style={{
                      fontFamily:  MONO,
                      fontSize:    10,
                      color:       color.t4,
                      background:  color.bg2,
                      border:      `1px solid ${color.bd1}`,
                      borderRadius: radius.xs,
                      padding:     "2px 7px",
                      letterSpacing: "0.04em",
                    }}>
                      {label}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, paddingBottom: 4 }}>
            <AnalyzingDots />
            <span style={{ fontSize: 13, color: color.t4, fontFamily: MONO }}>Analyzing…</span>
          </div>
        )}

        <div ref={bottomRef} style={{ height: 1 }} />
      </div>

      {/* Suggestion pills — only before first question */}
      {history.length === 0 && !loading && (
        <div style={{
          padding:    "20px 20px 8px",
          display:    "flex",
          flexWrap:   "wrap",
          gap:        8,
        }}>
          {suggestions.map(s => (
            <button
              key={s}
              onClick={() => ask(s)}
              style={{
                background:   color.bg2,
                border:       `1px solid ${color.bd2}`,
                borderRadius: radius.full,
                color:        color.t3,
                fontFamily:   SYS,
                fontSize:     12.5,
                padding:      "6px 12px",
                cursor:       "pointer",
                transition:   "color 0.15s, border-color 0.15s",
                lineHeight:   1.4,
                textAlign:    "left",
              }}
              onMouseEnter={e => {
                ;(e.currentTarget as HTMLButtonElement).style.color        = color.t1
                ;(e.currentTarget as HTMLButtonElement).style.borderColor  = color.bd3
              }}
              onMouseLeave={e => {
                ;(e.currentTarget as HTMLButtonElement).style.color        = color.t3
                ;(e.currentTarget as HTMLButtonElement).style.borderColor  = color.bd2
              }}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input bar */}
      <div style={{
        display:      "flex",
        alignItems:   "center",
        gap:          10,
        padding:      "12px 16px",
        borderTop:    shown.length > 0 || history.length === 0 ? `1px solid ${color.bd1}` : "none",
        marginTop:    shown.length > 0 ? 12 : 0,
      }}>
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={onKey}
          placeholder="Ask a question about US construction…"
          disabled={loading}
          maxLength={500}
          style={{
            flex:         1,
            background:   color.bg2,
            border:       `1px solid ${color.bd2}`,
            borderRadius: radius.md,
            color:        color.t1,
            fontFamily:   SYS,
            fontSize:     14,
            padding:      "10px 14px",
            outline:      "none",
            minHeight:    TAP,
            opacity:      loading ? 0.5 : 1,
          }}
        />
        <button
          onClick={() => ask(input)}
          disabled={loading || !input.trim()}
          style={{
            background:   color.blue,
            color:        color.t1,
            fontFamily:   SYS,
            fontSize:     14,
            fontWeight:   600,
            padding:      "0 20px",
            borderRadius: radius.md,
            minHeight:    TAP,
            border:       "none",
            cursor:       loading || !input.trim() ? "default" : "pointer",
            opacity:      loading || !input.trim() ? 0.4 : 1,
            flexShrink:   0,
            transition:   "opacity 0.15s",
          }}
        >
          Ask
        </button>
      </div>
    </div>
  )
}

function AnalyzingDots() {
  return (
    <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
      {[0, 1, 2].map(i => (
        <span
          key={i}
          style={{
            width:        5,
            height:       5,
            borderRadius: "50%",
            background:   color.blue,
            display:      "inline-block",
            animation:    `nlq-dot 1.2s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
      <style>{`
        @keyframes nlq-dot {
          0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
          40%            { opacity: 1;   transform: scale(1);   }
        }
      `}</style>
    </div>
  )
}
