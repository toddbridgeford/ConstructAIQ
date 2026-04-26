"use client"
import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { RefreshCw, FileText, AlertCircle, Plus } from "lucide-react"
import { DashboardShell } from "@/app/dashboard/DashboardShell"
import { color, font } from "@/lib/theme"
import {
  getStoredApiKey,
  setStoredApiKey,
  API_KEY_STORAGE_KEY,
} from "@/lib/watchlistClient"

const SYS  = font.sys
const MONO = font.mono

// ── Types ─────────────────────────────────────────────────────────────────────

interface AgentBriefResponse {
  briefing:         string | null
  role:             string
  entities_watched: number
  empty_watchlist?: boolean
  message?:         string
  watchlist?: Array<{ type: string; id: string; label: string }>
  generated_at:     string
  model?:           string
  error?:           string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function roleLabel(role: string): string {
  return role === 'construction professional'
    ? 'General'
    : role.charAt(0).toUpperCase() + role.slice(1)
}

function weekOf(): string {
  const d = new Date()
  const mon = new Date(d)
  mon.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return mon.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

// ── Sub-components ────────────────────────────────────────────────────────────

function PageHeader() {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{
        fontFamily:    MONO,
        fontSize:      10,
        color:         color.t4,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        marginBottom:  8,
      }}>
        Week of {weekOf()}
      </div>
      <h1 style={{
        fontFamily:  SYS,
        fontSize:    26,
        fontWeight:  700,
        color:       color.t1,
        margin:      0,
        lineHeight:  1.2,
      }}>
        My Weekly Brief
      </h1>
      <p style={{
        fontFamily: SYS,
        fontSize:   14,
        color:      color.t4,
        margin:     '8px 0 0',
        lineHeight: 1.5,
      }}>
        AI-generated market intelligence grounded in your watchlist.
      </p>
    </div>
  )
}

