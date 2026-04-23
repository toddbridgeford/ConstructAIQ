"use client"
import Image from "next/image"
import Link from "next/link"
import { useState, useEffect } from "react"
import { font, color } from "@/lib/theme"

const SYS  = font.sys
const MONO = font.mono
const AMBER = color.amber
const GREEN = color.green
const RED   = color.red
const BLUE  = color.blue
const BG0   = color.bg0
const BG1   = color.bg1
const BG2   = color.bg2
const BG3   = color.bg3
const BD1   = color.bd1
const BD2   = color.bd2
const T1    = color.t1
const T2    = color.t2
const T3    = color.t3
const T4    = color.t4

// ─── Nav ─────────────────────────────────────────────────────────────────────
function Nav() {
  return (
    <nav style={{
      position: "sticky", top: 0, zIndex: 100,
      background: BG1 + "ee", backdropFilter: "blur(12px)",
      borderBottom: `1px solid ${BD1}`,
      padding: "0 32px", display: "flex", alignItems: "center",
      justifyContent: "space-between", height: 60,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <Link href="/">
          <Image src="/ConstructAIQWhiteLogo.svg" width={120} height={24} alt="ConstructAIQ" style={{ height: 24, width: "auto" }} />
        </Link>
        <div style={{ width: 1, height: 24, background: BD1 }} />
        <div style={{ fontFamily: MONO, fontSize: 11, color: T4, letterSpacing: "0.1em" }}>MARKETS</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {[
          { label: "INTELLIGENCE", href: "/dashboard" },
          { label: "RESEARCH",     href: "/research"  },
          { label: "PRICING",      href: "/pricing"   },
          { label: "ABOUT",        href: "/about"     },
          { label: "CONTACT",      href: "/contact"   },
        ].map(({ label, href }) => (
          <Link key={label} href={href}>
            <button style={{ background: "transparent", color: T4, fontFamily: MONO, fontSize: 12, padding: "6px 12px", borderRadius: 8, border: "none", cursor: "pointer", letterSpacing: "0.06em" }}>
              {label}
            </button>
          </Link>
        ))}
        <Link href="/dashboard">
          <button style={{ background: AMBER, color: "#000", fontFamily: MONO, fontSize: 12, fontWeight: 700, padding: "8px 16px", borderRadius: 10, letterSpacing: "0.06em", minHeight: 44, border: "none", cursor: "pointer" }}>
            DASHBOARD →
          </button>
        </Link>
      </div>
    </nav>
  )
}

// ─── Footer ──────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer style={{ borderTop: `1px solid ${BD1}`, padding: "40px 32px", marginTop: 80 }}>
      <div style={{ maxWidth: 1140, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16, alignItems: "center", textAlign: "center" }}>
        <Image src="/ConstructAIQWhiteLogo.svg" width={120} height={24} alt="ConstructAIQ" style={{ height: 24, width: "auto", opacity: 0.7 }} />
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap", justifyContent: "center" }}>
          {[["Intelligence", "/dashboard"], ["Research", "/research"], ["Pricing", "/pricing"], ["Markets", "/markets"], ["About", "/about"], ["Contact", "/contact"]].map(([l, h]) => (
            <Link key={l} href={h} style={{ fontFamily: SYS, fontSize: 13, color: T4, textDecoration: "none" }}>{l}</Link>
          ))}
        </div>
        <div style={{ fontFamily: SYS, fontSize: 13, color: T4 }}>Construction Intelligence Platform · constructaiq.trade</div>
        <div style={{ fontFamily: MONO, fontSize: 11, color: T4, opacity: 0.6 }}>Data: Census Bureau · BLS · FRED · BEA · EIA · USASpending.gov</div>
      </div>
    </footer>
  )
}

// ─── States Data ─────────────────────────────────────────────────────────────
interface StateRow {
  name: string
  slug: string
  grade: string
  classification: string
  classIcon: string
  permitTrend: number
  employmentTrend: number
  federalAwards: number
  updated: string
}

