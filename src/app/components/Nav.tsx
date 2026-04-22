"use client"
import Image from "next/image"
import Link  from "next/link"
import { useState, useEffect } from "react"
import { font, color } from "@/lib/theme"

const MONO  = font.mono
const GREEN = color.green

const NAV_LINKS = [
  { label: "Intelligence",     href: "/dashboard"     },
  { label: "Federal Pipeline", href: "/federal"       },
  { label: "Methodology",      href: "/methodology"   },
  { label: "Globe",            href: "/globe"         },
  { label: "Markets",          href: "/markets"       },
  { label: "Tools",            href: "/market-check"  },
  { label: "API",              href: "/api-access"    },
  { label: "Pricing",          href: "/pricing"       },
  { label: "About",            href: "/about"         },
]

export function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 8)
    window.addEventListener("scroll", handler, { passive: true })
    return () => window.removeEventListener("scroll", handler)
  }, [])

  return (
    <>
      <nav className={`nav${scrolled ? " on" : ""}`}>
        <Link href="/">
          <Image src="/ConstructAIQWhiteLogo.svg" width={120} height={24} alt="ConstructAIQ"
                 className="nav-logo-img" />
        </Link>
        <div className="nav-center">
          {NAV_LINKS.map(({ label, href }) => (
            <Link key={label} href={href} className="nav-a">{label}</Link>
          ))}
        </div>
        <div className="nav-right">
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <span className="live-dot" />
            <span style={{ fontFamily:MONO, fontSize:11, color:GREEN, letterSpacing:"0.08em" }}>LIVE</span>
          </div>
          <Link href="/pricing"   className="btn-t">Get Free Access</Link>
          <Link href="/dashboard" className="btn-f">View Dashboard</Link>
          <button className="ham" onClick={() => setMenuOpen(v => !v)} aria-label="Menu">
            <svg width="20" height="14" viewBox="0 0 20 14" fill="none">
              <line x1="0" y1="1"  x2="20" y2="1"  stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <line x1="0" y1="7"  x2="20" y2="7"  stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <line x1="0" y1="13" x2="20" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      </nav>

      <div className={`mob-menu${menuOpen ? " open" : ""}`}>
        {NAV_LINKS.map(({ label, href }) => (
          <Link key={label} href={href} className="mob-a" onClick={() => setMenuOpen(false)}>
            {label}
          </Link>
        ))}
        <div className="mob-ctas">
          <Link href="/dashboard" className="btn-fl" onClick={() => setMenuOpen(false)}
                style={{ width:"100%", justifyContent:"center" }}>
            Open Dashboard →
          </Link>
        </div>
      </div>
    </>
  )
}