function KeyPrompt({ onSave }: { onSave: (key: string) => void }) {
  const [input, setInput]   = useState('')
  const [error, setError]   = useState('')

  function submit() {
    const k = input.trim()
    if (!k) { setError('Enter your API key.'); return }
    if (!k.startsWith('caiq_')) { setError('API keys start with "caiq_". Check your key.'); return }
    setStoredApiKey(k)
    onSave(k)
  }

  return (
    <div style={{
      background:  color.bg1,
      border:      `1px solid ${color.bd1}`,
      borderRadius: 12,
      padding:     40,
      maxWidth:    560,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <FileText size={20} color={color.blue} strokeWidth={1.5} />
        <span style={{ fontFamily: SYS, fontSize: 17, fontWeight: 600, color: color.t1 }}>
          Connect your API key
        </span>
      </div>
      <p style={{ fontFamily: SYS, fontSize: 14, color: color.t3, lineHeight: 1.6, margin: '0 0 24px' }}>
        Your personalized brief is generated from your watchlist.
        Paste your ConstructAIQ API key to get started.
      </p>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          type="text"
          value={input}
          onChange={e => { setInput(e.target.value); setError('') }}
          onKeyDown={e => e.key === 'Enter' && submit()}
          placeholder="caiq_…"
          style={{
            flex:        1,
            background:  color.bg2,
            border:      `1px solid ${error ? color.red : color.bd2}`,
            borderRadius: 8,
            padding:     '10px 14px',
            fontFamily:  MONO,
            fontSize:    13,
            color:       color.t1,
            outline:     'none',
          }}
        />
        <button
          onClick={submit}
          style={{
            background:  color.blue,
            border:      'none',
            borderRadius: 8,
            padding:     '10px 20px',
            fontFamily:  SYS,
            fontSize:    14,
            fontWeight:  600,
            color:       '#fff',
            cursor:      'pointer',
            flexShrink:  0,
          }}
        >
          Connect
        </button>
      </div>
      {error && (
        <p style={{ fontFamily: SYS, fontSize: 12, color: color.red, margin: '8px 0 0' }}>{error}</p>
      )}
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div style={{ maxWidth: 720 }}>
      {[200, 180, 160].map((w, i) => (
        <div key={i} style={{
          height:       16,
          width:        `${w}px`,
          maxWidth:     '100%',
          background:   color.bg3,
          borderRadius: 6,
          marginBottom: 12,
          opacity:      1 - i * 0.15,
        }} />
      ))}
      <div style={{ height: 1, background: color.bd1, margin: '24px 0' }} />
      {[100, 90, 80, 95, 70].map((w, i) => (
        <div key={i} style={{
          height:       14,
          width:        `${w}%`,
          background:   color.bg3,
          borderRadius: 5,
          marginBottom: 10,
        }} />
      ))}
    </div>
  )
}

function EmptyWatchlist() {
  return (
    <div style={{
      background:   color.bg1,
      border:       `1px solid ${color.bd1}`,
      borderRadius: 12,
      padding:      40,
      maxWidth:     560,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <Plus size={18} color={color.t4} strokeWidth={1.5} />
        <span style={{ fontFamily: SYS, fontSize: 15, fontWeight: 600, color: color.t2 }}>
          Your watchlist is empty
        </span>
      </div>
      <p style={{ fontFamily: SYS, fontSize: 14, color: color.t3, lineHeight: 1.65, margin: '0 0 24px' }}>
        Add metros or projects to your watchlist to receive a personalized weekly brief
        grounded in those specific markets.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Link
          href="/opportunity-index"
          style={{
            display:        'inline-flex',
            alignItems:     'center',
            gap:            8,
            background:     color.blue,
            border:         'none',
            borderRadius:   8,
            padding:        '10px 20px',
            fontFamily:     SYS,
            fontSize:       14,
            fontWeight:     600,
            color:          '#fff',
            textDecoration: 'none',
            width:          'fit-content',
          }}
        >
          Browse Opportunity Index →
        </Link>
        <Link
          href="/dashboard#signals"
          style={{
            fontFamily:     SYS,
            fontSize:       13,
            color:          color.blue,
            textDecoration: 'none',
          }}
        >
          Or view the generic weekly brief on the dashboard
        </Link>
      </div>
    </div>
  )
}

function BriefCard({
  data,
  onRefresh,
  refreshing,
}: {
  data:       AgentBriefResponse
  onRefresh:  () => void
  refreshing: boolean
}) {
  const paras   = (data.briefing ?? '').split(/\n\n+/)
  const genDate = new Date(data.generated_at).toLocaleString('en-US', {
    month:   'long',
    day:     'numeric',
    hour:    'numeric',
    minute:  '2-digit',
  })

  return (
    <div style={{ maxWidth: 720 }}>
      {/* Meta strip */}
      <div style={{
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        flexWrap:       'wrap',
        gap:            12,
        marginBottom:   24,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            fontFamily:    MONO,
            fontSize:      9,
            fontWeight:    600,
            letterSpacing: '0.12em',
            textTransform: 'uppercase' as const,
            color:         color.blue,
            background:    color.blueDim,
            border:        `1px solid ${color.blue}33`,
            borderRadius:  4,
            padding:       '3px 8px',
          }}>
            {roleLabel(data.role)}
          </span>
          <span style={{
            fontFamily:    MONO,
            fontSize:      9,
            color:         color.t4,
            letterSpacing: '0.08em',
            textTransform: 'uppercase' as const,
          }}>
            {data.entities_watched} {data.entities_watched === 1 ? 'market' : 'markets'} watched
          </span>
        </div>
        <button
          onClick={onRefresh}
          disabled={refreshing}
          style={{
            display:     'flex',
            alignItems:  'center',
            gap:         6,
            background:  'none',
            border:      `1px solid ${color.bd2}`,
            borderRadius: 7,
            padding:     '6px 14px',
            fontFamily:  SYS,
            fontSize:    12,
            color:       color.t3,
            cursor:      refreshing ? 'default' : 'pointer',
            opacity:     refreshing ? 0.5 : 1,
          }}
        >
          <RefreshCw size={12} strokeWidth={2} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
          {refreshing ? 'Generating…' : 'Refresh'}
        </button>
      </div>

      {/* Briefing text */}
      <div style={{
        background:   color.bg1,
        border:       `1px solid ${color.bd1}`,
        borderRadius: 12,
        padding:      '28px 32px',
        marginBottom: 24,
      }}>
        {paras.map((para, i) => (
          <p key={i} style={{
            fontFamily:  SYS,
            fontSize:    15,
            color:       color.t2,
            lineHeight:  1.75,
            margin:      i < paras.length - 1 ? '0 0 18px' : 0,
          }}>
            {para}
          </p>
        ))}
      </div>

      {/* Watchlist entities */}
      {data.watchlist && data.watchlist.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{
            fontFamily:    MONO,
            fontSize:      9,
            color:         color.t4,
            letterSpacing: '0.12em',
            textTransform: 'uppercase' as const,
            marginBottom:  10,
          }}>
            Markets in this brief
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {data.watchlist.map(e => (
              <span key={`${e.type}-${e.id}`} style={{
                fontFamily:    MONO,
                fontSize:      11,
                color:         color.t3,
                background:    color.bg2,
                border:        `1px solid ${color.bd1}`,
                borderRadius:  5,
                padding:       '3px 10px',
              }}>
                {e.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        flexWrap:       'wrap',
        gap:            8,
      }}>
        <span style={{ fontFamily: MONO, fontSize: 11, color: color.t4 }}>
          Generated {genDate} · {data.model ?? 'claude-sonnet-4-6'}
        </span>
        <Link href="/dashboard/components/WatchlistCard" style={{ display: 'none' }} />
        <Link href="/opportunity-index" style={{
          fontFamily:     MONO,
          fontSize:       11,
          color:          color.blue,
          textDecoration: 'none',
          letterSpacing:  '0.04em',
        }}>
          Manage watchlist →
        </Link>
      </div>
    </div>
  )
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div style={{
      display:      'flex',
      alignItems:   'center',
      gap:          10,
      background:   color.redDim,
      border:       `1px solid ${color.red}33`,
      borderRadius: 10,
      padding:      '14px 18px',
      maxWidth:     560,
    }}>
      <AlertCircle size={16} color={color.red} strokeWidth={1.5} />
      <span style={{ fontFamily: SYS, fontSize: 13, color: color.t2, lineHeight: 1.5 }}>
        {message}
      </span>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function MyBriefPage() {
  const [apiKey,     setApiKey]     = useState<string | null>(null)
  const [data,       setData]       = useState<AgentBriefResponse | null>(null)
  const [loading,    setLoading]    = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error,      setError]      = useState<string | null>(null)
  const [hydrated,   setHydrated]   = useState(false)

  useEffect(() => {
    setHydrated(true)
    const stored = getStoredApiKey()
    setApiKey(stored)
  }, [])

  const fetchBrief = useCallback(async (key: string, isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else            setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/agent/weekly?api_key=${encodeURIComponent(key)}`)
      const json = await res.json() as AgentBriefResponse
      if (!res.ok) {
        setError(json.error ?? `Request failed (${res.status})`)
      } else {
        setData(json)
      }
    } catch {
      setError('Failed to reach the server. Check your connection and try again.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    if (apiKey) fetchBrief(apiKey)
  }, [apiKey, fetchBrief])

  const handleKeySave = (key: string) => {
    setApiKey(key)
    setData(null)
  }

  const handleRefresh = () => {
    if (apiKey) fetchBrief(apiKey, true)
  }

  if (!hydrated) return null

  return (
    <DashboardShell>
      <div style={{
        padding:   '40px 28px 60px',
        maxWidth:  800,
        margin:    '0 auto',
      }}>
        <PageHeader />

        {!apiKey && (
          <KeyPrompt onSave={handleKeySave} />
        )}

        {apiKey && loading && (
          <LoadingSkeleton />
        )}

        {apiKey && !loading && error && (
          <ErrorBanner message={error} />
        )}

        {apiKey && !loading && !error && data && (
          <>
            {data.empty_watchlist ? (
              <EmptyWatchlist />
            ) : data.briefing ? (
              <BriefCard data={data} onRefresh={handleRefresh} refreshing={refreshing} />
            ) : (
              <ErrorBanner message={data.error ?? 'No briefing available.'} />
            )}
          </>
        )}

        {/* Key management footer — shown when a key is connected */}
        {apiKey && (
          <div style={{
            marginTop:  40,
            paddingTop: 24,
            borderTop:  `1px solid ${color.bd1}`,
          }}>
            <span style={{ fontFamily: MONO, fontSize: 11, color: color.t4 }}>
              Connected key: {apiKey.slice(0, 12)}…
            </span>
            <button
              onClick={() => {
                localStorage.removeItem(API_KEY_STORAGE_KEY)
                setApiKey(null)
                setData(null)
              }}
              style={{
                background:  'none',
                border:      'none',
                fontFamily:  MONO,
                fontSize:    11,
                color:       color.t4,
                cursor:      'pointer',
                marginLeft:  16,
                textDecoration: 'underline',
              }}
            >
              Disconnect
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </DashboardShell>
  )
}
