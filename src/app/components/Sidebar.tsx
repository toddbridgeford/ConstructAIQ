"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard, TrendingUp, Building2, MapPin, FolderOpen,
  Radio, BarChart2, AlertTriangle, MessageSquare,
  BookOpen, PieChart, Newspaper, Mail, Calendar, Layers, ScanSearch, Globe2, FileText,
  DollarSign, Activity, ArrowLeftRight, type LucideIcon,
} from "lucide-react"
import { color, font, layout as L, type as TS } from "@/lib/theme"
import { getPrefs, removeMarket, PREF_EVENT, type UserPreferences } from "@/lib/preferences"

// Simple display-name lookup for known city codes
const CITY_LABELS: Record<string, string> = {
  PHX: 'Phoenix, AZ',  DFW: 'Dallas-Ft Worth, TX', AUS: 'Austin, TX',
  HOU: 'Houston, TX',  CHI: 'Chicago, IL',          NYC: 'New York, NY',
  LAX: 'Los Angeles, CA', SEA: 'Seattle, WA',        DEN: 'Denver, CO',
  ATL: 'Atlanta, GA',  MIA: 'Miami, FL',             BOS: 'Boston, MA',
  SFO: 'San Francisco, CA', LAS: 'Las Vegas, NV',    PDX: 'Portland, OR',
  SAN: 'San Diego, CA', MCO: 'Orlando, FL',          CLT: 'Charlotte, NC',
  MSP: 'Minneapolis, MN', SLC: 'Salt Lake City, UT', SAC: 'Sacramento, CA',
  SJC: 'San Jose, CA', TPA: 'Tampa, FL',             IND: 'Indianapolis, IN',
  CMH: 'Columbus, OH', JAX: 'Jacksonville, FL',      ABQ: 'Albuquerque, NM',
  OMA: 'Omaha, NE',    TUL: 'Tulsa, OK',             OKC: 'Oklahoma City, OK',
}

export type SidebarMode = 'full' | 'icon' | 'hidden'

interface NavItem {
  label: string
  href:  string
  Icon:  LucideIcon
}

const NAV: NavItem[] = [
  { label: "Overview",           href: "/dashboard",           Icon: LayoutDashboard },
  { label: "Forecast",           href: "/dashboard#forecast",  Icon: TrendingUp      },
  { label: "Federal Pipeline",   href: "/federal",             Icon: Building2       },
  { label: "City Permits",       href: "/permits",             Icon: MapPin          },
  { label: "Material Costs",     href: "/materials",           Icon: BarChart2       },
  { label: "Market Intelligence", href: "/intelligence",        Icon: Globe2          },
  { label: "Sectors",            href: "/sectors",             Icon: Layers          },
  { label: "Projects",           href: "/projects",            Icon: FolderOpen      },
  { label: "Satellite",          href: "/ground-signal",       Icon: Radio           },
  { label: "Reality Gap",        href: "/reality-gap",         Icon: ScanSearch      },
  { label: "Data Calendar",      href: "/calendar",            Icon: Calendar        },
  { label: "WARN Act",           href: "/dashboard#signals",   Icon: AlertTriangle   },
  { label: "Ask the Market",     href: "/ask",                 Icon: MessageSquare   },
  { label: "Research",           href: "/research",            Icon: Newspaper       },
  { label: "My Portfolio",       href: "/portfolio",           Icon: PieChart        },
]

const BOTTOM: NavItem[] = [
  { label: "Methodology", href: "/methodology", Icon: BookOpen },
]

