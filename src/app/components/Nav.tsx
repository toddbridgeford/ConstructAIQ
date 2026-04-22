"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { color, font, radius } from "@/lib/theme"

const SYS  = font.sys
const MONO = font.mono

const BASE_LINKS = [
  { label: "Intelligence", href: "/dashboard"    },
  { label: "Globe",        href: "/globe"        },
  { label: "Markets",      href: "/markets"      },
  { label: "Tools",        href: "/market-check" },
  { label: "Pricing",      href: "/pricing"      },
  { label: "About",        href: "/about"        },
]

interface SurveyStatus {
  quarter: string
  collecting: boolean
}

interface NavProps {
  /** If true the nav background starts transparent and frosts on scroll. Default: false (always frosted). */
  transparent?: boolean
  ctaLabel?: string
  ctaHref?: string
}

export function Nav({ transparent = false, ctaLabel = "Dashboard →", ctaHref = "/dashboard" }: NavProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [survey, setSurvey]   = useState<SurveyStatus | null>(null)

  useEffect(() => {
    if (!transparent) return
    const handler = () => setScrolled(window.scrollY > 40)
    window.addEventListener("scroll", handler, { passive: true })
    return () => window.removeEventListener("scroll", handler)
  }, [transparent])

  useEffect(() => {
    fetch("/api/survey/current")
      .then(r => r.json())
      .then(d => setSurvey({ quarter: d.quarter ?? "Q2 2025", collecting: true }))
      .catch(() => {/* leave null — no survey link shown on error */})

    // Check if results are published (overrides collecting state)
    fetch("/api/survey/results")
      .then(r => r.json())
      .then(d => setSurvey({ quarter: d.quarter ?? "Q2 2025", collecting: d.collecting !== false }))
      .catch(() => {/* keep current */})
  }, [])

  const navBg = transparent && !scrolled && !menuOpen
    ? "transparent"
    : color.bg1 + "ee"

  const surveyLabel = survey
    ? survey.collecting
      ? `Take ${survey.quarter} Survey`
      : "Survey Results"
    : null
  const surveyHref = survey
    ? survey.collecting
      ? "/survey"
      : "/survey/results"
    : "/survey"

  return (
    <>
      <style>{`
        .nav-link:hover{color:${color.t1}!important}
        @keyframes pulse-dot{0%,100%{opacity:1}50%{opacity:0.4}}
        .survey-dot{animation:pulse-dot 2s ease-in-out infinite}
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

          {/* Survey link — shown once status loads */}
          {survey && (
            <Link href={surveyHref}
              style={{
                display: "flex", alignItems: "center", gap: 7,
                fontFamily: SYS, fontSize: 14,
                color: survey.collecting ? color.amber : color.t3,
                padding: "6px 10px", borderRadius: radius.sm,
                transition: "color 0.15s",
              }}
            >
              {survey.collecting && (
                <span className="survey-dot" style={{
                  width: 6, height: 6,
                  borderRadius: "50%",
                  background: color.amber,
                  flexShrink: 0,
                }} />
              )}
              {surveyLabel}
            </Link>
          )}
        </div>

        {/* Desktop CTA + hamburger */}
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
            {survey && (
              <Link href={surveyHref} onClick={() => setMenuOpen(false)}
                style={{ fontFamily: SYS, fontSize: 16, color: survey.collecting ? color.amber : color.t2, padding: "10px 0", borderBottom: `1px solid ${color.bd1}`, display: "flex", alignItems: "center", gap: 8 }}
              >
                {survey.collecting && <span className="survey-dot" style={{ width: 6, height: 6, borderRadius: "50%", background: color.amber }} />}
                {surveyLabel}
              </Link>
            )}
            <Link href="/survey/about" onClick={() => setMenuOpen(false)}
              style={{ fontFamily: SYS, fontSize: 14, color: color.t4, padding: "8px 0", borderBottom: `1px solid ${color.bd1}` }}
            >
              About the Survey
            </Link>
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