const STATES_DATA: StateRow[] = [
  { name: "Texas",          slug: "texas",          grade: "A+", classification: "HOT",      classIcon: "🔥", permitTrend: 12.3,  employmentTrend: 4.1,  federalAwards: 8.2,  updated: "Apr 1, 2026" },
  { name: "Florida",        slug: "florida",        grade: "A",  classification: "HOT",      classIcon: "🔥", permitTrend: 9.8,   employmentTrend: 3.6,  federalAwards: 5.1,  updated: "Apr 1, 2026" },
  { name: "Arizona",        slug: "arizona",        grade: "A-", classification: "HOT",      classIcon: "🔥", permitTrend: 8.4,   employmentTrend: 2.9,  federalAwards: 6.3,  updated: "Apr 1, 2026" },
  { name: "Nevada",         slug: "nevada",         grade: "A-", classification: "HOT",      classIcon: "🔥", permitTrend: 7.9,   employmentTrend: 2.7,  federalAwards: 3.8,  updated: "Apr 1, 2026" },
  { name: "Utah",           slug: "utah",           grade: "A-", classification: "HOT",      classIcon: "🔥", permitTrend: 7.6,   employmentTrend: 2.5,  federalAwards: 4.2,  updated: "Apr 1, 2026" },
  { name: "Idaho",          slug: "idaho",          grade: "A-", classification: "HOT",      classIcon: "🔥", permitTrend: 7.1,   employmentTrend: 2.2,  federalAwards: 2.9,  updated: "Apr 1, 2026" },
  { name: "North Carolina", slug: "north-carolina", grade: "B+", classification: "GROWING",  classIcon: "📈", permitTrend: 6.2,   employmentTrend: 2.1,  federalAwards: 4.8,  updated: "Apr 1, 2026" },
  { name: "Tennessee",      slug: "tennessee",      grade: "B+", classification: "GROWING",  classIcon: "📈", permitTrend: 5.8,   employmentTrend: 1.9,  federalAwards: 3.2,  updated: "Apr 1, 2026" },
  { name: "Montana",        slug: "montana",        grade: "B+", classification: "GROWING",  classIcon: "📈", permitTrend: 5.4,   employmentTrend: 1.7,  federalAwards: 3.6,  updated: "Apr 1, 2026" },
  { name: "Georgia",        slug: "georgia",        grade: "B",  classification: "GROWING",  classIcon: "📈", permitTrend: 5.1,   employmentTrend: 1.6,  federalAwards: 2.9,  updated: "Apr 1, 2026" },
  { name: "South Carolina", slug: "south-carolina", grade: "B",  classification: "GROWING",  classIcon: "📈", permitTrend: 4.9,   employmentTrend: 1.4,  federalAwards: 2.1,  updated: "Apr 1, 2026" },
  { name: "Colorado",       slug: "colorado",       grade: "B",  classification: "GROWING",  classIcon: "📈", permitTrend: 4.2,   employmentTrend: 1.8,  federalAwards: 1.4,  updated: "Apr 1, 2026" },
  { name: "Virginia",       slug: "virginia",       grade: "B-", classification: "GROWING",  classIcon: "📈", permitTrend: 3.8,   employmentTrend: 1.1,  federalAwards: 1.2,  updated: "Apr 1, 2026" },
  { name: "Washington",     slug: "washington",     grade: "B-", classification: "GROWING",  classIcon: "📈", permitTrend: 3.4,   employmentTrend: 1.3,  federalAwards: 0.8,  updated: "Apr 1, 2026" },
  { name: "New Mexico",     slug: "new-mexico",     grade: "B-", classification: "GROWING",  classIcon: "📈", permitTrend: 3.1,   employmentTrend: 1.0,  federalAwards: 2.2,  updated: "Apr 1, 2026" },
  { name: "Minnesota",      slug: "minnesota",      grade: "B-", classification: "GROWING",  classIcon: "📈", permitTrend: 2.8,   employmentTrend: 0.9,  federalAwards: 1.8,  updated: "Apr 1, 2026" },
  { name: "Oregon",         slug: "oregon",         grade: "C+", classification: "NEUTRAL",  classIcon: "⬛", permitTrend: 1.9,   employmentTrend: 0.6,  federalAwards: 0.4,  updated: "Apr 1, 2026" },
  { name: "Indiana",        slug: "indiana",        grade: "C+", classification: "NEUTRAL",  classIcon: "⬛", permitTrend: 1.6,   employmentTrend: 0.5,  federalAwards: 0.3,  updated: "Apr 1, 2026" },
  { name: "New York",       slug: "new-york",       grade: "C+", classification: "NEUTRAL",  classIcon: "⬛", permitTrend: 1.2,   employmentTrend: 0.4,  federalAwards: -0.2, updated: "Apr 1, 2026" },
  { name: "California",     slug: "california",     grade: "C+", classification: "NEUTRAL",  classIcon: "⬛", permitTrend: 0.9,   employmentTrend: 0.3,  federalAwards: -0.4, updated: "Apr 1, 2026" },
  { name: "Maryland",       slug: "maryland",       grade: "C",  classification: "NEUTRAL",  classIcon: "⬛", permitTrend: 0.4,   employmentTrend: 0.1,  federalAwards: -0.8, updated: "Apr 1, 2026" },
  { name: "Pennsylvania",   slug: "pennsylvania",   grade: "C",  classification: "NEUTRAL",  classIcon: "⬛", permitTrend: -0.3,  employmentTrend: -0.1, federalAwards: -1.1, updated: "Apr 1, 2026" },
  { name: "Missouri",       slug: "missouri",       grade: "C",  classification: "NEUTRAL",  classIcon: "⬛", permitTrend: -0.6,  employmentTrend: -0.2, federalAwards: -1.4, updated: "Apr 1, 2026" },
  { name: "Wisconsin",      slug: "wisconsin",      grade: "C",  classification: "NEUTRAL",  classIcon: "⬛", permitTrend: -0.8,  employmentTrend: -0.3, federalAwards: -1.6, updated: "Apr 1, 2026" },
  { name: "Kansas",         slug: "kansas",         grade: "C-", classification: "COOLING",  classIcon: "❄️", permitTrend: -1.4,  employmentTrend: -0.5, federalAwards: -2.1, updated: "Apr 1, 2026" },
  { name: "Nebraska",       slug: "nebraska",       grade: "C-", classification: "COOLING",  classIcon: "❄️", permitTrend: -1.6,  employmentTrend: -0.6, federalAwards: -2.4, updated: "Apr 1, 2026" },
  { name: "Iowa",           slug: "iowa",           grade: "C-", classification: "COOLING",  classIcon: "❄️", permitTrend: -1.9,  employmentTrend: -0.7, federalAwards: -2.8, updated: "Apr 1, 2026" },
  { name: "Ohio",           slug: "ohio",           grade: "C-", classification: "COOLING",  classIcon: "❄️", permitTrend: -2.1,  employmentTrend: -0.8, federalAwards: -3.2, updated: "Apr 1, 2026" },
  { name: "Kentucky",       slug: "kentucky",       grade: "D+", classification: "DECLINING", classIcon: "📉", permitTrend: -2.8,  employmentTrend: -1.1, federalAwards: -4.2, updated: "Apr 1, 2026" },
  { name: "Oklahoma",       slug: "oklahoma",       grade: "D+", classification: "DECLINING", classIcon: "📉", permitTrend: -3.1,  employmentTrend: -1.4, federalAwards: -5.1, updated: "Apr 1, 2026" },
  { name: "Alabama",        slug: "alabama",        grade: "D",  classification: "DECLINING", classIcon: "📉", permitTrend: -3.4,  employmentTrend: -1.6, federalAwards: -6.1, updated: "Apr 1, 2026" },
  { name: "Michigan",       slug: "michigan",       grade: "D",  classification: "DECLINING", classIcon: "📉", permitTrend: -3.8,  employmentTrend: -2.1, federalAwards: -7.2, updated: "Apr 1, 2026" },
  { name: "Illinois",       slug: "illinois",       grade: "D",  classification: "DECLINING", classIcon: "📉", permitTrend: -4.2,  employmentTrend: -1.8, federalAwards: -8.4, updated: "Apr 1, 2026" },
  { name: "Mississippi",    slug: "mississippi",    grade: "D-", classification: "DECLINING", classIcon: "📉", permitTrend: -4.6,  employmentTrend: -2.3, federalAwards: -8.9, updated: "Apr 1, 2026" },
  { name: "Arkansas",       slug: "arkansas",       grade: "D-", classification: "DECLINING", classIcon: "📉", permitTrend: -4.9,  employmentTrend: -2.4, federalAwards: -9.2, updated: "Apr 1, 2026" },
  { name: "Louisiana",      slug: "louisiana",      grade: "F",  classification: "DECLINING", classIcon: "📉", permitTrend: -5.8,  employmentTrend: -2.9, federalAwards: -10.4, updated: "Apr 1, 2026" },
  { name: "New Hampshire",  slug: "new-hampshire",  grade: "C+", classification: "NEUTRAL",  classIcon: "⬛", permitTrend: 1.1,   employmentTrend: 0.4,  federalAwards: 0.2,  updated: "Apr 1, 2026" },
  { name: "Vermont",        slug: "vermont",        grade: "C",  classification: "NEUTRAL",  classIcon: "⬛", permitTrend: -0.2,  employmentTrend: -0.1, federalAwards: -0.9, updated: "Apr 1, 2026" },
  { name: "Maine",          slug: "maine",          grade: "C-", classification: "COOLING",  classIcon: "❄️", permitTrend: -1.7,  employmentTrend: -0.6, federalAwards: -2.6, updated: "Apr 1, 2026" },
  { name: "Massachusetts",  slug: "massachusetts",  grade: "C",  classification: "NEUTRAL",  classIcon: "⬛", permitTrend: 0.1,   employmentTrend: 0.0,  federalAwards: -1.0, updated: "Apr 1, 2026" },
  { name: "Rhode Island",   slug: "rhode-island",   grade: "C-", classification: "COOLING",  classIcon: "❄️", permitTrend: -1.5,  employmentTrend: -0.5, federalAwards: -2.3, updated: "Apr 1, 2026" },
  { name: "Connecticut",    slug: "connecticut",    grade: "C",  classification: "NEUTRAL",  classIcon: "⬛", permitTrend: -0.4,  employmentTrend: -0.2, federalAwards: -1.2, updated: "Apr 1, 2026" },
  { name: "New Jersey",     slug: "new-jersey",     grade: "C",  classification: "NEUTRAL",  classIcon: "⬛", permitTrend: -0.5,  employmentTrend: -0.2, federalAwards: -1.3, updated: "Apr 1, 2026" },
  { name: "Delaware",       slug: "delaware",       grade: "C+", classification: "NEUTRAL",  classIcon: "⬛", permitTrend: 1.4,   employmentTrend: 0.5,  federalAwards: 0.6,  updated: "Apr 1, 2026" },
  { name: "West Virginia",  slug: "west-virginia",  grade: "D",  classification: "DECLINING", classIcon: "📉", permitTrend: -3.6,  employmentTrend: -1.9, federalAwards: -6.8, updated: "Apr 1, 2026" },
  { name: "North Dakota",   slug: "north-dakota",   grade: "C-", classification: "COOLING",  classIcon: "❄️", permitTrend: -2.0,  employmentTrend: -0.7, federalAwards: -3.0, updated: "Apr 1, 2026" },
  { name: "South Dakota",   slug: "south-dakota",   grade: "C",  classification: "NEUTRAL",  classIcon: "⬛", permitTrend: -0.7,  employmentTrend: -0.3, federalAwards: -1.5, updated: "Apr 1, 2026" },
  { name: "Wyoming",        slug: "wyoming",        grade: "C+", classification: "NEUTRAL",  classIcon: "⬛", permitTrend: 1.3,   employmentTrend: 0.5,  federalAwards: 0.7,  updated: "Apr 1, 2026" },
  { name: "Alaska",         slug: "alaska",         grade: "C",  classification: "NEUTRAL",  classIcon: "⬛", permitTrend: -0.9,  employmentTrend: -0.4, federalAwards: 1.8,  updated: "Apr 1, 2026" },
  { name: "Hawaii",         slug: "hawaii",         grade: "C+", classification: "NEUTRAL",  classIcon: "⬛", permitTrend: 1.5,   employmentTrend: 0.5,  federalAwards: 0.9,  updated: "Apr 1, 2026" },
]