function toSectionId(href: string): string | null {
  if (href === '/dashboard') return 'overview'
  const m = href.match(/^\/dashboard#(.+)$/)
  return m ? m[1] : null
}

function itemIsActive(href: string, pathname: string, activeSection?: string): boolean {
  const sec = toSectionId(href)
  if (sec !== null && pathname === '/dashboard') return activeSection === sec
  if (href.includes('#')) return false
  return pathname === href || pathname.startsWith(href + '/')
}

function computeMode(): SidebarMode {
  if (typeof window === 'undefined') return 'full'
  if (window.innerWidth < 768)  return 'hidden'
  if (window.innerWidth < 1024) return 'icon'
  return 'full'
}

interface Props {
  mode?:          SidebarMode
  activeSection?: string
  onNavigate?:    (section: string) => void
}

export function Sidebar({ mode: modeProp, activeSection, onNavigate }: Props) {
  const pathname                  = usePathname()
  const [mode, setMode]           = useState<SidebarMode>('full')
  const [prefs, setPrefsState]    = useState<UserPreferences>(() => getPrefs())
  const [calBadge, setCalBadge]   = useState<string | null>(null)

  useEffect(() => {
    const update = () => setMode(modeProp ?? computeMode())
    update()
    if (!modeProp) {
      window.addEventListener('resize', update)
      return () => window.removeEventListener('resize', update)
    }
  }, [modeProp])

  // Sync prefs from same-tab and cross-tab changes
  useEffect(() => {
    const sync = () => setPrefsState(getPrefs())
    window.addEventListener(PREF_EVENT as keyof WindowEventMap, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(PREF_EVENT as keyof WindowEventMap, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  // Check for releases today or tomorrow
  useEffect(() => {
    fetch('/api/calendar')
      .then(r => r.json())
      .then(d => {
        const events: { date: string }[] = d.events ?? []
        const now   = new Date(); now.setHours(0, 0, 0, 0)
        const today = now.toISOString().slice(0, 10)
        const tomD  = new Date(now); tomD.setDate(now.getDate() + 1)
        const tom   = tomD.toISOString().slice(0, 10)
        if (events.some(e => e.date === today))   setCalBadge('Today')
        else if (events.some(e => e.date === tom)) setCalBadge('Tomorrow')
      })
      .catch(() => {})
  }, [])

  if (mode === 'hidden') return null

  const W   = mode === 'full' ? L.sidebar : 64
  const SYS = font.sys

  return (
    <nav
      style={{
        position:    'fixed',
        top:         0,
        left:        0,
        bottom:      0,
        width:       W,
        background:  color.bg1,
        borderRight: `1px solid ${color.bd1}`,
        display:     'flex',
        flexDirection: 'column',
        zIndex:      400,
        overflowY:   'auto',
        overflowX:   'hidden',
        transition:  'width 0.2s ease',
        fontFamily:  SYS,
      }}
    >
      {/* Logo */}
      <div style={{
        height:     64,
        display:    'flex',
        alignItems: 'center',
        padding:    mode === 'full' ? '0 16px' : '0',
        justifyContent: mode === 'full' ? 'flex-start' : 'center',
        borderBottom: `1px solid ${color.bd1}`,
        flexShrink: 0,
      }}>
        {mode === 'full' ? (
          <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center' }}>
            <Image
              src="/ConstructAIQWhiteLogo.svg"
              alt="ConstructAIQ"
              width={132}
              height={24}
              priority
            />
          </Link>
        ) : (
          <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Image
              src="/ConstructAIQWhiteLogo.svg"
              alt="ConstructAIQ"
              width={28}
              height={28}
              priority
              style={{ objectFit: 'contain' }}
            />
          </Link>
        )}
      </div>

      {/* Primary nav */}
      <div style={{ flex: 1, padding: '8px 0', overflowY: 'auto' }}>
        {NAV.map(({ label, href, Icon }) => {
          const sec    = toSectionId(href)
          const active = itemIsActive(href, pathname, activeSection)
          const click  = sec !== null && pathname === '/dashboard' && onNavigate
            ? () => onNavigate(sec)
            : undefined
          const badge  = href === '/calendar' && calBadge ? calBadge : undefined
          return (
            <div key={href}>
              <NavRow
                href={href}
                label={label}
                Icon={Icon}
                active={active}
                iconOnly={mode === 'icon'}
                onClick={click}
                badge={badge}
              />
            </div>
          )
        })}

        {/* Divider */}
        <div style={{
          height:   1,
          margin:   '8px 12px',
          background: color.bd1,
        }} />

        {/* ── My Markets ─────────────────────────────────────────────── */}
        {mode === 'full' && (
          <div style={{ padding: '10px 16px 4px' }}>
            <div style={{
              display:       'flex',
              alignItems:    'center',
              justifyContent:'space-between',
              marginBottom:  8,
            }}>
              <span style={{ ...TS.label, color: color.t4 }}>My Markets</span>
              {prefs.markets.length >= 2 && (
                <Link href="/portfolio" style={{
                  fontFamily:    font.mono,
                  fontSize:      10,
                  color:         color.blue,
                  letterSpacing: '0.04em',
                  textDecoration:'none',
                }}>
                  View side-by-side →
                </Link>
              )}
            </div>

            {prefs.markets.length === 0 ? (
              <p style={{ fontFamily: font.sys, fontSize: 12, color: color.t4, lineHeight: 1.5, marginBottom: 8 }}>
                Add markets from the{' '}
                <Link href="/permits" style={{ color: color.blue, textDecoration: 'none' }}>Permits page</Link>.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 6 }}>
                {prefs.markets.map(code => (
                  <div
                    key={code}
                    style={{
                      display:        'flex',
                      alignItems:     'center',
                      justifyContent: 'space-between',
                      gap:            6,
                      borderRadius:   6,
                      padding:        '4px 6px 4px 2px',
                    }}
                  >
                    <Link
                      href={`/permits/${code.toLowerCase()}`}
                      style={{
                        fontFamily:   font.sys,
                        fontSize:     13,
                        color:        color.t2,
                        textDecoration: 'none',
                        minWidth:     0,
                        overflow:     'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace:   'nowrap',
                        flex:         1,
                      }}
                    >
                      {CITY_LABELS[code] ?? code}
                    </Link>
                    <button
                      onClick={() => { removeMarket(code); setPrefsState(getPrefs()) }}
                      title={`Remove ${code}`}
                      style={{
                        background:  'none',
                        border:      'none',
                        color:       color.t4,
                        cursor:      'pointer',
                        fontSize:    12,
                        lineHeight:  1,
                        padding:     '2px 4px',
                        borderRadius: 4,
                        flexShrink:  0,
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            <Link
              href="/permits"
              style={{
                display:       'block',
                fontFamily:    font.mono,
                fontSize:      10,
                color:         color.blue,
                letterSpacing: '0.06em',
                marginBottom:  8,
                textDecoration: 'none',
              }}
            >
              + Add market
            </Link>

            {/* My Brief shortcut */}
            <NavRow
              href="/my-brief"
              label="My Brief"
              Icon={FileText}
              active={pathname === '/my-brief'}
              iconOnly={false}
            />
          </div>
        )}

        {/* Subscribe to The Signal */}
        {mode === 'full' && (
          <>
            <div style={{ height: 1, margin: '4px 12px 8px', background: color.bd1 }} />
            <div style={{ padding: '10px 16px 6px' }}>
              <div style={{ ...TS.label, color: color.t4, marginBottom: 8 }}>The Signal</div>
              <Link
                href="/subscribe"
                style={{
                  display:        'flex',
                  alignItems:     'center',
                  gap:            8,
                  background:     color.amberDim,
                  border:         `1px solid ${color.amber}33`,
                  borderRadius:   8,
                  padding:        '9px 12px',
                  textDecoration: 'none',
                }}
              >
                <Mail size={13} color={color.amber} strokeWidth={2} />
                <span style={{ fontFamily: font.sys, fontSize: 12, color: color.amber, fontWeight: 500 }}>
                  Subscribe to The Signal
                </span>
              </Link>
            </div>
          </>
        )}

        {/* Second divider before bottom items */}
        {mode === 'full' && (
          <div style={{ height: 1, margin: '4px 12px 8px', background: color.bd1 }} />
        )}

        {BOTTOM.map(({ label, href, Icon }) => (
          <NavRow
            key={href}
            href={href}
            label={label}
            Icon={Icon}
            active={itemIsActive(href, pathname)}
            iconOnly={mode === 'icon'}
            muted
          />
        ))}

        {/* ── More Tools ─────────────────────────────────────────────── */}
        {mode === 'full' && (
          <div style={{ height: 1, margin: '4px 12px 0', background: color.bd1 }} />
        )}
        {mode === 'full' && (
          <div style={{ padding: '10px 16px 4px' }}>
            <div style={{ ...TS.label, color: color.t4, marginBottom: 4 }}>More Tools</div>
          </div>
        )}
        {[
          { label: 'Cost Index',     href: '/ccci',     Icon: DollarSign    },
          { label: 'Distress Index', href: '/distress', Icon: Activity      },
          { label: 'Sector Compare', href: '/compare',  Icon: ArrowLeftRight },
        ].map(({ label, href, Icon }) => (
          <NavRow
            key={href}
            href={href}
            label={label}
            Icon={Icon}
            active={itemIsActive(href, pathname)}
            iconOnly={mode === 'icon'}
            muted
          />
        ))}
      </div>

    </nav>
  )
}

interface NavRowProps {
  href:     string
  label:    string
  Icon:     LucideIcon
  active:   boolean
  iconOnly: boolean
  muted?:   boolean
  onClick?: () => void
  badge?:   string
}

function NavRow({ href, label, Icon, active, iconOnly, muted, onClick, badge }: NavRowProps) {
  const [hovered, setHovered] = useState(false)

  const textColor = active ? color.t1 : hovered ? color.t1 : muted ? color.t4 : color.t3

  const sharedStyle: React.CSSProperties = {
    display:        'flex',
    alignItems:     'center',
    gap:            10,
    height:         44,
    width:          '100%',
    padding:        iconOnly ? '0' : '0 16px',
    justifyContent: iconOnly ? 'center' : 'flex-start',
    color:          textColor,
    background:     active ? `rgba(255,255,255,0.06)` : hovered ? `rgba(255,255,255,0.03)` : 'transparent',
    borderLeft:     active ? `3px solid ${color.blue}` : '3px solid transparent',
    fontSize:       14,
    fontWeight:     active ? 500 : 400,
    transition:     'all 0.12s ease',
    textDecoration: 'none',
    cursor:         'pointer',
    userSelect:     'none',
    fontFamily:     font.sys,
  }

  const content = (
    <>
      <Icon size={16} strokeWidth={active ? 2.2 : 1.8} style={{ flexShrink: 0 }} />
      {!iconOnly && <span style={{ fontSize: 14, lineHeight: 1, flex: 1 }}>{label}</span>}
      {!iconOnly && badge && (
        <span style={{
          fontFamily:    font.mono,
          fontSize:      9,
          fontWeight:    700,
          letterSpacing: '0.06em',
          color:         color.amber,
          background:    color.amberDim,
          border:        `1px solid ${color.amber}55`,
          borderRadius:  5,
          padding:       '2px 6px',
          flexShrink:    0,
        }}>
          {badge.toUpperCase()}
        </span>
      )}
    </>
  )

  if (onClick) {
    return (
      <button
        onClick={onClick}
        title={iconOnly ? label : undefined}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{ ...sharedStyle, border: 'none', background: sharedStyle.background as string }}
      >
        {content}
      </button>
    )
  }

  return (
    <Link
      href={href}
      title={iconOnly ? label : undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={sharedStyle}
    >
      {content}
    </Link>
  )
}
