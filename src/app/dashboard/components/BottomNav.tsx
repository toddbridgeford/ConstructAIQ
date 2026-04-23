'use client'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard, Map, Package,
  MessageCircle, Bell,
  type LucideIcon,
} from 'lucide-react'
import { color, font } from '@/lib/theme'
import { NotificationSettings } from '@/app/components/NotificationSettings'

const MONO = font.mono

interface Tab {
  id:    string
  label: string
  href:  string
  Icon:  LucideIcon
}

// Fixed 5-tab set — never changes based on preferences or state
const BOTTOM_TABS: Tab[] = [
  { id: 'overview',  label: 'Home',      href: '/dashboard', Icon: LayoutDashboard },
  { id: 'markets',   label: 'Markets',   href: '/markets',   Icon: Map             },
  { id: 'materials', label: 'Materials', href: '/materials', Icon: Package         },
  { id: 'ask',       label: 'Ask',       href: '/ask',       Icon: MessageCircle   },
]

function useActiveTab(pathname: string): string {
  if (pathname.startsWith('/markets'))   return 'markets'
  if (pathname.startsWith('/materials')) return 'materials'
  if (pathname.startsWith('/ask'))       return 'ask'
  if (pathname === '/dashboard')         return 'overview'
  return ''
}

export function BottomNav() {
  const pathname = usePathname()
  const activeId = useActiveTab(pathname)
  const [showNotif, setShowNotif] = useState(false)
  const [hasBadge,  setHasBadge]  = useState(false)

  useEffect(() => {
    if ('Notification' in window) {
      setHasBadge(Notification.permission === 'default')
    }
  }, [])

  const tabItem = (tab: Tab) => {
    const isActive  = activeId === tab.id
    const iconColor = isActive ? color.amber : color.t3
    const lblColor  = isActive ? color.amber : color.t4

    return (
      <div style={{
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
        gap:            3,
        minHeight:      44,
        minWidth:       44,
        width:          '100%',
      }}>
        <tab.Icon size={22} color={iconColor} />
        <span style={{
          fontFamily:    MONO,
          fontSize:      9,
          fontWeight:    isActive ? 700 : 400,
          letterSpacing: '0.04em',
          color:         lblColor,
          lineHeight:    1,
        }}>
          {tab.label.toUpperCase()}
        </span>
      </div>
    )
  }

  return (
    <>
      <nav
        aria-label="Main mobile navigation"
        style={{
          position:            'fixed',
          bottom:              0,
          left:                0,
          right:               0,
          zIndex:              300,
          height:              'calc(56px + env(safe-area-inset-bottom, 0px))',
          paddingBottom:       'env(safe-area-inset-bottom, 0px)',
          background:          color.bg1 + 'e8',
          backdropFilter:      'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop:           `1px solid ${color.bd1}`,
          display:             'flex',
          alignItems:          'stretch',
        }}
      >
        {/* Four nav tabs */}
        {BOTTOM_TABS.map(tab => (
          <Link
            key={tab.id}
            href={tab.href}
            aria-label={tab.label}
            aria-current={activeId === tab.id ? 'page' : undefined}
            style={{
              flex:           1,
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              textDecoration: 'none',
            }}
          >
            {tabItem(tab)}
          </Link>
        ))}

        {/* Alerts — fifth slot, opens notification sheet */}
        <button
          onClick={() => { setShowNotif(true); setHasBadge(false) }}
          aria-label="Signal alerts"
          style={{
            flex:           1,
            background:     'transparent',
            border:         'none',
            cursor:         'pointer',
            padding:        0,
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
          }}
        >
          <div style={{
            display:        'flex',
            flexDirection:  'column',
            alignItems:     'center',
            justifyContent: 'center',
            gap:            3,
            minHeight:      44,
            minWidth:       44,
            position:       'relative',
          }}>
            <Bell size={22} color={color.t3} />
            {hasBadge && (
              <span style={{
                position:     'absolute',
                top:          4,
                right:        8,
                width:        7,
                height:       7,
                borderRadius: '50%',
                background:   color.red,
                border:       `1.5px solid ${color.bg1}`,
              }} />
            )}
            <span style={{
              fontFamily:    MONO,
              fontSize:      9,
              fontWeight:    400,
              letterSpacing: '0.04em',
              color:         color.t4,
              lineHeight:    1,
            }}>
              ALERTS
            </span>
          </div>
        </button>
      </nav>

      {showNotif && (
        <NotificationSettings onClose={() => setShowNotif(false)} />
      )}
    </>
  )
}
