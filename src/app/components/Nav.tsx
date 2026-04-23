"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Bell } from "lucide-react"
import { color, font, radius } from "@/lib/theme"
import { NotificationSettings } from "@/app/components/NotificationSettings"

const SYS  = font.sys
const MONO = font.mono

const BASE_LINKS = [
  { label: "Intelligence", href: "/dashboard"    },
  { label: "Portfolio",    href: "/portfolio"    },
  { label: "Projects",     href: "/projects"     },
  { label: "Ask AI",       href: "/ask"          },
  { label: "Cost Estimate",href: "/cost-estimate"},
  { label: "Globe",        href: "/globe"        },
  { label: "Markets",      href: "/markets"      },
  { label: "Tools",        href: "/market-check" },
  { label: "Pricing",      href: "/pricing"      },
  { label: "About",        href: "/about"        },
]

interface NavProps {
  /** If true the nav background starts transparent and frosts on scroll. Default: false (always frosted). */
  transparent?: boolean
  ctaLabel?: string
  ctaHref?: string
}

export function Nav({ transparent = false, ctaLabel = "Dashboard →", ctaHref = "/dashboard" }: NavProps) {
  const [menuOpen,    setMenuOpen]    = useState(false)
  const [scrolled,    setScrolled]    = useState(false)
  const [showNotif,   setShowNotif]   = useState(false)
  const [bellBadge,   setBellBadge]   = useState(false)

  useEffect(() => {
    if ('Notification' in window) setBellBadge(Notification.permission === 'default')
  }, [])

  useEffect(() => {
    if (!transparent) return
    const handler = () => setScrolled(window.scrollY > 40)
    window.addEventListener("scroll", handler, { passive: true })
    return () => window.removeEventListener("scroll", handler)
  }, [transparent])

  const navBg = transparent && !scrolled && !menuOpen
    ? "transparent"
    : color.bg1 + "ee"

  return (
    <>
      <style>{`
        .nav-link:hover{color:${color.t1}!important}
        @media(max-width:768px){
          .nav-desktop{display:none!important}
          .nav-hamburger{display:flex!important}
        }
        @media(min-width:769px){
          .nav-mobile-menu{display:none!important}
          .nav-hamburger{display:none!important}
        }
      `}</style>

      <nav style={{
        position: transparent ? "fixed" : "sticky",
        top: 0, left: 0, right: 0,
        zIndex: 100,
        background: navBg,
        backdropFilter: (transparent && !scrolled && !menuOpen) ? "none" : "blur(12px)",
        borderBottom: `1px solid ${(transparent && !scrolled && !menuOpen) ? "transparent" : color.bd1}`,
        height: 64,
        paddingTop: "env(safe-area-inset-top, 0px)",
        display: "flex", alignItems: "center",
        justifyContent: "space-between",
        padding: "0 28px",
        transition: "background 0.3s, border-color 0.3s",
      }}>
        {/* Logo */}
        <Link href="/" style={{ flexShrink: 0 }}>
          <Image src="/ConstructAIQWhiteLogo.svg" width={128} height={24} alt="ConstructAIQ"
            style={{ height: 24, width: "auto", display: "block" }} />
        </Link>

        {/* Desktop links */}
        <div className="nav-desktop" style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {BASE_LINKS.map(({ label, href }) => (
            <Link key={label} href={href}
              className="nav-link"
              style={{ fontFamily: SYS, fontSize: 14, color: color.t3, padding: "6px 10px", borderRadius: radius.sm, transition: "color 0.15s" }}
            >
              {label}
            </Link>
          ))}

        </div>

        {/* Desktop CTA + bell + hamburger */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Link href={ctaHref} className="nav-desktop" style={{ display: "flex" }}>
            <button style={{
              background: color.blue,
              color: color.t1,
              fontFamily: SYS, fontSize: 14, fontWeight: 600,
              padding: "8px 18px", borderRadius: radius.md,
              minHeight: 44, border: "none", cursor: "pointer",
            }}>
              {ctaLabel}
            </button>
          </Link>

          {/* Bell — desktop only */}
          <button
            className="nav-desktop"
            onClick={() => { setShowNotif(true); setBellBadge(false) }}
            aria-label="Signal alerts"
            style={{
              display:        "flex",
              alignItems:     "center",
              justifyContent: "center",
              position:       "relative",
              width:          44,
              height:         44,
              background:     "transparent",
              border:         `1px solid ${color.bd1}`,
              borderRadius:   radius.md,
              cursor:         "pointer",
            }}
          >
            <Bell size={18} color={color.t3} />
            {bellBadge && (
              <span style={{
                position:     "absolute",
                top:          8,
                right:        8,
                width:        7,
                height:       7,
                borderRadius: "50%",
                background:   color.red,
                border:       `1.5px solid ${color.bg1}`,
              }} />
            )}
          </button>

          {/* Hamburger */}
          <button
            className="nav-hamburger"
            onClick={() => setMenuOpen(v => !v)}
            style={{
              background: "transparent", border: "none",
              display: "none", flexDirection: "column", gap: 5,
              padding: 8, cursor: "pointer",
            }}
            aria-label="Toggle menu"
          >
            {[0,1,2].map(i => (
              <span key={i} style={{ display: "block", width: 22, height: 2, background: color.t2, borderRadius: 2 }} />
            ))}
          </button>
        </div>
      </nav>

      {showNotif && <NotificationSettings onClose={() => setShowNotif(false)} />}

      {/* Mobile menu */}
      {menuOpen && (
        <div
          className="nav-mobile-menu"
          style={{
            position: "fixed", top: 64, left: 0, right: 0, zIndex: 99,
            background: color.bg1,
            borderBottom: `1px solid ${color.bd1}`,
            padding: "16px 24px 24px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {BASE_LINKS.map(({ label, href }) => (
              <Link key={label} href={href} onClick={() => setMenuOpen(false)}
                style={{ fontFamily: SYS, fontSize: 16, color: color.t2, padding: "10px 0", borderBottom: `1px solid ${color.bd1}` }}
              >
                {label}
              </Link>
            ))}
            <div style={{ paddingTop: 12 }}>
              <Link href={ctaHref} onClick={() => setMenuOpen(false)}>
                <button style={{
                  width: "100%", background: color.blue, color: color.t1,
                  fontFamily: SYS, fontSize: 15, fontWeight: 600,
                  padding: "12px", borderRadius: radius.md, minHeight: 48, border: "none",
                }}>
                  {ctaLabel}
                </button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
