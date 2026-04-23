"use client"
import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { color, font } from "@/lib/theme"

// ── Types ──────────────────────────────────────────────────────────────────

interface Answer {
  question: string
  answer:   string
  sources:  string[]
  error?:   boolean
}

// ── Design tokens ──────────────────────────────────────────────────────────

const { bg0: BG0, bg1: BG1, bg2: BG2, bd1: BD1, bd2: BD2,
        t1: T1, t2: T2, t3: T3, t4: T4,
        blue: BLUE, red: RED } = color
const SYS = font.sys, MONO = font.mono

// ── Source label helper ────────────────────────────────────────────────────

function sourceLabel(url: string): string {
  if (url.includes('forecast'))   return 'Forecast'
  if (url.includes('bls'))        return 'BLS'
  if (url.includes('federal'))    return 'USASpending'
  if (url.includes('pricewatch')) return 'PPI'
  if (url.includes('signals'))    return 'Signals'
  if (url.includes('satellite'))  return 'Satellite'
  if (url.includes('PERMIT'))     return 'Census · Permits'
  if (url.includes('HOUST'))      return 'Census · Starts'
  if (url.includes('CES'))        return 'BLS · Employment'
  if (url.includes('TTLCONS'))    return 'Census · Spending'
  if (url.includes('obs'))        return 'FRED'
  return url.split('/api/')[1]?.split('?')[0] ?? url
}

function dedupeSources(sources: string[]): string[] {
  const seen = new Set<string>()
  return sources.reduce<string[]>((out, s) => {
    const label = sourceLabel(s)
    if (!seen.has(label)) { seen.add(label); out.push(label) }
    return out
  }, [])
}

// ── Dots animation ─────────────────────────────────────────────────────────

function ThinkingDots() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      {[0, 1, 2].map(i => (
        <span key={i} style={{
          width: 6, height: 6, borderRadius: '50%', background: BLUE,
          display: 'inline-block',
          animation: `ask-dot 1.2s ease-in-out ${i * 0.2}s infinite`,
        }} />
      ))}
      <style>{`
        @keyframes ask-dot {
          0%,80%,100% { opacity: 0.2; transform: scale(0.85); }
          40%          { opacity: 1;   transform: scale(1);    }
        }
      `}</style>
    </div>
  )
}

// ── Suggestion chip ────────────────────────────────────────────────────────

function Chip({
  label, onClick,
}: {
  label: string; onClick: () => void
}) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background:    hov ? BG2 : 'transparent',
        border:        `1px solid ${hov ? BD2 : BD1}`,
        borderRadius:  20,
        color:         hov ? T2 : T3,
        fontFamily:    SYS,
        fontSize:      13,
        padding:       '7px 16px',
        cursor:        'pointer',
        lineHeight:    1.4,
        textAlign:     'left',
        transition:    'all 0.12s',
      }}
    >
      {label}
    </button>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────

const FALLBACK_SUGGESTIONS = [
  "What is the current state of US construction spending?",
  "Which states have the most active federal construction awards?",
  "What is the current material cost pressure trend?",
  "How has construction employment changed in the last year?",
  "What does the forecast show for the next 6 months?",
  "Which cities have the highest permit activity right now?",
]

