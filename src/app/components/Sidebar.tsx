"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard, TrendingUp, Building2, MapPin, FolderOpen,
  Radio, BarChart2, AlertTriangle, MessageSquare,
  BookOpen, Key, type LucideIcon,
} from "lucide-react"
import { color, font, layout as L } from "@/lib/theme"

export type SidebarMode = 'full' | 'icon' | 'hidden'

interface NavItem {
  label: string
  href:  string
  Icon:  LucideIcon
}

const NAV: NavItem[] = [
  { label: "Overview",         href: "/dashboard",          Icon: LayoutDashboard },
  { label: "Forecast",         href: "/dashboard#forecast",  Icon: TrendingUp      },
  { label: "Federal Pipeline", href: "/federal",             Icon: Building2       },
  { label: "City Permits",     href: "/permits",             Icon: MapPin          },
  { label: "Projects",         href: "/projects",            Icon: FolderOpen      },
  { label: "Satellite",        href: "/ground-signal",       Icon: Radio           },
  { label: "Materials",        href: "/dashboard#materials", Icon: BarChart2       },
  { label: "WARN Act",         href: "/dashboard#signals",   Icon: AlertTriangle   },
  { label: "Ask the Market",   href: "/ask",                 Icon: MessageSquare   },
]

const BOTTOM: NavItem[] = [
  { label: "Methodology", href: "/methodology", Icon: BookOpen },
  { label: "API Access",  href: "/api-access",  Icon: Key      },
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
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [dataAsOf, setDataAsOf]   = useState<string | null>(null)

  useEffect(() => {
    const update = () => setMode(modeProp ?? computeMode())
    update()
    if (!modeProp) {
      window.addEventListener('resize', update)
      return () => window.removeEventListener('resize', update)
    }
  }, [modeProp])

  useEffect(() => {
    const now = new Date()
    setLastUpdated(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
    setDataAsOf(now.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }))
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
          return (
            <NavRow
              key={href}
              href={href}
              label={label}
              Icon={Icon}
              active={active}
              iconOnly={mode === 'icon'}
              onClick={click}
            />
          )
        })}

        {/* Divider */}
        <div style={{
          height:   1,
          margin:   '8px 12px',
          background: color.bd1,
        }} />

        {BOTTOM.map(({ label, href, Icon }) => (
          <NavRow
            key={href}
            href={href}
            label={label}
            Icon={Icon}
            active={isActive(href, pathname)}
            iconOnly={mode === 'icon'}
            muted
          />
        ))}
      </div>

      {/* Live indicator + timestamps */}
      <div style={{
        borderTop:  `1px solid ${color.bd1}`,
        padding:    mode === 'full' ? '12px 16px' : '12px 0',
        flexShrink: 0,
        display:    'flex',
        flexDirection: 'column',
        gap:        6,
        alignItems: mode === 'full' ? 'flex-start' : 'center',
      }}>
        {/* Live dot + last updated */}
        <div style={{
          display:    'flex',
          alignItems: 'center',
          gap:        8,
        }}>
          <span
            style={{
              width:        7,
              height:       7,
              borderRadius: '50%',
              background:   color.green,
              boxShadow:    `0 0 8px ${color.green}`,
              flexShrink:   0,
              display:      'inline-block',
              animation:    'pulse 2s infinite',
            }}
          />
          {mode === 'full' && lastUpdated && (
            <span style={{
              fontSize:      11,
              fontFamily:    font.mono,
              color:         color.t3,
              letterSpacing: '0.04em',
            }}>
              {lastUpdated}
            </span>
          )}
        </div>

        {/* Data as of */}
        {mode === 'full' && dataAsOf && (
          <span style={{
            fontSize:      10,
            fontFamily:    font.mono,
            color:         color.t4,
            letterSpacing: '0.04em',
          }}>
            Data as of: {dataAsOf}
          </span>
        )}
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
}

function NavRow({ href, label, Icon, active, iconOnly, muted, onClick }: NavRowProps) {
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
      {!iconOnly && <span style={{ fontSize: 14, lineHeight: 1 }}>{label}</span>}
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
