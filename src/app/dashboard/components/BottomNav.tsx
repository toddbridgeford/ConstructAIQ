"use client"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { TrendingUp, Building2, HardHat, Radio, MessageSquare } from "lucide-react"
import { color, font } from "@/lib/theme"

const MONO = font.mono
const SYS  = font.sys

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
}

interface Tab {
  id:    string
  label: string
  href:  string | null
  scroll: string | null
  Icon:  React.ComponentType<{ size?: number; color?: string }>
}

const TABS: Tab[] = [
  { id: "home",      label: "Home",     href: "/dashboard", scroll: "forecast",  Icon: TrendingUp     },
  { id: "federal",   label: "Federal",  href: "/federal",   scroll: null,        Icon: Building2      },
  { id: "projects",  label: "Projects", href: "/projects",  scroll: null,        Icon: HardHat        },
  { id: "satellite", label: "Satellite",href: "/dashboard", scroll: "satellite", Icon: Radio          },
  { id: "ask",       label: "Ask AI",   href: "/ask",       scroll: null,        Icon: MessageSquare  },
]

function useActiveTab(pathname: string): string {
  if (pathname.startsWith("/projects")) return "projects"
  if (pathname.startsWith("/federal"))  return "federal"
  if (pathname.startsWith("/ask"))      return "ask"
  if (pathname === "/dashboard")        return "home"
  return "home"
}

export function BottomNav() {
  const pathname = usePathname()
  const activeId = useActiveTab(pathname)

  return (
    <nav style={{
      position:     "fixed",
      bottom:       0,
      left:         0,
      right:        0,
      zIndex:       300,
      height:       "calc(56px + env(safe-area-inset-bottom, 0px))",
      paddingBottom:"env(safe-area-inset-bottom, 0px)",
      background:   color.bg1 + "e8",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      borderTop:    `1px solid ${color.bd1}`,
      display:      "flex",
      alignItems:   "stretch",
    }}>
      {TABS.map(tab => {
        const isActive = activeId === tab.id
        const iconColor = isActive ? color.amber : color.t3
        const labelColor = isActive ? color.amber : color.t4

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
              color:         labelColor,
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
                flex:        1,
                background:  "transparent",
                border:      "none",
                cursor:      "pointer",
                padding:     0,
                display:     "flex",
                alignItems:  "center",
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
    </nav>
  )
}