export default function AskPage() {
  const [input,       setInput]       = useState("")
  const [loading,     setLoading]     = useState(false)
  const [answer,      setAnswer]      = useState<Answer | null>(null)
  const [suggestions, setSuggestions] = useState<string[]>(FALLBACK_SUGGESTIONS)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/nlq/popular')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (Array.isArray(d?.questions) && d.questions.length >= 3) {
          setSuggestions(d.questions.slice(0, 6))
        }
      })
      .catch(() => {})
  }, [])

  async function ask(question: string) {
    const q = question.trim()
    if (!q || loading) return
    setInput("")
    setLoading(true)
    setAnswer(null)

    try {
      const res  = await fetch('/api/nlq', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ question: q }),
      })
      const data = await res.json()

      if (!res.ok) {
        setAnswer({
          question: q,
          answer:   data.error ?? "Query failed — try again or browse the dashboard directly.",
          sources:  [],
          error:    true,
        })
      } else {
        setAnswer({
          question: q,
          answer:   data.answer,
          sources:  data.sources_queried ?? [],
        })
      }
    } catch {
      setAnswer({
        question,
        answer:  "Query failed — try again or browse the dashboard directly.",
        sources: [],
        error:   true,
      })
    } finally {
      setLoading(false)
    }
  }

  function onKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask(input) }
  }

  function reset() {
    setAnswer(null)
    setInput("")
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  return (
    <div id="main-content" style={{ minHeight: '100vh', background: BG0, color: T1, fontFamily: SYS }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        a { color: inherit; text-decoration: none; }
        button { font-family: inherit; }
      `}</style>

      <main style={{
        maxWidth:  720,
        margin:    '0 auto',
        padding:   '64px 24px 80px',
        display:   'flex',
        flexDirection: 'column',
        gap:       0,
      }}>

        {/* ── Logo ─────────────────────────────────────────────────────── */}
        <Link href="/dashboard" style={{ display: 'inline-block', marginBottom: 48 }}>
          <Image
            src="/ConstructAIQWhiteLogo.svg"
            alt="ConstructAIQ"
            width={132}
            height={24}
            priority
          />
        </Link>

        {/* ── Headline ─────────────────────────────────────────────────── */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{
            fontFamily:    SYS,
            fontSize:      40,
            fontWeight:    700,
            letterSpacing: '-0.03em',
            lineHeight:    1.1,
            color:         T1,
            marginBottom:  12,
          }}>
            Ask the Market
          </h1>
          <p style={{
            fontFamily: SYS,
            fontSize:   17,
            color:      T3,
            lineHeight: 1.6,
            maxWidth:   540,
          }}>
            AI-powered queries across Census, BLS, FRED, USASpending,
            satellite data, and 40 city permit feeds.
          </p>
        </div>

        {/* ── Input ────────────────────────────────────────────────────── */}
        <div style={{
          display:      'flex',
          gap:          10,
          alignItems:   'stretch',
          marginBottom: answer || loading ? 32 : 0,
        }}>
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={onKey}
            placeholder="Ask anything about the US construction economy…"
            disabled={loading}
            maxLength={500}
            autoFocus
            style={{
              flex:         1,
              background:   BG1,
              border:       `1px solid ${BD1}`,
              borderRadius: 12,
              color:        T1,
              fontFamily:   SYS,
              fontSize:     16,
              padding:      '14px 18px',
              outline:      'none',
              minHeight:    52,
              opacity:      loading ? 0.6 : 1,
              transition:   'border-color 0.15s',
            }}
            onFocus={e => { e.currentTarget.style.borderColor = BLUE }}
            onBlur={e  => { e.currentTarget.style.borderColor = BD1  }}
          />
          <button
            onClick={() => ask(input)}
            disabled={loading || !input.trim()}
            style={{
              background:   loading || !input.trim() ? BG2 : BLUE,
              color:        loading || !input.trim() ? T4 : T1,
              fontFamily:   SYS,
              fontSize:     15,
              fontWeight:   600,
              padding:      '0 24px',
              borderRadius: 12,
              border:       'none',
              minHeight:    52,
              cursor:       loading || !input.trim() ? 'default' : 'pointer',
              flexShrink:   0,
              transition:   'all 0.15s',
              whiteSpace:   'nowrap',
            }}
          >
            {loading ? '…' : 'Ask'}
          </button>
        </div>

        {/* ── Thinking state ───────────────────────────────────────────── */}
        {loading && (
          <div style={{
            display:      'flex',
            alignItems:   'center',
            gap:          12,
            padding:      '20px 24px',
            background:   BG1,
            border:       `1px solid ${BD1}`,
            borderRadius: 12,
            marginBottom: 32,
          }}>
            <ThinkingDots />
            <span style={{ fontFamily: MONO, fontSize: 13, color: T4 }}>
              Querying data sources…
            </span>
          </div>
        )}

        {/* ── Answer card ──────────────────────────────────────────────── */}
        {answer && !loading && (
          <div style={{
            background:   BG1,
            border:       `1px solid ${answer.error ? RED + '44' : BD1}`,
            borderRadius: 12,
            padding:      '24px',
            display:      'flex',
            flexDirection: 'column',
            gap:          16,
            marginBottom: 24,
          }}>
            {/* Question echo */}
            <div style={{
              fontFamily:    MONO,
              fontSize:      11,
              color:         T4,
              letterSpacing: '0.02em',
              lineHeight:    1.5,
              paddingBottom: 12,
              borderBottom:  `1px solid ${BD2}`,
            }}>
              {answer.question}
            </div>

            {/* Answer text */}
            <div style={{
              fontFamily:  SYS,
              fontSize:    15,
              color:       answer.error ? T3 : T2,
              lineHeight:  1.7,
              whiteSpace:  'pre-wrap',
            }}>
              {answer.answer}
            </div>

            {/* Source pills */}
            {answer.sources.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                <span style={{ fontFamily: MONO, fontSize: 10, color: T4, letterSpacing: '0.04em',
                               alignSelf: 'center', marginRight: 4 }}>
                  Sources:
                </span>
                {dedupeSources(answer.sources).map(label => (
                  <span key={label} style={{
                    fontFamily:    MONO,
                    fontSize:      10,
                    color:         T3,
                    background:    BG2,
                    border:        `1px solid ${BD2}`,
                    borderRadius:  5,
                    padding:       '2px 8px',
                    letterSpacing: '0.04em',
                  }}>
                    {label}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Ask another / suggestions ────────────────────────────────── */}
        {answer ? (
          <button
            onClick={reset}
            style={{
              background:    'transparent',
              border:        'none',
              fontFamily:    MONO,
              fontSize:      12,
              color:         BLUE,
              cursor:        'pointer',
              letterSpacing: '0.04em',
              padding:       0,
              textAlign:     'left',
              marginBottom:  40,
            }}
          >
            Ask another question →
          </button>
        ) : !loading && (
          <div style={{ marginTop: 24 }}>
            <div style={{ fontFamily: MONO, fontSize: 10, color: T4, letterSpacing: '0.08em',
                          textTransform: 'uppercase', marginBottom: 14 }}>
              Popular questions
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {suggestions.map(s => (
                <Chip key={s} label={s} onClick={() => ask(s)} />
              ))}
            </div>
          </div>
        )}

        {/* ── Disclaimer ───────────────────────────────────────────────── */}
        <div style={{
          marginTop:     'auto',
          paddingTop:    40,
          fontFamily:    MONO,
          fontSize:      10,
          color:         T4,
          lineHeight:    1.7,
          letterSpacing: '0.02em',
        }}>
          Answers generated by Claude (Anthropic) using US government data only. Every statistic
          links to its source. Rate limited to 10 queries/hour. Not financial advice.
          {' · '}
          <Link href="/dashboard" style={{ color: T4, textDecoration: 'underline', textUnderlineOffset: 3 }}>
            Dashboard
          </Link>
          {' · '}
          <Link href="/methodology" style={{ color: T4, textDecoration: 'underline', textUnderlineOffset: 3 }}>
            Methodology
          </Link>
        </div>

      </main>
    </div>
  )
}
