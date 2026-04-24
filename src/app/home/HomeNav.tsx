"use client"
import Image from "next/image"
import Link  from "next/link"
import { WHITE, BD, T3, BLUE } from "./home-utils"

export function HomeNav() {
  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: 'rgba(255,255,255,0.94)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: `1px solid ${BD}`,
      padding: '0 40px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      height: 60,
    }}>
      <Link href="/">
        <Image
          src="/ConstructAIQBlackLogo.svg"
          width={124} height={22}
          alt="ConstructAIQ"
          style={{ height: 20, width: 'auto', display: 'block' }}
        />
      </Link>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <Link href="/methodology"
              style={{ fontSize: 14, fontWeight: 500, color: T3, textDecoration: 'none' }}>
          Methodology
        </Link>
        <Link href="/dashboard" style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          background: BLUE, color: WHITE,
          fontSize: 14, fontWeight: 600,
          padding: '8px 20px', borderRadius: 10, minHeight: 44,
          textDecoration: 'none', letterSpacing: '-0.01em',
        }}>
          Open Dashboard
        </Link>
      </div>
    </nav>
  )
}
