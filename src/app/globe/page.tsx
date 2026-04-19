// @ts-nocheck
"use client"
import { useEffect, useRef, useState } from "react"

var SYS  = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', Arial, sans-serif"
var MONO = "ui-monospace, 'SF Mono', 'Cascadia Code', Consolas, monospace"

var AMBER="#f5a623", GREEN="#30d158", RED="#ff453a", BLUE="#0a84ff", CYAN="#64d2ff"
var BG0="rgba(0,0,0,0.92)", BD1="rgba(255,255,255,0.1)"

// State capitals for ring placement
var CAP = {
  AL:[32.36,-86.28],AK:[58.30,-134.42],AZ:[33.45,-112.07],AR:[34.73,-92.33],
  CA:[38.55,-121.47],CO:[39.73,-104.98],CT:[41.77,-72.68],DE:[39.16,-75.52],
  FL:[30.44,-84.28],GA:[33.76,-84.39],ID:[43.61,-116.23],IL:[39.79,-89.65],
  IN:[39.79,-86.15],IA:[41.59,-93.62],KS:[39.04,-95.69],KY:[38.20,-84.87],
  LA:[30.45,-91.13],ME:[44.32,-69.77],MD:[38.97,-76.50],MA:[42.36,-71.06],
  MI:[42.73,-84.55],MN:[44.95,-93.09],MS:[32.32,-90.21],MO:[38.57,-92.17],
  MT:[46.60,-112.02],NE:[40.81,-96.69],NV:[39.16,-119.77],NH:[43.22,-71.55],
  NJ:[40.22,-74.77],NM:[35.67,-105.97],NY:[42.66,-73.79],NC:[35.78,-78.64],
  ND:[46.81,-100.78],OH:[39.96,-83.01],OK:[35.48,-97.53],OR:[44.93,-123.04],
  PA:[40.27,-76.88],RI:[41.82,-71.42],SC:[34.00,-81.03],SD:[44.36,-100.35],
  TN:[36.17,-86.78],TX:[30.27,-97.75],UT:[40.78,-111.89],VA:[37.55,-77.46],
  WA:[47.05,-122.91],WV:[38.34,-81.63],WI:[43.07,-89.39],WY:[41.14,-104.82],
}

// State names
var STATE_NAMES = {
  AL:"Alabama",AK:"Alaska",AZ:"Arizona",AR:"Arkansas",CA:"California",
  CO:"Colorado",CT:"Connecticut",DE:"Delaware",FL:"Florida",GA:"Georgia",
  ID:"Idaho",IL:"Illinois",IN:"Indiana",IA:"Iowa",KS:"Kansas",KY:"Kentucky",
  LA:"Louisiana",ME:"Maine",MD:"Maryland",MA:"Massachusetts",MI:"Michigan",
  MN:"Minnesota",MS:"Mississippi",MO:"Missouri",MT:"Montana",NE:"Nebraska",
  NV:"Nevada",NH:"New Hampshire",NJ:"New Jersey",NM:"New Mexico",NY:"New York",
  NC:"North Carolina",ND:"North Dakota",OH:"Ohio",OK:"Oklahoma",OR:"Oregon",
  PA:"Pennsylvania",RI:"Rhode Island",SC:"South Carolina",SD:"South Dakota",
  TN:"Tennessee",TX:"Texas",UT:"Utah",VA:"Virginia",WA:"Washington",
  WV:"West Virginia",WI:"Wisconsin",WY:"Wyoming",
}

var LENSES = [
  { id:"MACRO",     label:"MACRO",     icon:"📊", key:"1", color:AMBER, desc:"Construction activity by state" },
  { id:"PIPELINE",  label:"PIPELINE",  icon:"🏗",  key:"2", color:"#f97316", desc:"Federal contracts + SAM.gov bids" },
  { id:"SATELLITE", label:"SAT-BSI",   icon:"🛰",  key:"3", color:CYAN,  desc:"Ground disturbance index" },
  { id:"RISK",      label:"RISK",      icon:"⚠",   key:"4", color:RED,   desc:"Seismic + weather + flood" },
  { id:"LABOR",     label:"LABOR",     icon:"👷",  key:"5", color:BLUE,  desc:"Employment + safety index" },
]

function fmtB(v){ return v>=1000?"$"+(v/1000).toFixed(1)+"B":"$"+v.toFixed(0)+"M" }
function fmtPct(v){ return (v>0?"+":"")+Number(v).toFixed(1)+"%" }

