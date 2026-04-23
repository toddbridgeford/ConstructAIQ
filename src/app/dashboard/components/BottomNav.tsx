"use client"
import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { TrendingUp, Building2, HardHat, Radio, MessageSquare, Bell, PieChart, type LucideIcon } from "lucide-react"
import { color, font } from "@/lib/theme"
import { NotificationSettings } from "@/app/components/NotificationSettings"
import { getPrefs, PREF_EVENT } from "@/lib/preferences"

const MONO = font.mono

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
}

interface Tab {
  id:     string
  label:  string
  href:   string | null
  scroll: string | null
  Icon:   LucideIcon
}

const TABS_DEFAULT: Tab[] = [
  { id: "home",      label: "Home",      href: "/dashboard", scroll: "forecast",  Icon: TrendingUp   },
  { id: "federal",   label: "Federal",   href: "/federal",   scroll: null,        Icon: Building2    },
  { id: "projects",  label: "Projects",  href: "/projects",  scroll: null,        Icon: HardHat      },
  { id: "satellite", label: "Satellite", href: "/dashboard", scroll: "satellite", Icon: Radio        },
  { id: "ask",       label: "Ask AI",    href: "/ask",       scroll: null,        Icon: MessageSquare},
]

const TABS_PORTFOLIO: Tab[] = [
  { id: "portfolio", label: "Portfolio", href: "/portfolio", scroll: null,        Icon: PieChart     },
  { id: "federal",   label: "Federal",   href: "/federal",   scroll: null,        Icon: Building2    },
  { id: "projects",  label: "Projects",  href: "/projects",  scroll: null,        Icon: HardHat      },
  { id: "satellite", label: "Satellite", href: "/dashboard", scroll: "satellite", Icon: Radio        },
  { id: "ask",       label: "Ask AI",    href: "/ask",       scroll: null,        Icon: MessageSquare},
]

function useActiveTab(pathname: string): string {
  if (pathname.startsWith("/projects"))  return "projects"
  if (pathname.startsWith("/federal"))   return "federal"
  if (pathname.startsWith("/ask"))       return "ask"
  if (pathname.startsWith("/portfolio")) return "portfolio"
  if (pathname === "/dashboard")         return "home"
  return "home"
}

export function BottomNav() {
  const pathname  = usePathname()
  const activeId  = useActiveTab(pathname)
  const [showNotif,    setShowNotif]    = useState(false)
  const [hasBadge,     setHasBadge]     = useState(false)
  const [hasMarkets,   setHasMarkets]   = useState(false)

  useEffect(() => {
    if ('Notification' in window) {
      setHasBadge(Notification.permission === 'default')
    }
    setHasMarkets(getPrefs().markets.length > 0)
  }, [])

  useEffect(() => {
    const sync = () => setHasMarkets(getPrefs().markets.length > 0)
    window.addEventListener(PREF_EVENT as keyof WindowEventMap, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(PREF_EVENT as keyof WindowEventMap, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  const TABS = hasMarkets ? TABS_PORTFOLIO : TABS_DEFAULT

  return (
    <>
      <nav style={{
        position:        "fixed",
        bottom:          0,
        left:            0,
        right:           0,
        zIndex:          300,
        height:          "calc(56px + env(safe-area-inset-bottom, 0px))",
        paddingBottom:   "env(safe-area-inset-bottom, 0px)",
        background:      color.bg1 + "e8",
        backdropFilter:  "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderTop:       `1px solid ${color.bd1}`,
        display:         "flex",
        alignItems:      "stretch",
      }}>
        {TABS.map(tab => {
          const isActive  = activeId === tab.id
          const iconColor = isActive ? color.amber : color.t3
          const lblColor  = isActive ? color.amber : color.t4

          const inner = (
            <div style={{
              display:        "flex",
              flexDirection:  "column",
              alignItems:     "center",
              justifyContent: "center",
              gap:            3,
              minHeight:      44,
              minWidth:       44,
              width:          "100%",
            }}>
              <tab.Icon size={22} color={iconColor} />
              <span style={{
                fontFamily:    MONO,
                fontSize:      9,
                fontWeight:    isActive ? 700 : 400,
                letterSpacing: "0.04em",
                color:         lblColor,
                lineHeight:    1,
              }}>
                {tab.label.toUpperCase()}
              </span>
            </div>
          )

          if (tab.scroll && pathname === "/dashboard") {
            return (
              <button
                key={tab.id}
                onClick={() => scrollTo(tab.scroll!)}
                style={{
                  flex:           1,
                  background:     "transparent",
                  border:         "none",
                  cursor:         "pointer",
                  padding:        0,
                  display:        "flex",
                  alignItems:     "center",
                  justifyContent: "center",
                }}
                aria-label={tab.label}
              >
                {inner}
              </button>
            )
          }

          return (
            <Link
              key={tab.id}
              href={tab.href!}
              style={{
                flex:           1,
                display:        "flex",
                alignItems:     "center",
                justifyContent: "center",
                textDecoration: "none",
              }}
              aria-label={tab.label}
            >
              {inner}
            </Link>
          )
        })}

        {/* Bell — notification settings */}
        <button
          onClick={() => { setShowNotif(true); setHasBadge(false) }}
          aria-label="Signal alerts"
          style={{
            flex:           1,
            background:     "transparent",
            border:         "none",
            cursor:         "pointer",
            padding:        0,
            display:        "flex",
            alignItems:     "center",
            justifyContent: "center",
          }}
        >
          <div style={{
            display:        "flex",
            flexDirection:  "column",
            alignItems:     "center",
            justifyContent: "center",
            gap:            3,
            minHeight:      44,
            minWidth:       44,
            position:       "relative",
          }}>
            <Bell size={22} color={color.t3} />
            {hasBadge && (
              <span style={{
                position:     "absolute",
                top:          4,
                right:        8,
                width:        7,
                height:       7,
                borderRadius: "50%",
                background:   color.red,
                border:       `1.5px solid ${color.bg1}`,
              }} />
            )}
            <span style={{
              fontFamily:    MONO,
              fontSize:      9,
              fontWeight:    400,
              letterSpacing: "0.04em",
              color:         color.t4,
              lineHeight:    1,
            }}>
              ALERTS
            </span>
          </div>
        </button>
      </nav>

      {showNotif && <NotificationSettings onClose={() => setShowNotif(false)} />}
    </>
  )
}
