'use client'
import { useState, useEffect } from 'react'
import { color, font } from '@/lib/theme'
import { getPrefs, setPrefs } from '@/lib/preferences'
import {
  Users, TrendingUp, Package,
  AlertTriangle, Lightbulb,
} from 'lucide-react'

interface Recommendation {
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
  category: 'capacity' | 'bidding' | 'materials' | 'risk' | 'opportunity'
  title:     string
  rationale: string
  action:    string
}

interface RecsData {
  role:            string
  recommendations: Recommendation[]
  as_of:           string
}

// ── Category icons ───────────────────────────────────────────
function CategoryIcon({ cat }: { cat: Recommendation['category'] }) {
  const size = 16
  const props = { size, color: color.t3 }
  switch (cat) {
    case 'capacity':    return <Users {...props} />
    case 'bidding':     return <TrendingUp {...props} />
    case 'materials':   return <Package {...props} />
    case 'risk':        return <AlertTriangle {...props} />
    case 'opportunity': return <Lightbulb {...props} />
  }
}

// ── Priority color ───────────────────────────────────────────
function priorityColor(p: Recommendation['priority']) {
  if (p === 'HIGH')   return color.red
  if (p === 'MEDIUM') return color.amber
  return color.t4
}

// ── Role prompt ──────────────────────────────────────────────
const ROLES = [
  { value: 'contractor', label: 'Contractor' },
  { value: 'lender',     label: 'Lender / Investor' },
  { value: 'supplier',   label: 'Supplier' },
]

function RolePrompt({ onSelect }: { onSelect: () => void }) {
  function pick(role: string) {
    setPrefs({ role })
    onSelect()
  }

  return (
    <div style={{ background:color.bg1, borderRadius:12,
      border:`1px solid ${color.bd1}`, padding:'24px' }}>
      <div style={{ fontFamily:font.sys, fontSize:14,
        color:color.t2, marginBottom:16, lineHeight:1.6 }}>
        Tell us your role for personalised recommendations.
      </div>
      <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
        {ROLES.map(r => (
          <button key={r.value} onClick={() => pick(r.value)}
            style={{
              background: color.bg2,
              border:`1px solid ${color.bd1}`,
              borderRadius:8, padding:'9px 18px',
              fontFamily:font.sys, fontSize:13,
              color:color.t1, cursor:'pointer',
              fontWeight:500,
            }}>
            {r.label}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Main component ───────────────────────────────────────────
interface Props {
  markets?: string[]
}

export function RecommendationsCard({ markets = [] }: Props) {
  const [role, setRole]     = useState<string | null>(null)
  const [data, setData]     = useState<RecsData | null>(null)
  const [loading, setLoading] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  // Read role from prefs on mount
  useEffect(() => {
    setRole(getPrefs().role ?? null)
  }, [refreshKey])

  // Fetch recommendations when role is known
  useEffect(() => {
    if (!role) return
    setLoading(true)
    const params = new URLSearchParams({ role })
    if (markets.length > 0)
      params.set('markets', markets.join(','))
    fetch(`/api/recommendations?${params.toString()}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => setData(d as RecsData))
      .finally(() => setLoading(false))
  }, [role, markets.join(',')])  // eslint-disable-line

  // ── Section header label ─────────────────────────────────
  const sectionLabel = (
    <div style={{ fontFamily:font.mono, fontSize:10,
      color:color.t4, letterSpacing:'0.1em',
      textTransform:'uppercase', marginBottom:14 }}>
      Based on your profile
      {role && (
        <button
          onClick={() => { setPrefs({ role: null }); setRefreshKey(k => k+1) }}
          style={{ fontFamily:font.mono, fontSize:9,
            color:color.t4, background:'transparent',
            border:'none', cursor:'pointer',
            marginLeft:12, textDecoration:'underline',
            textTransform:'uppercase', letterSpacing:'0.06em' }}>
          Change role
        </button>
      )}
    </div>
  )

  // ── No role yet ──────────────────────────────────────────
  if (!role) {
    return (
      <div>
        {sectionLabel}
        <RolePrompt onSelect={() => setRefreshKey(k => k+1)} />
      </div>
    )
  }

  // ── Loading ──────────────────────────────────────────────
  if (loading || !data) {
    return (
      <div>
        {sectionLabel}
        <div style={{ background:color.bg1, borderRadius:12,
          border:`1px solid ${color.bd1}`,
          height:120, display:'flex',
          alignItems:'center', justifyContent:'center' }}>
          <span style={{ fontFamily:font.mono, fontSize:11,
            color:color.t4 }}>
            Loading recommendations…
          </span>
        </div>
      </div>
    )
  }

  // ── Recommendations ──────────────────────────────────────
  return (
    <div>
      {sectionLabel}
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {data.recommendations.map((rec, i) => {
          const pc = priorityColor(rec.priority)
          return (
            <div key={i} style={{
              background:color.bg1, borderRadius:12,
              border:`1px solid ${color.bd1}`,
              borderLeft:`3px solid ${pc}`,
              padding:'16px 20px',
              display:'flex', gap:14,
            }}>
              {/* Icon */}
              <div style={{ marginTop:2, flexShrink:0 }}>
                <CategoryIcon cat={rec.category} />
              </div>

              {/* Content */}
              <div style={{ flex:1,
                display:'flex', flexDirection:'column', gap:4 }}>
                {/* Title + priority */}
                <div style={{ display:'flex',
                  alignItems:'center', gap:8,
                  flexWrap:'wrap' }}>
                  <span style={{ fontFamily:font.sys,
                    fontSize:14, fontWeight:600,
                    color:color.t1 }}>
                    {rec.title}
                  </span>
                  <span style={{ fontFamily:font.mono,
                    fontSize:9, fontWeight:700,
                    letterSpacing:'0.08em', color:pc,
                    background: pc + '20',
                    padding:'2px 7px', borderRadius:20 }}>
                    {rec.priority}
                  </span>
                </div>

                {/* Rationale */}
                <div style={{ fontFamily:font.sys,
                  fontSize:13, color:color.t3,
                  lineHeight:1.6 }}>
                  {rec.rationale}
                </div>

                {/* Action */}
                <div style={{ fontFamily:font.sys,
                  fontSize:13, color:color.amber,
                  fontWeight:500, marginTop:2 }}>
                  → {rec.action}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ marginTop:10, fontFamily:font.mono,
        fontSize:10, color:color.t4 }}>
        Based on {ROLES.find(r => r.value === role)?.label ?? role}{' '}
        profile · as of {data.as_of}
      </div>
    </div>
  )
}