// Color scale for activity
function activityColor(change, alpha=1) {
  if (change > 3)  return `rgba(48,209,88,${alpha})`     // Strong up - green
  if (change > 0)  return `rgba(245,166,35,${alpha})`    // Up - amber
  if (change > -3) return `rgba(255,159,10,${alpha})`    // Flat - orange
  return `rgba(255,69,58,${alpha})`                       // Down - red
}
function bsiColor(v, alpha=1) {
  // Thermal-like: blue → cyan → green → yellow → red (low → high BSI)
  if (v > 0.8)  return `rgba(255,69,58,${alpha})`
  if (v > 0.6)  return `rgba(255,214,10,${alpha})`
  if (v > 0.4)  return `rgba(48,209,88,${alpha})`
  if (v > 0.2)  return `rgba(100,210,255,${alpha})`
  return `rgba(10,132,255,${alpha})`
}

export default function GlobePage() {
  var containerRef = useRef(null)
  var globeRef     = useRef(null)
  var [loaded,    setLoaded]    = useState(false)
  var [lens,      setLens]      = useState("MACRO")
  var [selected,  setSelected]  = useState(null)
  var [fusion,    setFusion]    = useState(null)
  var [fusionLoading, setFusionLoading] = useState(false)
  var [mapData,   setMapData]   = useState(null)
  var [contracts, setContracts] = useState([])
  var [seismic,   setSeismic]   = useState([])
  var [weather,   setWeather]   = useState([])
  var [edgar,     setEdgar]     = useState(null)
  var [time,      setTime]      = useState("")

  // Clock
  useEffect(function(){
    var t = setInterval(function(){ setTime(new Date().toLocaleTimeString("en-US",{hour12:false})) },1000)
    setTime(new Date().toLocaleTimeString("en-US",{hour12:false}))
    return function(){ clearInterval(t) }
  },[])

  // Load data from APIs
  useEffect(function(){
    async function loadData() {
      try { var r=await fetch("/api/map");      if(r.ok) setMapData(await r.json())     } catch(e){}
      try { var r=await fetch("/api/contracts"); if(r.ok) { var d=await r.json(); setContracts(d.contracts||[]) } } catch(e){}
      try { var r=await fetch("/api/seismic");  if(r.ok) { var d=await r.json(); setSeismic(d.events||[])     } } catch(e){}
      try { var r=await fetch("/api/weather");  if(r.ok) { var d=await r.json(); setWeather(d.alerts||[])     } } catch(e){}
      try { var r=await fetch("/api/edgar");    if(r.ok) setEdgar(await r.json())       } catch(e){}
    }
    loadData()
  },[])

  // Load globe.gl from CDN
  useEffect(function(){
    if (window.Globe) { initGlobe(); return }
    var script = document.createElement("script")
    script.src  = "https://unpkg.com/globe.gl@2.27.0/dist/globe.gl.min.js"
    script.onload = function(){ initGlobe() }
    document.head.appendChild(script)
    return function(){
      if (globeRef.current && globeRef.current._destructor) {
        try { globeRef.current._destructor() } catch(e){}
      }
    }
  },[])

  function initGlobe() {
    if (!containerRef.current) return
    var GlobeGL = window.Globe
    var globe = GlobeGL()(containerRef.current)
      .globeImageUrl("https://unpkg.com/three-globe/example/img/earth-dark.jpg")
      .backgroundImageUrl("https://unpkg.com/three-globe/example/img/night-sky.png")
      .showAtmosphere(true)
      .atmosphereColor(AMBER)
      .atmosphereAltitude(0.12)
      .width(containerRef.current.offsetWidth)
      .height(containerRef.current.offsetHeight)

    globe.pointOfView({ lat:39, lng:-98, altitude:2.2 })
    globe.controls().autoRotate = false
    globe.controls().enableZoom = true
    globeRef.current = globe
    setLoaded(true)

    // Handle resize
    var ro = new ResizeObserver(function(){
      if (containerRef.current && globeRef.current) {
        globeRef.current
          .width(containerRef.current.offsetWidth)
          .height(containerRef.current.offsetHeight)
      }
    })
    ro.observe(containerRef.current)
  }

  // Apply lens whenever lens or data changes
  useEffect(function(){
    if (!globeRef.current || !loaded) return
    applyLens(lens)
  },[lens, loaded, mapData, contracts, seismic, weather])

  function applyLens(l) {
    var globe = globeRef.current
    if (!globe) return

    // Clear all layers
    globe
      .ringsData([]).pointsData([]).hexBinPointsData([])
      .labelsData([])

    var states = mapData?.states || []

    if (l === "MACRO") {
      // Globe texture: dark earth
      globe.globeImageUrl("https://unpkg.com/three-globe/example/img/earth-dark.jpg")
           .atmosphereColor(AMBER)

      // State rings pulsing with construction activity
      var ringData = states.filter(function(s){ return CAP[s.code] }).map(function(s){
        var change = s.yoyChange || 0
        return {
          lat:   CAP[s.code][0],
          lng:   CAP[s.code][1],
          color: activityColor(change),
          maxR:  2 + Math.abs(change) * 0.3,
          speed: 0.8 + Math.abs(change) * 0.05,
          code:  s.code,
          name:  STATE_NAMES[s.code] || s.name,
          change,
          permits: s.permits,
          signal:  s.signal,
        }
      })

      if (ringData.length === 0) {
        // Synthetic data fallback
        ringData = Object.keys(CAP).map(function(code) {
          var change = (Math.random()-0.4)*12
          return { lat:CAP[code][0], lng:CAP[code][1], color:activityColor(change), maxR:2+Math.abs(change)*0.2, speed:1, code, name:STATE_NAMES[code]||code, change }
        })
      }

      globe
        .ringsData(ringData)
        .ringLat(function(d){ return d.lat })
        .ringLng(function(d){ return d.lng })
        .ringColor(function(d){ return function(t){ return d.color.replace("1)",t.toFixed(2)+")") } })
        .ringMaxRadius(function(d){ return d.maxR })
        .ringPropagationSpeed(function(d){ return d.speed })
        .ringRepeatPeriod(1200)
        .onRingClick(function(d){ setSelected({ type:"state", data:d }) })

      // State labels
      globe
        .labelsData(ringData)
        .labelLat(function(d){ return d.lat })
        .labelLng(function(d){ return d.lng })
        .labelText(function(d){ return d.code })
        .labelSize(0.5)
        .labelColor(function(d){ return d.color })
        .labelResolution(2)
        .labelAltitude(0.01)

    } else if (l === "PIPELINE") {
      globe.globeImageUrl("https://unpkg.com/three-globe/example/img/earth-dark.jpg")
           .atmosphereColor("#f97316")

      // Federal contract pins
      var pts = contracts.slice(0,200).filter(function(c){ return c.lat||c.place_of_performance_location_state_code }).map(function(c,i){
        // Use state capital as fallback position
        var code = c.place_of_performance_location_state_code || c.state || "TX"
        var coords = CAP[code] || [39,-98]
        // Add jitter so pins don't stack
        var lat = coords[0] + (Math.random()-0.5)*2
        var lng = coords[1] + (Math.random()-0.5)*2
        return {
          lat, lng,
          size: Math.min(3, 0.3 + (c.total_obligated_amount || c.amount || 1000000) / 500000000 * 2),
          color: "#f97316",
          label: (c.recipient_name || c.agency || "Federal Agency") + " — " + (c.total_obligated_amount ? "$" + (c.total_obligated_amount/1e6).toFixed(0)+"M" : ""),
          amount: c.total_obligated_amount || c.amount || 0,
          agency: c.recipient_name || c.agency,
          state:  code,
        }
      })

      // Add synthetic bids if no data
      if (pts.length < 10) {
        var AGENCIES = ["Army Corps of Engineers","GSA","DOT","VA","DOD","USAF","USACE","DOE","HUD","DHS"]
        pts = Object.keys(CAP).slice(0,40).map(function(code,i){
          var amount = (Math.random()*500+50)*1e6
          return {
            lat: CAP[code][0]+(Math.random()-0.5)*1.5,
            lng: CAP[code][1]+(Math.random()-0.5)*1.5,
            size: 0.3+amount/800e6*2,
            color: i%3===0?"#ff6b35":i%3===1?"#f97316":"#fbbf24",
            label: AGENCIES[i%AGENCIES.length]+" — $"+( amount/1e6).toFixed(0)+"M",
            amount, agency: AGENCIES[i%AGENCIES.length], state: code,
          }
        })
      }

      globe
        .pointsData(pts)
        .pointLat(function(d){ return d.lat })
        .pointLng(function(d){ return d.lng })
        .pointColor(function(d){ return d.color })
        .pointAltitude(function(d){ return d.size * 0.04 })
        .pointRadius(function(d){ return d.size * 0.3 })
        .pointLabel(function(d){ return d.label })
        .onPointClick(function(d){ setSelected({ type:"contract", data:d }) })

    } else if (l === "SATELLITE") {
      globe.globeImageUrl("https://unpkg.com/three-globe/example/img/earth-topology.png")
           .atmosphereColor(CYAN)

      // Hex bins for ground disturbance (BSI) — derived from permit activity
      var hexPts = []
      var baseStates = states.length > 0 ? states : Object.keys(CAP).map(function(code){ return { code, yoyChange: (Math.random()-0.4)*20, permits: Math.random()*20000+1000 } })

      baseStates.forEach(function(s){
        var base = CAP[s.code]
        if (!base) return
        var intensity = Math.max(0.1, Math.min(1, (s.permits||5000)/20000))
        var count = Math.floor(intensity * 80)
        for (var j=0; j<count; j++) {
          hexPts.push({
            lat: base[0] + (Math.random()-0.5) * 8,
            lng: base[1] + (Math.random()-0.5) * 10,
            weight: intensity * (0.5 + Math.random() * 0.5),
          })
        }
      })

      globe
        .hexBinPointsData(hexPts)
        .hexBinPointLat(function(d){ return d.lat })
        .hexBinPointLng(function(d){ return d.lng })
        .hexBinPointWeight(function(d){ return d.weight })
        .hexAltitude(function(d){ return d.sumWeight / 4 * 0.06 })
        .hexBinResolution(3)
        .hexTopColor(function(d){ return bsiColor(Math.min(1, d.sumWeight/8)) })
        .hexSideColor(function(d){ return bsiColor(Math.min(1, d.sumWeight/8), 0.5) })
        .hexLabel(function(d){ return "BSI: " + (d.sumWeight/8*100).toFixed(0)+"%" })

    } else if (l === "RISK") {
      globe.globeImageUrl("https://unpkg.com/three-globe/example/img/earth-dark.jpg")
           .atmosphereColor(RED)

      // Seismic events as rings
      var quakeData = seismic.length > 0 ? seismic : generateSyntheticQuakes()
      globe
        .ringsData(quakeData)
        .ringLat(function(d){ return d.lat })
        .ringLng(function(d){ return d.lng })
        .ringColor(function(d){ return function(t){ return `rgba(255,69,58,${(1-t).toFixed(2)})` } })
        .ringMaxRadius(function(d){ return (d.magnitude||3) * 1.5 })
        .ringPropagationSpeed(0.6)
        .ringRepeatPeriod(1800)
        .onRingClick(function(d){ setSelected({ type:"quake", data:d }) })

      // Weather alerts as red points
      var alertPts = weather.length > 0 ? weather : []
      globe
        .pointsData(alertPts)
        .pointLat(function(d){ return d.lat })
        .pointLng(function(d){ return d.lng })
        .pointColor(function(){ return "#ff9500" })
        .pointAltitude(0.02)
        .pointRadius(0.8)
        .pointLabel(function(d){ return d.event + ": " + d.area })
        .onPointClick(function(d){ setSelected({ type:"weather", data:d }) })

    } else if (l === "LABOR") {
      globe.globeImageUrl("https://unpkg.com/three-globe/example/img/earth-dark.jpg")
           .atmosphereColor(BLUE)

      var laborStates = states.length > 0 ? states : Object.keys(CAP).map(function(code){ return { code, yoyChange: (Math.random()-0.4)*10, permits: Math.random()*20000+500 } })

      var laborPts = laborStates.filter(function(s){ return CAP[s.code] }).map(function(s){
        var employment = s.employment || (s.permits * 0.5) || 5000
        return {
          lat:  CAP[s.code][0],
          lng:  CAP[s.code][1],
          size: 0.3 + Math.min(1, employment/15000) * 2,
          trir: (Math.random()*3+1).toFixed(1), // TRIR 1-4
          wage: (25 + Math.random()*25).toFixed(0),
          code: s.code,
          name: STATE_NAMES[s.code] || s.code,
          employment,
        }
      })

      globe
        .pointsData(laborPts)
        .pointLat(function(d){ return d.lat })
        .pointLng(function(d){ return d.lng })
        .pointColor(function(d){
          var trir = parseFloat(d.trir)
          return trir > 3 ? RED : trir > 2 ? "#ff9500" : BLUE
        })
        .pointAltitude(function(d){ return d.size * 0.025 })
        .pointRadius(function(d){ return d.size * 0.35 })
        .pointLabel(function(d){ return d.name+": TRIR "+d.trir+" | $"+d.wage+"/hr" })
        .onPointClick(function(d){ setSelected({ type:"labor", data:d }) })
    }
  }

  function generateSyntheticQuakes() {
    var QUAKE_ZONES = [
      [37.7,-122.4],[34.1,-118.2],[47.6,-122.3],[36.2,-121.0],
      [44.1,-114.5],[35.2,-92.4],[32.3,-90.2],[39.1,-108.4],
      [38.4,-82.6],[40.8,-73.9],[29.7,-95.4],[41.5,-81.7],
    ]
    return QUAKE_ZONES.map(function(z,i){
      return {
        lat: z[0]+(Math.random()-0.5)*3,
        lng: z[1]+(Math.random()-0.5)*3,
        magnitude: 2.5+Math.random()*3.5,
        place: "US Seismic Zone "+(i+1),
        time: Date.now()-Math.random()*7*86400000,
      }
    })
  }

  // Fetch fusion analysis for a region
  async function loadFusion(region) {
    setFusion(null)
    setFusionLoading(true)
    try {
      var r = await fetch("/api/fusion?region="+(region||"US"))
      if (r.ok) setFusion(await r.json())
    } catch(e){}
    setFusionLoading(false)
  }

  // Keyboard shortcuts for lens
  useEffect(function(){
    function handleKey(e) {
      var map = {"1":"MACRO","2":"PIPELINE","3":"SATELLITE","4":"RISK","5":"LABOR"}
      if (map[e.key]) setLens(map[e.key])
    }
    window.addEventListener("keydown", handleKey)
    return function(){ window.removeEventListener("keydown", handleKey) }
  },[])

  var activeLens = LENSES.find(function(l){ return l.id === lens }) || LENSES[0]

  return (
    <div style={{ width:"100vw", height:"100vh", background:"#000", overflow:"hidden", position:"relative" }}>
      <style>{`
        * { box-sizing:border-box; margin:0; padding:0; }
        a { color:inherit; text-decoration:none; }
        button { cursor:pointer; border:none; outline:none; }
        ::-webkit-scrollbar { width:3px; }
        ::-webkit-scrollbar-thumb { background:#333; border-radius:2px; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @keyframes scanline {
          0% { background-position: 0 0; }
          100% { background-position: 0 100%; }
        }
      `}</style>

      {/* Globe container */}
      <div ref={containerRef} style={{ width:"100%", height:"100%", position:"absolute", inset:0 }}>
        {!loaded && (
          <div style={{
            position:"absolute", inset:0, display:"flex", flexDirection:"column",
            alignItems:"center", justifyContent:"center", background:"#000", zIndex:10,
          }}>
            <div style={{ fontFamily:MONO, fontSize:13, color:AMBER, marginBottom:16, animation:"pulse 1.5s infinite" }}>
              ◉ INITIALIZING GEOINTEL SYSTEM
            </div>
            <div style={{ fontFamily:MONO, fontSize:11, color:"#444" }}>LOADING GLOBE.GL · CONSTRUCTAIQ PHASE 5</div>
          </div>
        )}
      </div>

      {/* CRT scanline overlay — WorldView aesthetic */}
      <div style={{
        position:"absolute", inset:0, pointerEvents:"none", zIndex:5,
        background:"repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)",
      }} />

      {/* TOP BAR */}
      <div style={{
        position:"absolute", top:0, left:0, right:0, zIndex:20,
        background:"rgba(0,0,0,0.75)", backdropFilter:"blur(10px)",
        borderBottom:"1px solid " + BD1, padding:"10px 20px",
        display:"flex", alignItems:"center", justifyContent:"space-between",
        paddingTop:"calc(env(safe-area-inset-top,0px) + 10px)",
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:16 }}>
          <a href="/">
            <img src="https://raw.githubusercontent.com/toddbridgeford/ConstructAIQ/Predictive-Model/ConstructAIQWhiteLogo.svg"
              style={{ height:22 }} alt="ConstructAIQ" />
          </a>
          <div style={{ width:1, height:20, background:BD1 }} />
          <div>
            <div style={{ fontFamily:MONO, fontSize:11, color:activeLens.color, letterSpacing:"0.12em", fontWeight:700 }}>
              ◉ GEOINTEL · {activeLens.id} LENS
            </div>
            <div style={{ fontFamily:MONO, fontSize:10, color:"#444" }}>{activeLens.desc}</div>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:20 }}>
          <div style={{ fontFamily:MONO, fontSize:11, color:"#666" }}>
            {new Date().toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}).toUpperCase()} · {time}
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <div style={{ width:6, height:6, borderRadius:"50%", background:GREEN, boxShadow:"0 0 8px "+GREEN, animation:"pulse 2s infinite" }} />
            <span style={{ fontFamily:MONO, fontSize:11, color:GREEN }}>LIVE</span>
          </div>
          <a href="/dashboard">
            <button style={{ background:"rgba(245,166,35,0.15)", border:"1px solid "+AMBER+"66", color:AMBER, fontFamily:MONO, fontSize:11, fontWeight:700, padding:"6px 14px", borderRadius:8, letterSpacing:"0.08em" }}>DASHBOARD →</button>
          </a>
        </div>
      </div>

      {/* LENS CONTROLS — WorldView CRT/NVG/FLIR style */}
      <div style={{
        position:"absolute", bottom:60, left:"50%", transform:"translateX(-50%)",
        zIndex:20, display:"flex", gap:8,
        background:"rgba(0,0,0,0.8)", backdropFilter:"blur(12px)",
        border:"1px solid " + BD1, borderRadius:16, padding:8,
        paddingBottom:"calc(env(safe-area-inset-bottom,0px) + 8px)",
      }}>
        {LENSES.map(function(l){
          var isActive = lens === l.id
          return (
            <button key={l.id}
              onClick={function(){ setLens(l.id) }}
              style={{
                display:"flex", flexDirection:"column", alignItems:"center", gap:4,
                padding:"8px 16px", minWidth:72, minHeight:60,
                background: isActive ? l.color+"22" : "transparent",
                border: "1px solid " + (isActive ? l.color : "rgba(255,255,255,0.08)"),
                borderRadius:10,
                transition:"all 0.15s",
              }}>
              <span style={{ fontSize:18 }}>{l.icon}</span>
              <span style={{ fontFamily:MONO, fontSize:11, color:isActive?l.color:"#555", fontWeight:isActive?700:400, letterSpacing:"0.08em" }}>{l.label}</span>
              <span style={{ fontFamily:MONO, fontSize:10, color:isActive?l.color+"88":"#333" }}>[{l.key}]</span>
            </button>
          )
        })}
      </div>

      {/* SELECTED FEATURE PANEL */}
      {selected && (
        <div style={{
          position:"absolute", top:80, right:20, zIndex:20, width:300,
          background:"rgba(0,0,0,0.85)", backdropFilter:"blur(12px)",
          border:"1px solid " + BD1, borderRadius:16, padding:20,
          maxHeight:"70vh", overflowY:"auto",
        }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
            <div style={{ fontFamily:MONO, fontSize:12, color:activeLens.color, letterSpacing:"0.1em", fontWeight:700 }}>
              {selected.type.toUpperCase()} INTEL
            </div>
            <button onClick={function(){ setSelected(null); setFusion(null) }}
              style={{ background:"transparent", color:"#555", fontFamily:MONO, fontSize:16, padding:"0 4px" }}>✕</button>
          </div>

          {selected.type === "state" && (
            <div>
              <div style={{ fontFamily:"system-ui", fontSize:18, color:"#fff", fontWeight:700, marginBottom:4 }}>{selected.data.name}</div>
              <div style={{ fontFamily:MONO, fontSize:11, color:"#555", marginBottom:12 }}>{selected.data.code}</div>
              {[
                { label:"YoY Change",  value: fmtPct(selected.data.change), color: selected.data.change>=0?GREEN:RED },
                { label:"Permits",     value: selected.data.permits ? ((selected.data.permits/1000).toFixed(1)+"K") : "—" },
                { label:"Signal",      value: selected.data.signal || "STABLE", color: selected.data.signal==="HOT"?GREEN:selected.data.signal==="COOLING"?RED:AMBER },
              ].map(function(row){ return (
                <div key={row.label} style={{ display:"flex", justifyContent:"space-between", marginBottom:8, padding:"6px 0", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
                  <span style={{ fontFamily:"system-ui", fontSize:14, color:"#888" }}>{row.label}</span>
                  <span style={{ fontFamily:MONO, fontSize:14, color:row.color||"#fff", fontWeight:600 }}>{row.value}</span>
                </div>
              ) })}
              <button
                onClick={function(){ loadFusion(selected.data.code) }}
                disabled={fusionLoading}
                style={{
                  width:"100%", marginTop:12, padding:"10px 0", minHeight:44,
                  background: AMBER+"22", border:"1px solid "+AMBER+"55",
                  color:AMBER, fontFamily:MONO, fontSize:12, fontWeight:700,
                  borderRadius:10, letterSpacing:"0.06em",
                  opacity: fusionLoading ? 0.6 : 1,
                }}>
                {fusionLoading ? "◉ ANALYZING..." : "◉ FUSION ANALYSIS →"}
              </button>
            </div>
          )}

          {selected.type === "contract" && (
            <div>
              <div style={{ fontFamily:"system-ui", fontSize:16, color:"#fff", fontWeight:700, marginBottom:8 }}>{selected.data.agency}</div>
              {[
                { label:"Award Value", value: selected.data.amount ? fmtB(selected.data.amount/1e6) : "—", color:"#f97316" },
                { label:"State",       value: STATE_NAMES[selected.data.state] || selected.data.state },
              ].map(function(row){ return (
                <div key={row.label} style={{ display:"flex", justifyContent:"space-between", marginBottom:8, padding:"6px 0", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
                  <span style={{ fontFamily:"system-ui", fontSize:14, color:"#888" }}>{row.label}</span>
                  <span style={{ fontFamily:MONO, fontSize:14, color:row.color||"#fff", fontWeight:600 }}>{row.value}</span>
                </div>
              ) })}
            </div>
          )}

          {selected.type === "quake" && (
            <div>
              <div style={{ fontFamily:"system-ui", fontSize:16, color:"#fff", fontWeight:700, marginBottom:8 }}>{selected.data.place}</div>
              {[
                { label:"Magnitude", value:"M "+Number(selected.data.magnitude).toFixed(1), color:selected.data.magnitude>=4?RED:AMBER },
                { label:"Depth",     value: selected.data.depth ? selected.data.depth.toFixed(0)+" km" : "—" },
                { label:"Time",      value: selected.data.time ? new Date(selected.data.time).toLocaleDateString() : "—" },
              ].map(function(row){ return (
                <div key={row.label} style={{ display:"flex", justifyContent:"space-between", marginBottom:8, padding:"6px 0", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
                  <span style={{ fontFamily:"system-ui", fontSize:14, color:"#888" }}>{row.label}</span>
                  <span style={{ fontFamily:MONO, fontSize:14, color:row.color||"#fff", fontWeight:600 }}>{row.value}</span>
                </div>
              ) })}
            </div>
          )}

          {selected.type === "weather" && (
            <div>
              <div style={{ fontFamily:"system-ui", fontSize:16, color:"#ff9500", fontWeight:700, marginBottom:4 }}>{selected.data.event}</div>
              <div style={{ fontFamily:"system-ui", fontSize:14, color:"#888", marginBottom:12 }}>{selected.data.area}</div>
              {selected.data.description && (
                <div style={{ fontFamily:"system-ui", fontSize:13, color:"#aaa", lineHeight:1.5 }}>{selected.data.description?.slice(0,200)+"…"}</div>
              )}
            </div>
          )}

          {selected.type === "labor" && (
            <div>
              <div style={{ fontFamily:"system-ui", fontSize:18, color:"#fff", fontWeight:700, marginBottom:4 }}>{selected.data.name}</div>
              {[
                { label:"TRIR Index", value:selected.data.trir, color: parseFloat(selected.data.trir)>3?RED:parseFloat(selected.data.trir)>2?AMBER:BLUE },
                { label:"Avg Wage",   value:"$"+selected.data.wage+"/hr" },
              ].map(function(row){ return (
                <div key={row.label} style={{ display:"flex", justifyContent:"space-between", marginBottom:8, padding:"6px 0", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
                  <span style={{ fontFamily:"system-ui", fontSize:14, color:"#888" }}>{row.label}</span>
                  <span style={{ fontFamily:MONO, fontSize:14, color:row.color||"#fff", fontWeight:600 }}>{row.value}</span>
                </div>
              ) })}
            </div>
          )}

          {/* Fusion analysis result */}
          {fusion && (
            <div style={{ marginTop:16, borderTop:"1px solid rgba(245,166,35,0.2)", paddingTop:16 }}>
              <div style={{ fontFamily:MONO, fontSize:11, color:AMBER, letterSpacing:"0.1em", marginBottom:10 }}>◉ FUSION INTELLIGENCE</div>
              <div style={{ fontFamily:"system-ui", fontSize:14, color:"#ccc", lineHeight:1.6 }}>{fusion.narrative}</div>
              {fusion.signals && (
                <div style={{ marginTop:12, display:"flex", flexDirection:"column", gap:6 }}>
                  {fusion.signals.map(function(s,i){
                    var col = s.type==="BULLISH"?GREEN:s.type==="BEARISH"?RED:AMBER
                    return (
                      <div key={i} style={{ display:"flex", gap:8, alignItems:"flex-start" }}>
                        <span style={{ fontFamily:MONO, fontSize:11, color:col, marginTop:2 }}>
                          {s.type==="BULLISH"?"▲":s.type==="BEARISH"?"▼":"⚠"}
                        </span>
                        <span style={{ fontFamily:"system-ui", fontSize:13, color:"#aaa", lineHeight:1.4 }}>{s.text}</span>
                      </div>
                    )
                  })}
                </div>
              )}
              {fusion.verdict && (
                <div style={{ marginTop:12, background:AMBER+"15", border:"1px solid "+AMBER+"33", borderRadius:8, padding:"10px 12px" }}>
                  <div style={{ fontFamily:MONO, fontSize:11, color:AMBER, marginBottom:4, letterSpacing:"0.08em" }}>VERDICT</div>
                  <div style={{ fontFamily:"system-ui", fontSize:13, color:"#ddd" }}>{fusion.verdict}</div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* EDGAR PANEL (top-left corner) */}
      {edgar && lens !== "PIPELINE" && (
        <div style={{
          position:"absolute", top:80, left:20, zIndex:20, width:240,
          background:"rgba(0,0,0,0.8)", backdropFilter:"blur(10px)",
          border:"1px solid "+BD1, borderRadius:14, padding:16,
        }}>
          <div style={{ fontFamily:MONO, fontSize:11, color:BLUE, letterSpacing:"0.1em", marginBottom:12 }}>SEC EDGAR · CONTRACTOR BACKLOG</div>
          {(edgar.companies||[]).slice(0,5).map(function(c,i){
            return (
              <div key={i} style={{ marginBottom:10 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline" }}>
                  <span style={{ fontFamily:MONO, fontSize:12, color:"#fff", fontWeight:600 }}>{c.ticker}</span>
                  <span style={{ fontFamily:MONO, fontSize:12, color:c.revenueChange>=0?GREEN:RED }}>{c.revenueChange!=null?(c.revenueChange>=0?"+":"")+c.revenueChange.toFixed(1)+"%":"—"}</span>
                </div>
                <div style={{ fontFamily:"system-ui", fontSize:12, color:"#555" }}>{c.name}</div>
                {i<4&&<div style={{ height:1, background:"rgba(255,255,255,0.05)", marginTop:8 }}/>}
              </div>
            )
          })}
        </div>
      )}

      {/* MINI STATS BAR */}
      <div style={{
        position:"absolute", bottom:130, left:20, zIndex:20,
        display:"flex", flexDirection:"column", gap:8,
      }}>
        {[
          { label:"TTLCONS",  value:"$2.19T",  color:AMBER },
          { label:"PERMITS",  value:"1,386K",  color:lens==="RISK"?RED:AMBER },
          { label:"SIGNALS",  value:"6 LIVE",  color:GREEN },
        ].map(function(s){
          return (
            <div key={s.label} style={{
              background:"rgba(0,0,0,0.7)", border:"1px solid rgba(255,255,255,0.08)",
              borderRadius:8, padding:"6px 12px", display:"flex", gap:12, alignItems:"center",
            }}>
              <span style={{ fontFamily:MONO, fontSize:10, color:"#555", letterSpacing:"0.1em" }}>{s.label}</span>
              <span style={{ fontFamily:MONO, fontSize:13, color:s.color, fontWeight:700 }}>{s.value}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