function gradeColor(grade: string): string {
  if (grade.startsWith("A")) return GREEN
  if (grade.startsWith("B")) return BLUE
  if (grade.startsWith("C")) return AMBER
  return RED
}

function gradeBg(grade: string): string {
  if (grade.startsWith("A")) return color.greenDim
  if (grade.startsWith("B")) return color.blueDim
  if (grade.startsWith("C")) return color.amberDim
  return color.redDim
}

type SortKey = "name" | "grade" | "classification" | "permitTrend" | "employmentTrend" | "federalAwards"

const GRADE_ORDER = ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D", "D-", "F"]

export default function MarketsPage() {
  const [, setMapData] = useState<unknown>(null)
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<SortKey>("grade")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")
  const [email, setEmail] = useState("")
  const [emailSubmitted, setEmailSubmitted] = useState(false)

  useEffect(() => {
    fetch("/api/map")
      .then(r => r.json())
      .then(d => { setMapData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  function handleSort(col: SortKey) {
    if (sortBy === col) setSortDir(d => d === "asc" ? "desc" : "asc")
    else { setSortBy(col); setSortDir("asc") }
  }

  const sorted = [...STATES_DATA].sort((a, b) => {
    let cmp = 0
    if (sortBy === "name")            cmp = a.name.localeCompare(b.name)
    else if (sortBy === "grade")      cmp = GRADE_ORDER.indexOf(a.grade) - GRADE_ORDER.indexOf(b.grade)
    else if (sortBy === "classification") cmp = a.classification.localeCompare(b.classification)
    else if (sortBy === "permitTrend")    cmp = a.permitTrend - b.permitTrend
    else if (sortBy === "employmentTrend") cmp = a.employmentTrend - b.employmentTrend
    else if (sortBy === "federalAwards")   cmp = a.federalAwards - b.federalAwards
    return sortDir === "asc" ? cmp : -cmp
  })

  const thStyle = (col: SortKey): React.CSSProperties => ({
    fontFamily: MONO, fontSize: 11, color: sortBy === col ? AMBER : T4,
    letterSpacing: "0.08em", padding: "12px 16px", textAlign: "left",
    borderBottom: `1px solid ${BD2}`, cursor: "pointer", whiteSpace: "nowrap",
    userSelect: "none",
  })

  return (
    <div style={{ minHeight: "100vh", background: BG0, color: T1, fontFamily: SYS }}>
      <style>{`*{box-sizing:border-box;margin:0;padding:0} a{color:inherit;text-decoration:none} button{cursor:pointer;font-family:inherit}`}</style>
      <Nav />

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px" }}>

        {/* HERO */}
        <div style={{ padding: "72px 0 48px", textAlign: "center" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: BG2, border: `1px solid ${AMBER}44`, borderRadius: 20, padding: "6px 18px", marginBottom: 24 }}>
            <span style={{ fontFamily: MONO, fontSize: 11, color: AMBER, letterSpacing: "0.12em" }}>MONTHLY INTELLIGENCE · ALL 50 STATES</span>
          </div>
          <h1 style={{ fontFamily: SYS, fontSize: 52, fontWeight: 800, color: T1, marginBottom: 16, letterSpacing: "-0.02em", lineHeight: 1.1 }}>
            Construction Market<br /><span style={{ color: AMBER }}>Report Cards</span>
          </h1>
          <p style={{ fontFamily: SYS, fontSize: 18, color: T3, lineHeight: 1.7, maxWidth: 600, margin: "0 auto 32px" }}>
            Monthly A–F grading of every U.S. construction market. Updated on the first business day of each month.
          </p>

          {/* National summary strip */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 24, background: BG2, border: `1px solid ${BD2}`, borderRadius: 14, padding: "14px 28px", flexWrap: "wrap", justifyContent: "center" }}>
            <span style={{ fontFamily: MONO, fontSize: 12, color: T4, letterSpacing: "0.06em" }}>APRIL 2026</span>
            <div style={{ width: 1, height: 20, background: BD2 }} />
            <span style={{ fontFamily: SYS, fontSize: 13, color: GREEN }}>12 states rated A or A+</span>
            <div style={{ width: 1, height: 20, background: BD2 }} />
            <span style={{ fontFamily: SYS, fontSize: 13, color: RED }}>8 states rated D or F</span>
            <div style={{ width: 1, height: 20, background: BD2 }} />
            <span style={{ fontFamily: MONO, fontSize: 13, color: T2 }}>National CSHI: <strong style={{ color: GREEN }}>72.4</strong> <span style={{ color: GREEN }}>EXPANDING</span></span>
          </div>
        </div>

        {/* MAP BANNER */}
        {loading ? (
          <div style={{ background: BG1, border: `1px solid ${BD1}`, borderRadius: 16, height: 80, marginBottom: 32, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontFamily: MONO, fontSize: 12, color: T4 }}>LOADING MAP DATA...</span>
          </div>
        ) : (
          <div style={{ background: BG2, border: `1px solid ${AMBER}33`, borderRadius: 16, padding: "20px 28px", marginBottom: 32, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div>
              <span style={{ fontFamily: MONO, fontSize: 12, color: AMBER, letterSpacing: "0.08em" }}>50-STATE INTERACTIVE MAP</span>
              <div style={{ fontFamily: SYS, fontSize: 14, color: T3, marginTop: 4 }}>
                Color-coded by CSHI score: <span style={{ color: GREEN }}>■ Hot (&gt;80)</span> &nbsp;
                <span style={{ color: BLUE }}>■ Growing (65–80)</span> &nbsp;
                <span style={{ color: AMBER }}>■ Neutral (50–65)</span> &nbsp;
                <span style={{ color: RED }}>■ Declining (&lt;50)</span>
              </div>
            </div>
            <Link href="/dashboard#map">
              <button style={{ background: AMBER, color: "#000", fontFamily: MONO, fontSize: 12, fontWeight: 700, padding: "10px 20px", borderRadius: 10, border: "none", letterSpacing: "0.06em" }}>
                Interactive Map in Full Dashboard →
              </button>
            </Link>
          </div>
        )}

        {/* EMAIL BANNER */}
        <div style={{ background: BG2, border: `1px solid ${BD2}`, borderRadius: 16, padding: "24px 28px", marginBottom: 48, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ fontFamily: MONO, fontSize: 11, color: AMBER, letterSpacing: "0.1em", marginBottom: 6 }}>PDF DOWNLOAD</div>
            <div style={{ fontFamily: SYS, fontSize: 15, color: T2 }}>
              Download the April 2026 National State Report Cards PDF — All 50 states in one document →
            </div>
          </div>
          {emailSubmitted ? (
            <div style={{ fontFamily: MONO, fontSize: 13, color: GREEN }}>✓ Check your inbox!</div>
          ) : (
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Enter email to download"
                style={{ background: BG1, border: `1px solid ${BD2}`, borderRadius: 10, padding: "10px 16px", fontFamily: SYS, fontSize: 14, color: T1, outline: "none", width: 240 }}
              />
              <button
                onClick={() => { if (email) setEmailSubmitted(true) }}
                style={{ background: AMBER, color: "#000", fontFamily: MONO, fontSize: 12, fontWeight: 700, padding: "10px 18px", borderRadius: 10, border: "none", letterSpacing: "0.06em", whiteSpace: "nowrap" }}
              >
                Download PDF →
              </button>
            </div>
          )}
        </div>

        {/* SORTABLE TABLE */}
        <div style={{ marginBottom: 80 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <h2 style={{ fontFamily: SYS, fontSize: 22, fontWeight: 700, color: T1 }}>All 50 States — April 2026</h2>
            <span style={{ fontFamily: MONO, fontSize: 11, color: T4 }}>CLICK COLUMN TO SORT</span>
          </div>
          <div style={{ background: BG1, border: `1px solid ${BD1}`, borderRadius: 16, overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: BG2 }}>
                    <th style={thStyle("name")} onClick={() => handleSort("name")}>
                      STATE {sortBy === "name" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                    </th>
                    <th style={thStyle("grade")} onClick={() => handleSort("grade")}>
                      GRADE {sortBy === "grade" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                    </th>
                    <th style={thStyle("classification")} onClick={() => handleSort("classification")}>
                      CLASS {sortBy === "classification" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                    </th>
                    <th style={thStyle("permitTrend")} onClick={() => handleSort("permitTrend")}>
                      PERMIT TREND {sortBy === "permitTrend" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                    </th>
                    <th style={thStyle("employmentTrend")} onClick={() => handleSort("employmentTrend")}>
                      EMPLOYMENT {sortBy === "employmentTrend" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                    </th>
                    <th style={thStyle("federalAwards")} onClick={() => handleSort("federalAwards")}>
                      FEDERAL AWARDS {sortBy === "federalAwards" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                    </th>
                    <th style={{ ...thStyle("name"), cursor: "default" }}>UPDATED</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((s, i) => (
                    <tr
                      key={s.slug}
                      onClick={() => window.location.href = `/markets/${s.slug}`}
                      style={{ borderBottom: `1px solid ${BD1}`, background: i % 2 === 0 ? "transparent" : BG2 + "66", cursor: "pointer", transition: "background 0.15s" }}
                      onMouseEnter={e => (e.currentTarget.style.background = BG3)}
                      onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? "transparent" : BG2 + "66")}
                    >
                      <td style={{ fontFamily: SYS, fontSize: 14, color: T1, fontWeight: 600, padding: "14px 16px" }}>
                        {s.name}
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 700, color: gradeColor(s.grade), background: gradeBg(s.grade), padding: "3px 10px", borderRadius: 8 }}>
                          {s.grade}
                        </span>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{ fontFamily: SYS, fontSize: 13, color: T2 }}>{s.classIcon} {s.classification}</span>
                      </td>
                      <td style={{ fontFamily: MONO, fontSize: 13, color: s.permitTrend >= 0 ? GREEN : RED, padding: "14px 16px" }}>
                        {s.permitTrend >= 0 ? "+" : ""}{s.permitTrend.toFixed(1)}%
                      </td>
                      <td style={{ fontFamily: MONO, fontSize: 13, color: s.employmentTrend >= 0 ? GREEN : RED, padding: "14px 16px" }}>
                        {s.employmentTrend >= 0 ? "+" : ""}{s.employmentTrend.toFixed(1)}%
                      </td>
                      <td style={{ fontFamily: MONO, fontSize: 13, color: s.federalAwards >= 0 ? GREEN : RED, padding: "14px 16px" }}>
                        {s.federalAwards >= 0 ? "+" : ""}{s.federalAwards.toFixed(1)}%
                      </td>
                      <td style={{ fontFamily: MONO, fontSize: 12, color: T4, padding: "14px 16px" }}>{s.updated}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
