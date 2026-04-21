import Image from "next/image"
import Link  from "next/link"
import { Nav }              from "./components/Nav"
import { HeroSection }      from "./components/HeroSection"
import { TrustStrip }       from "./components/TrustStrip"
import { OutcomeCards }     from "./components/OutcomeCards"
import { PlatformShowcase } from "./components/PlatformShowcase"
import { ForecastDeepDive } from "./components/ForecastDeepDive"
import { UseCases }         from "./components/UseCases"
import { CtaSection }       from "./components/CtaSection"
import { color, font }      from "@/lib/theme"

const { bg0:BG0, bd1:BD1, t1:T1, t4:T4 } = color
const SYS = font.sys

const NAV_LINKS = [
  { label:"Intelligence", href:"/dashboard"    },
  { label:"Globe",        href:"/globe"        },
  { label:"Markets",      href:"/markets"      },
  { label:"Tools",        href:"/market-check" },
  { label:"Pricing",      href:"/pricing"      },
  { label:"About",        href:"/about"        },
]

export default function HomePage() {
  return (
    <div style={{ minHeight:"100vh", background:BG0, color:T1, fontFamily:SYS,
                  paddingBottom:"env(safe-area-inset-bottom,20px)" }}>
      <Nav />
      <HeroSection />
      <TrustStrip />
      <OutcomeCards />
      <PlatformShowcase />
      <ForecastDeepDive />
      <UseCases />
      <CtaSection />

      <footer style={{ borderTop:`1px solid ${BD1}`, padding:"28px 40px",
                       display:"flex", alignItems:"center", justifyContent:"space-between",
                       flexWrap:"wrap", gap:12 }}>
        <Image src="/ConstructAIQWhiteLogo.svg" width={100} height={20} alt="ConstructAIQ"
               style={{ height:18, width:"auto" }} />
        <div style={{ display:"flex", gap:16, flexWrap:"wrap" }}>
          {[...NAV_LINKS, { label:"Contact", href:"/contact" }].map(({ label, href }) => (
            <Link key={label} href={href} style={{ fontSize:13, color:T4 }}>{label}</Link>
          ))}
        </div>
        <div style={{ fontFamily:SYS, fontSize:12, color:T4 }}>© 2026 ConstructAIQ</div>
      </footer>
    </div>
  )
}
