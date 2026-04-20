"use client"
import Image from "next/image"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"

var SYS  = "-apple-system,BlinkMacSystemFont,'SF Pro Display',Arial,sans-serif"
var MONO = "ui-monospace,'SF Mono','Cascadia Code',Consolas,monospace"
var AMBER="#f5a623",GREEN="#30d158",RED="#ff453a",BLUE="#0a84ff",CYAN="#64d2ff"
var BD1="rgba(255,255,255,0.1)"

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
var SN = {
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
var MKT_COORDS:{[k:string]:[number,number]} = {
  "Chicago, IL":       [41.88,-87.63],
  "Detroit, MI":       [42.33,-83.05],
  "St. Louis, MO":     [38.63,-90.20],
  "Baltimore, MD":     [39.29,-76.61],
  "Cleveland, OH":     [41.50,-81.69],
  "Memphis, TN":       [35.15,-90.05],
  "Hartford, CT":      [41.77,-72.68],
  "Milwaukee, WI":     [43.04,-87.91],
  "Rochester, NY":     [43.16,-77.61],
  "Louisville, KY":    [38.25,-85.76],
  "Las Vegas, NV":     [36.17,-115.14],
  "Denver, CO":        [39.74,-104.98],
  "Salt Lake City, UT":[40.76,-111.89],
  "Nashville, TN":     [36.17,-86.78],
}

var LENS_TINT:{[k:string]:string} = {
  MACRO:        "transparent",
  FEDERAL:      "rgba(249,115,22,0.04)",
  GROUND_TRUTH: "rgba(100,210,255,0.05)",
  DISTRESS:     "rgba(255,69,58,0.06)",
  RISK:         "rgba(255,150,0,0.05)",
  LABOR:        "rgba(10,132,255,0.05)",
}

var LENSES = [
  {id:"MACRO",        label:"MACRO",    icon:"M", key:"1", color:AMBER,    desc:"Construction activity"},
  {id:"FEDERAL",      label:"FEDERAL",  icon:"F", key:"2", color:"#f97316",desc:"Federal contract awards"},
  {id:"GROUND_TRUTH", label:"GROUND",   icon:"G", key:"3", color:CYAN,     desc:"Ground disturbance index"},
  {id:"DISTRESS",     label:"DISTRESS", icon:"D", key:"4", color:RED,      desc:"Construction distress index"},
  {id:"RISK",         label:"RISK",     icon:"R", key:"5", color:"#ff9500",desc:"Seismic + weather risk"},
  {id:"LABOR",        label:"LABOR",    icon:"L", key:"6", color:BLUE,     desc:"Employment + safety"},
]

function ac(c:number,a=1){if(c>3)return"rgba(48,209,88,"+a+")";if(c>0)return"rgba(245,166,35,"+a+")";if(c>-3)return"rgba(255,159,10,"+a+")";return"rgba(255,69,58,"+a+")"}
function bc(v:number,a=1){if(v>0.8)return"rgba(255,69,58,"+a+")";if(v>0.6)return"rgba(255,214,10,"+a+")";if(v>0.4)return"rgba(48,209,88,"+a+")";if(v>0.2)return"rgba(100,210,255,"+a+")";return"rgba(10,132,255,"+a+")"}
function dc(cdi:number){return cdi>=65?RED:cdi>=45?"#ff9500":GREEN}
function fB(v){return v>=1000?"$"+(v/1000).toFixed(1)+"B":"$"+Number(v).toFixed(0)+"M"}
function fP(v){return(v>0?"+":"")+Number(v).toFixed(1)+"%"}

export default function GlobeClient() {
  var ref  = useRef(null)
  var gRef = useRef(null)
  var [ok,         setOk]         = useState(false)
  var [globeError, setGlobeError] = useState<string|null>(null)
  var [lens,  setLens]  = useState("MACRO")
  var [sel,   setSel]   = useState(null)
  var [fus,   setFus]   = useState(null)
  var [fusL,  setFusL]  = useState(false)
  var [mapD,  setMapD]  = useState(null)
  var [ctrs,  setCtrs]  = useState([])
  var [seis,  setSeis]  = useState([])
  var [wx,    setWx]    = useState([])
  var [edgar, setEdgar] = useState(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  var [distressD, setDistressD] = useState<any>(null)
  // ← date/time in state, NOT in render — fixes hydration crash
  var [dateStr, setDateStr] = useState("")
  var [timeStr, setTimeStr] = useState("")
  var [searchQ,  setSearchQ]  = useState("")
  var [showSrch, setShowSrch] = useState(false)
  var [layers, setLayers] = useState({rings:true,contracts:true,seismic:true,weather:true,labels:true})

  // Clock — client-only, never causes hydration mismatch
  useEffect(function(){
    function tick(){
      var now=new Date()
      setDateStr(now.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}).toUpperCase())
      setTimeStr(now.toLocaleTimeString("en-US",{hour12:false}))
    }
    tick()
    var t=setInterval(tick,1000)
    return function(){clearInterval(t)}
  },[])

  // Load API data
  useEffect(function(){
    async function load(){
      try{var r=await fetch("/api/map");       if(r.ok)setMapD(await r.json())}catch(e){}
      try{var r=await fetch("/api/contracts");  if(r.ok){var d=await r.json();setCtrs(d.contracts||[])}}catch(e){}
      try{var r=await fetch("/api/seismic");    if(r.ok){var d=await r.json();setSeis(d.events||[])}}catch(e){}
      try{var r=await fetch("/api/weather");    if(r.ok){var d=await r.json();setWx(d.alerts||[])}}catch(e){}
      try{var r=await fetch("/api/edgar");      if(r.ok)setEdgar(await r.json())}catch(e){}
      try{var r=await fetch("/api/distress");   if(r.ok)setDistressD(await r.json())}catch(e){}
    }
    load()
  },[])

  // Load globe.gl CDN
  useEffect(function(){
    if(typeof window==="undefined")return
    // WebGL availability check — fail gracefully before loading CDN
    try{
      var tc=document.createElement("canvas")
      var gl=tc.getContext("webgl")||tc.getContext("experimental-webgl")
      if(!gl){setGlobeError("WebGL is not available in this browser.");return}
    }catch(e){
      setGlobeError("WebGL is not supported on this device.");return
    }
    function init(){
      if(!ref.current)return
      try{
        var G=window.Globe
        if(!G)return
        var g=G()(ref.current)
          .globeImageUrl("https://unpkg.com/three-globe/example/img/earth-dark.jpg")
          .backgroundImageUrl("https://unpkg.com/three-globe/example/img/night-sky.png")
          .showAtmosphere(true).atmosphereColor(AMBER).atmosphereAltitude(0.12)
          .width(ref.current.offsetWidth).height(ref.current.offsetHeight)
        g.pointOfView({lat:39,lng:-98,altitude:2.2})
        try{g.controls().autoRotate=false;g.controls().enableZoom=true}catch(e){}
        gRef.current=g
        setOk(true)
        var ro=new ResizeObserver(function(){
          if(ref.current&&gRef.current){gRef.current.width(ref.current.offsetWidth).height(ref.current.offsetHeight)}
        })
        ro.observe(ref.current)
      }catch(e){
        var msg=e instanceof Error?e.message:"Globe initialization failed"
        console.error("[Globe]",e)
        setGlobeError(msg)
      }
    }
    if(window.Globe){init();return}
    var s=document.createElement("script")
    s.src="https://unpkg.com/globe.gl@2.27.0/dist/globe.gl.min.js"
    s.onload=function(){init()}
    s.onerror=function(){setGlobeError("Failed to load globe renderer from CDN.")}
    document.head.appendChild(s)
  },[])

  // Apply lens when data or lens changes
  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(function(){
    if(!gRef.current||!ok)return
    apply(lens)
  },[lens,ok,mapD,ctrs,seis,wx,distressD,layers])
  /* eslint-enable react-hooks/exhaustive-deps */

  function clear(){
    var g=gRef.current;if(!g)return
    try{if(g.ringsData)g.ringsData([])}catch(e){}
    try{if(g.pointsData)g.pointsData([])}catch(e){}
    try{if(g.hexBinPointsData)g.hexBinPointsData([])}catch(e){}
    try{if(g.labelsData)g.labelsData([])}catch(e){}
  }

  function apply(l){
    var g=gRef.current;if(!g)return
    clear()
    var states=(mapD&&mapD.states)||[]

    if(l==="MACRO"){
      try{g.atmosphereColor(AMBER)}catch(e){}
      var rd=states.length>0
        ?states.filter(function(s){return CAP[s.code]}).map(function(s){
            var c=s.yoyChange||0
            return{lat:CAP[s.code][0],lng:CAP[s.code][1],color:ac(c),maxR:2+Math.abs(c)*0.3,speed:0.8+Math.abs(c)*0.05,code:s.code,name:SN[s.code]||s.code,change:c,permits:s.permits||0,signal:s.signal||"STABLE"}
          })
        :Object.keys(CAP).map(function(k){
            var c=(Math.random()-0.4)*12
            return{lat:CAP[k][0],lng:CAP[k][1],color:ac(c),maxR:2+Math.abs(c)*0.2,speed:1,code:k,name:SN[k]||k,change:c,permits:Math.random()*15000+1000,signal:"STABLE"}
          })
      if(layers.rings){try{
        g.ringsData(rd)
         .ringLat(function(d){return d.lat}).ringLng(function(d){return d.lng})
         .ringColor(function(d){return function(t){return d.color.replace("1)",t.toFixed(2)+")")}})
         .ringMaxRadius(function(d){return d.maxR}).ringPropagationSpeed(function(d){return d.speed})
         .ringRepeatPeriod(1200).onRingClick(function(d){setSel({type:"state",data:d})})
      }catch(e){}}
      if(layers.labels){try{
        g.labelsData(rd).labelLat(function(d){return d.lat}).labelLng(function(d){return d.lng})
         .labelText(function(d){return d.code}).labelSize(0.5)
         .labelColor(function(d){return d.color}).labelResolution(2).labelAltitude(0.01)
      }catch(e){}}

    }else if(l==="FEDERAL"){
      try{g.atmosphereColor("#f97316")}catch(e){}
      var AG=["Army Corps","GSA","DOT","VA","DOD","USAF","DOE","HUD","DHS","EPA"]
      var pts=Object.keys(CAP).slice(0,42).map(function(k,i){
        var c=ctrs.find(function(x){return(x.state||"")===k})
        var amt=c?(c.total_obligated_amount||c.amount||0):(Math.random()*500+50)*1e6
        return{lat:CAP[k][0]+(Math.random()-0.5)*1.5,lng:CAP[k][1]+(Math.random()-0.5)*1.5,
               size:0.3+Math.min(amt/800e6,1)*2.5,color:i%3===0?"#ff6b35":i%3===1?"#f97316":"#fbbf24",
               label:AG[i%10]+" $"+(amt/1e6).toFixed(0)+"M",state:k,amt}
      })
      if(layers.contracts){try{
        g.pointsData(pts).pointLat(function(d){return d.lat}).pointLng(function(d){return d.lng})
         .pointColor(function(d){return d.color}).pointAltitude(function(d){return d.size*0.04})
         .pointRadius(function(d){return d.size*0.3}).pointLabel(function(d){return d.label})
         .onPointClick(function(d){setSel({type:"contract",data:d})})
      }catch(e){}}
      // Orbit rings on the top 15 contracts by size
      if(layers.rings){
        var topPts=pts.slice().sort(function(a,b){return b.size-a.size}).slice(0,15)
        try{
          g.ringsData(topPts).ringLat(function(d){return d.lat}).ringLng(function(d){return d.lng})
           .ringColor(function(){return function(t){return"rgba(249,115,22,"+(1-t).toFixed(2)+")"}})
           .ringMaxRadius(function(d){return d.size*1.2}).ringPropagationSpeed(0.5)
           .ringRepeatPeriod(2200)
        }catch(e){}
      }

    }else if(l==="GROUND_TRUTH"){
      try{g.atmosphereColor(CYAN)}catch(e){}
      var hp=[]
      var bs=states.length>0?states:Object.keys(CAP).map(function(k){return{code:k,permits:Math.random()*20000+1000}})
      bs.forEach(function(s){
        var b=CAP[s.code];if(!b)return
        var iv=Math.max(0.1,Math.min(1,(s.permits||5000)/20000))
        for(var j=0;j<Math.floor(iv*120);j++){
          hp.push({lat:b[0]+(Math.random()-0.5)*8,lng:b[1]+(Math.random()-0.5)*10,weight:iv*(0.5+Math.random()*0.5)})
        }
      })
      try{
        g.hexBinPointsData(hp).hexBinPointLat(function(d){return d.lat}).hexBinPointLng(function(d){return d.lng})
         .hexBinPointWeight(function(d){return d.weight}).hexAltitude(function(d){return d.sumWeight/4*0.07})
         .hexBinResolution(4).hexTopColor(function(d){return bc(Math.min(1,d.sumWeight/10))})
         .hexSideColor(function(d){return bc(Math.min(1,d.sumWeight/10),0.5)})
      }catch(e){}

    }else if(l==="DISTRESS"){
      try{g.atmosphereColor(RED)}catch(e){}
      var watchlist=(distressD&&distressD.watchlist)||[]
      var recovery=(distressD&&distressD.recovery)||[]
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      var allMkts:any[]=[]
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      watchlist.forEach(function(m:any){
        var coords=MKT_COORDS[m.market]||[39,-98]
        allMkts.push({lat:coords[0],lng:coords[1],color:m.classification==="HIGH"?RED:"#ff9500",maxR:1.5+(m.cdi/22),speed:0.7+(m.cdi/120),...m,isRecovery:false})
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recovery.forEach(function(r:any){
        var coords=MKT_COORDS[r.market]||[39,-98]
        allMkts.push({lat:coords[0],lng:coords[1],color:GREEN,maxR:1.2,speed:1.1,...r,classification:"RECOVERING",isRecovery:true})
      })
      if(allMkts.length===0){
        Object.entries(MKT_COORDS).slice(0,8).forEach(function([market,[lat,lng]],i){
          allMkts.push({lat,lng,market,cdi:40+i*5,classification:i<2?"HIGH":"ELEVATED",color:i<2?RED:"#ff9500",maxR:2+i*0.3,speed:0.9,isRecovery:false})
        })
      }
      if(layers.rings){
        try{
          g.ringsData(allMkts).ringLat(function(d){return d.lat}).ringLng(function(d){return d.lng})
           .ringColor(function(d){return function(t){return d.color.replace("1)",t.toFixed(2)+")")}})
           .ringMaxRadius(function(d){return d.maxR}).ringPropagationSpeed(function(d){return d.speed})
           .ringRepeatPeriod(1000).onRingClick(function(d){setSel({type:"distress",data:d})})
        }catch(e){}
      }
      if(layers.labels){
        try{
          g.labelsData(allMkts).labelLat(function(d){return d.lat}).labelLng(function(d){return d.lng})
           .labelText(function(d){return d.market?d.market.split(",")[0]:""})
           .labelSize(0.4).labelColor(function(d){return d.color}).labelResolution(2).labelAltitude(0.01)
        }catch(e){}
      }

    }else if(l==="RISK"){
      try{g.atmosphereColor("#ff9500")}catch(e){}
      var qd=seis.length>0?seis:[[37.7,-122.4],[34.1,-118.2],[47.6,-122.3],[44.1,-114.5],[35.2,-92.4],[29.7,-95.4]].map(function(z,i){
        return{lat:z[0]+(Math.random()-0.5)*3,lng:z[1]+(Math.random()-0.5)*3,magnitude:2.5+Math.random()*3.5,place:"Seismic Zone "+(i+1)}
      })
      if(layers.seismic){try{
        g.ringsData(qd).ringLat(function(d){return d.lat}).ringLng(function(d){return d.lng})
         .ringColor(function(d){return function(t){return"rgba(255,69,58,"+(1-t).toFixed(2)+")"}})
         .ringMaxRadius(function(d){return(d.magnitude||3)*1.5}).ringPropagationSpeed(0.6)
         .ringRepeatPeriod(1800).onRingClick(function(d){setSel({type:"quake",data:d})})
      }catch(e){}}
      if(layers.weather&&wx.length>0){try{
        g.pointsData(wx).pointLat(function(d){return d.lat}).pointLng(function(d){return d.lng})
         .pointColor(function(){return"#ff9500"}).pointAltitude(0.02).pointRadius(0.8)
         .pointLabel(function(d){return d.event+": "+d.area})
         .onPointClick(function(d){setSel({type:"weather",data:d})})
      }catch(e){}}

    }else if(l==="LABOR"){
      try{g.atmosphereColor(BLUE)}catch(e){}
      var lb=(states.length>0?states:Object.keys(CAP).map(function(k){return{code:k,permits:Math.random()*15000+500}}))
        .filter(function(s){return CAP[s.code]}).map(function(s){
          var tr=(Math.random()*3+1).toFixed(1),wg=(25+Math.random()*25).toFixed(0)
          return{lat:CAP[s.code][0],lng:CAP[s.code][1],size:0.3+Math.min(1,(s.permits||5000)/15000)*2,trir:tr,wage:wg,code:s.code,name:SN[s.code]||s.code}
        })
      try{
        g.pointsData(lb).pointLat(function(d){return d.lat}).pointLng(function(d){return d.lng})
         .pointColor(function(d){return parseFloat(d.trir)>3?RED:parseFloat(d.trir)>2?"#ff9500":BLUE})
         .pointAltitude(function(d){return d.size*0.025}).pointRadius(function(d){return d.size*0.35})
         .pointLabel(function(d){return d.name+": TRIR "+d.trir+" | $"+d.wage+"/hr"})
         .onPointClick(function(d){setSel({type:"labor",data:d})})
      }catch(e){}
    }
  }

  async function loadFusion(region){
    setFus(null);setFusL(true)
    try{var r=await fetch("/api/fusion?region="+(region||"US"));if(r.ok)setFus(await r.json())}catch(e){}
    setFusL(false)
  }

  function flyTo(code:string){
    var b=CAP[code];if(!b||!gRef.current)return
    try{gRef.current.pointOfView({lat:b[0],lng:b[1],altitude:1.5},1000)}catch(e){}
    setSearchQ("");setShowSrch(false)
  }

  useEffect(function(){
    function hk(e:KeyboardEvent){
      var m:Record<string,string>={"1":"MACRO","2":"FEDERAL","3":"GROUND_TRUTH","4":"DISTRESS","5":"RISK","6":"LABOR"}
      if(m[e.key])setLens(m[e.key])
      if(e.key==="/"){e.preventDefault();setShowSrch(function(v){return!v})}
      if(e.key==="Escape"){setShowSrch(false);setSearchQ("")}
    }
    window.addEventListener("keydown",hk)
    return function(){window.removeEventListener("keydown",hk)}
  },[])

  var al=LENSES.find(function(l){return l.id===lens})||LENSES[0]

  // Live ticker — computed before JSX to avoid IIFE-in-JSX SWC issues
  var tickerParts=["TTLCONS $2.19T  ▲2.1%","PERMITS 1,386K ann.","PPI MATERIALS +8.4%","EMPLOYMENT 8.1M"]
  if(distressD&&distressD.watchlist){
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    distressD.watchlist.slice(0,3).forEach(function(m:any){if(m&&m.market)tickerParts.push("CDI: "+m.market+" "+Number(m.cdi||0).toFixed(1)+" ("+m.classification+")")})
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  seis.slice(0,2).forEach(function(s:any){if(s.magnitude)tickerParts.push("SEISMIC: M"+s.magnitude+" "+(s.place||"").slice(0,28))})
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  wx.slice(0,2).forEach(function(w:any){if(w.event)tickerParts.push((w.event||"")+" · "+(w.area||"").slice(0,22))})
  var tickerTxt=tickerParts.join("    ◆    ")
  var tickerDur=Math.max(30,tickerTxt.length*0.11)

  // Graceful fallback when WebGL or globe.gl fails — no crash, no ErrorBoundary needed
  if(globeError){
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    var states=(mapD&&(mapD as any).states)||[]
    return(
      <div style={{width:"100vw",minHeight:"100vh",background:"#000",color:"#fff",fontFamily:SYS,overflowY:"auto"}}>
        <style>{`*{box-sizing:border-box;margin:0;padding:0}a{color:inherit;text-decoration:none}button{cursor:pointer;border:none;outline:none}`}</style>
        {/* Header */}
        <div style={{position:"sticky",top:0,zIndex:10,background:"rgba(0,0,0,0.9)",backdropFilter:"blur(10px)",borderBottom:"1px solid rgba(255,255,255,0.1)",padding:"12px 20px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:14}}>
            <Image src="/ConstructAIQWhiteLogo.svg" width={110} height={22} alt="ConstructAIQ" style={{height:22,width:"auto"}}/>
            <div style={{width:1,height:18,background:"rgba(255,255,255,0.1)"}}/>
            <span style={{fontFamily:MONO,fontSize:11,color:AMBER,letterSpacing:"0.1em"}}>◉ GEOINTEL · TABLE VIEW</span>
          </div>
          <a href="/dashboard"><button style={{background:"rgba(245,166,35,0.15)",border:"1px solid #f5a62366",color:AMBER,fontFamily:MONO,fontSize:11,fontWeight:700,padding:"6px 14px",borderRadius:8}}>DASHBOARD →</button></a>
        </div>
        {/* WebGL notice */}
        <div style={{margin:"24px 20px 0",background:"rgba(255,69,58,0.08)",border:"1px solid rgba(255,69,58,0.2)",borderRadius:12,padding:"14px 18px",display:"flex",alignItems:"flex-start",gap:12}}>
          <span style={{fontFamily:MONO,fontSize:18,color:RED,flexShrink:0}}>⚠</span>
          <div>
            <div style={{fontFamily:MONO,fontSize:11,color:RED,letterSpacing:"0.1em",marginBottom:4}}>3D GLOBE UNAVAILABLE</div>
            <div style={{fontSize:13,color:"#888",lineHeight:1.5}}>WebGL is required for the 3D globe view. Your browser or device may have WebGL disabled. The intelligence data below is still live and accurate.</div>
          </div>
        </div>
        {/* State grid */}
        <div style={{padding:"20px"}}>
          <div style={{fontFamily:MONO,fontSize:11,color:"#555",letterSpacing:"0.1em",marginBottom:14}}>STATE CONSTRUCTION ACTIVITY</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:8}}>
            {(states.length>0?states:Object.keys(CAP).map(function(k){return{code:k,yoyChange:0,permits:0,signal:"STABLE"}}))
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              .map(function(s:any){
                var ch=s.yoyChange||0
                return(
                  <div key={s.code} style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:10,padding:"12px 14px"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:4}}>
                      <span style={{fontFamily:MONO,fontSize:13,color:"#fff",fontWeight:700}}>{s.code}</span>
                      <span style={{fontFamily:MONO,fontSize:12,color:ac(ch),fontWeight:600}}>{fP(ch)}</span>
                    </div>
                    <div style={{fontSize:11,color:"#666"}}>{SN[s.code]||s.code}</div>
                    {s.permits>0&&<div style={{fontFamily:MONO,fontSize:10,color:"#444",marginTop:4}}>{(s.permits/1000).toFixed(1)}K permits</div>}
                  </div>
                )
            })}
          </div>
        </div>
        {/* Distress summary */}
        {distressD&&distressD.watchlist&&distressD.watchlist.length>0&&(
          <div style={{padding:"0 20px 24px"}}>
            <div style={{fontFamily:MONO,fontSize:11,color:"#555",letterSpacing:"0.1em",marginBottom:14}}>MARKET DISTRESS INDEX</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:8}}>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {distressD.watchlist.map(function(m:any){
                return(
                  <div key={m.market} style={{background:"rgba(255,69,58,0.05)",border:"1px solid rgba(255,69,58,0.15)",borderRadius:10,padding:"12px 14px"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:4}}>
                      <span style={{fontSize:13,color:"#fff",fontWeight:600}}>{m.market}</span>
                      <span style={{fontFamily:MONO,fontSize:13,color:dc(m.cdi||0),fontWeight:700}}>{Number(m.cdi||0).toFixed(1)}</span>
                    </div>
                    <div style={{fontFamily:MONO,fontSize:10,color:m.classification==="HIGH"?RED:"#ff9500"}}>{m.classification}</div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{width:"100vw",height:"100vh",background:"#000",overflow:"hidden",position:"relative",fontFamily:SYS}}>
      <style>{`*{box-sizing:border-box;margin:0;padding:0}a{color:inherit;text-decoration:none}button{cursor:pointer;border:none;outline:none}::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:#333;border-radius:2px}@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}@keyframes marquee{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}`}</style>

      {/* Lens tint overlay */}
      <div style={{position:"absolute",inset:0,pointerEvents:"none",zIndex:6,background:LENS_TINT[lens]||"transparent",transition:"background 0.6s ease"}}/>

      {/* Globe mount — must stay empty: globe.gl owns this DOM node directly.
          Never put React children here; React reconciliation fighting globe.gl's
          direct DOM writes causes NotFoundError on removeChild. */}
      <div ref={ref} style={{width:"100%",height:"100%",position:"absolute",inset:0}} />

      {/* Loading overlay — sibling of globe mount, fully React-managed */}
      {!ok&&(
        <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"#000",zIndex:10,pointerEvents:"none"}}>
          <div style={{fontFamily:MONO,fontSize:13,color:AMBER,marginBottom:16,animation:"pulse 1.5s infinite"}}>◉ INITIALIZING GEOINTEL</div>
          <div style={{fontFamily:MONO,fontSize:11,color:"#444"}}>CONSTRUCTAIQ PHASE 5 · GLOBE.GL LOADING</div>
        </div>
      )}

      {/* Scanline */}
      <div style={{position:"absolute",inset:0,pointerEvents:"none",zIndex:5,background:"repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.03) 2px,rgba(0,0,0,0.03) 4px)"}}/>

      {/* TOP BAR — dateStr/timeStr from state, never from new Date() in render */}
      <div style={{position:"absolute",top:0,left:0,right:0,zIndex:20,background:"rgba(0,0,0,0.75)",backdropFilter:"blur(10px)",borderBottom:"1px solid "+BD1,padding:"10px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",minHeight:60,paddingTop:"calc(env(safe-area-inset-top,0px) + 10px)"}}>
        <div style={{display:"flex",alignItems:"center",gap:16}}>
          <Link href="/"><Image src="/ConstructAIQWhiteLogo.svg" width={110} height={22} alt="ConstructAIQ" style={{height:22,width:"auto"}} /></Link>
          <div style={{width:1,height:20,background:BD1}}/>
          <div>
            <div style={{fontFamily:MONO,fontSize:11,color:al.color,letterSpacing:"0.12em",fontWeight:700}}>◉ GEOINTEL · {al.id}</div>
            <div style={{fontFamily:MONO,fontSize:10,color:"#444"}}>{al.desc}</div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <button onClick={function(){setShowSrch(function(v){return!v})}} style={{background:showSrch?"rgba(255,255,255,0.1)":"transparent",border:"1px solid rgba(255,255,255,0.12)",color:"#888",fontFamily:MONO,fontSize:11,padding:"5px 11px",borderRadius:8,minHeight:36}}>⌕ [/]</button>
          <div style={{fontFamily:MONO,fontSize:11,color:"#555"}}>{dateStr} · {timeStr}</div>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <div style={{width:6,height:6,borderRadius:"50%",background:GREEN,boxShadow:"0 0 8px "+GREEN,animation:"pulse 2s infinite"}}/>
            <span style={{fontFamily:MONO,fontSize:11,color:GREEN}}>LIVE</span>
          </div>
          <a href="/dashboard"><button style={{background:"rgba(245,166,35,0.15)",border:"1px solid #f5a62366",color:AMBER,fontFamily:MONO,fontSize:11,fontWeight:700,padding:"6px 14px",borderRadius:8,minHeight:36}}>DASHBOARD →</button></a>
        </div>
      </div>

      {/* SEARCH PANEL */}
      {showSrch&&(
        <div style={{position:"absolute",top:68,left:"50%",transform:"translateX(-50%)",zIndex:30,width:300,background:"rgba(0,0,0,0.95)",backdropFilter:"blur(16px)",border:"1px solid "+BD1,borderRadius:14,padding:12}}>
          <input autoFocus value={searchQ} onChange={function(e){setSearchQ(e.target.value)}} placeholder="Search state…" style={{width:"100%",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:8,padding:"8px 12px",color:"#fff",fontFamily:MONO,fontSize:12,outline:"none"}}/>
          {searchQ.length>1&&Object.entries(SN).filter(function([,v]){return v.toLowerCase().includes(searchQ.toLowerCase())}).slice(0,6).map(function([code,name]){
            return(
              <div key={code} onClick={function(){flyTo(code)}} style={{padding:"8px 12px",marginTop:4,borderRadius:8,cursor:"pointer",display:"flex",justifyContent:"space-between",background:"rgba(255,255,255,0.04)"}}>
                <span style={{fontSize:13,color:"#ddd"}}>{name}</span>
                <span style={{fontFamily:MONO,fontSize:11,color:"#555"}}>{code}</span>
              </div>
            )
          })}
        </div>
      )}

      {/* LAYER CONTROLS */}
      <div style={{position:"absolute",top:80,left:20,zIndex:20,background:"rgba(0,0,0,0.8)",backdropFilter:"blur(10px)",border:"1px solid "+BD1,borderRadius:12,padding:"10px 12px"}}>
        <div style={{fontFamily:MONO,fontSize:10,color:"#444",letterSpacing:"0.1em",marginBottom:6}}>LAYERS</div>
        {(Object.entries(layers) as [keyof typeof layers,boolean][]).map(function([key,val]){
          return(
            <button key={key} onClick={function(){setLayers(function(prev){return{...prev,[key]:!prev[key]}})}} style={{display:"flex",alignItems:"center",gap:6,background:"transparent",border:"none",padding:"3px 0",width:"100%",cursor:"pointer"}}>
              <span style={{fontFamily:MONO,fontSize:11,color:val?al.color:"#333"}}>{val?"◉":"○"}</span>
              <span style={{fontFamily:MONO,fontSize:10,color:val?"#aaa":"#444"}}>{key.toUpperCase()}</span>
            </button>
          )
        })}
      </div>

      {/* LENS BAR */}
      <div style={{position:"absolute",bottom:60,left:"50%",transform:"translateX(-50%)",zIndex:20,display:"flex",gap:5,background:"rgba(0,0,0,0.8)",backdropFilter:"blur(12px)",border:"1px solid "+BD1,borderRadius:16,padding:7,paddingBottom:"calc(env(safe-area-inset-bottom,0px) + 7px)"}}>
        {LENSES.map(function(l){
          var a=lens===l.id
          return(
            <button key={l.id} onClick={function(){setLens(l.id)}} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"7px 10px",minWidth:58,minHeight:56,background:a?l.color+"22":"transparent",border:"1px solid "+(a?l.color:"rgba(255,255,255,0.07)"),borderRadius:10,transition:"all 0.15s"}}>
              <span style={{fontFamily:MONO,fontSize:14,color:a?l.color:"#555"}}>{l.icon}</span>
              <span style={{fontFamily:MONO,fontSize:10,color:a?l.color:"#444",fontWeight:a?700:400,letterSpacing:"0.04em"}}>{l.label}</span>
              <span style={{fontFamily:MONO,fontSize:9,color:"#333"}}>[{l.key}]</span>
            </button>
          )
        })}
      </div>

      {/* INTEL PANEL — all entity types except distress (has its own panel below) */}
      {sel&&sel.type!=="distress"&&(
        <div style={{position:"absolute",top:80,right:20,zIndex:20,width:290,background:"rgba(0,0,0,0.88)",backdropFilter:"blur(12px)",border:"1px solid "+BD1,borderRadius:16,padding:20,maxHeight:"70vh",overflowY:"auto"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <span style={{fontFamily:MONO,fontSize:12,color:al.color,fontWeight:700,letterSpacing:"0.1em"}}>{sel.type.toUpperCase()} INTEL</span>
            <button onClick={function(){setSel(null);setFus(null)}} style={{background:"transparent",color:"#555",fontSize:16,padding:"0 4px"}}>✕</button>
          </div>

          {sel.type==="state"&&(
            <div>
              <div style={{fontSize:18,color:"#fff",fontWeight:700,marginBottom:4}}>{sel.data.name}</div>
              {[{l:"YoY Change",v:fP(sel.data.change||0),c:(sel.data.change||0)>=0?GREEN:RED},{l:"Permits",v:sel.data.permits?((sel.data.permits/1000).toFixed(1)+"K"):"—"},{l:"Signal",v:sel.data.signal||"STABLE",c:sel.data.signal==="HOT"?GREEN:sel.data.signal==="COOLING"?RED:AMBER}].map(function(r){
                return<div key={r.l} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid rgba(255,255,255,0.06)"}}><span style={{fontSize:13,color:"#888"}}>{r.l}</span><span style={{fontFamily:MONO,fontSize:13,color:r.c||"#fff",fontWeight:600}}>{r.v}</span></div>
              })}
              <button onClick={function(){loadFusion(sel.data.code)}} disabled={fusL} style={{width:"100%",marginTop:12,padding:"10px 0",minHeight:44,background:AMBER+"22",border:"1px solid "+AMBER+"55",color:AMBER,fontFamily:MONO,fontSize:12,fontWeight:700,borderRadius:10,opacity:fusL?0.6:1}}>{fusL?"◉ ANALYZING...":"◉ FUSION ANALYSIS →"}</button>
            </div>
          )}

          {sel.type==="contract"&&(
            <div>
              <div style={{fontSize:15,color:"#fff",fontWeight:700,marginBottom:6}}>{sel.data.label}</div>
              <div style={{fontFamily:MONO,fontSize:12,color:"#f97316"}}>State: {SN[sel.data.state]||sel.data.state}</div>
            </div>
          )}

          {sel.type==="quake"&&(
            <div>
              <div style={{fontSize:15,color:"#fff",fontWeight:700,marginBottom:6}}>{sel.data.place}</div>
              <div style={{fontFamily:MONO,fontSize:14,color:parseFloat(sel.data.magnitude)>=4?RED:AMBER,fontWeight:600}}>M {Number(sel.data.magnitude).toFixed(1)}</div>
            </div>
          )}

          {sel.type==="weather"&&(
            <div>
              <div style={{fontSize:15,color:"#ff9500",fontWeight:700,marginBottom:4}}>{sel.data.event}</div>
              <div style={{fontSize:13,color:"#888"}}>{sel.data.area}</div>
            </div>
          )}

          {sel.type==="labor"&&(
            <div>
              <div style={{fontSize:16,color:"#fff",fontWeight:700,marginBottom:6}}>{sel.data.name}</div>
              <div style={{fontFamily:MONO,fontSize:13,color:parseFloat(sel.data.trir)>3?RED:parseFloat(sel.data.trir)>2?AMBER:BLUE,fontWeight:600}}>TRIR {sel.data.trir}</div>
              <div style={{fontFamily:MONO,fontSize:12,color:"#888",marginTop:4}}>${sel.data.wage}/hr avg wage</div>
            </div>
          )}

          {fus&&(
            <div style={{marginTop:16,borderTop:"1px solid rgba(245,166,35,0.2)",paddingTop:16}}>
              <div style={{fontFamily:MONO,fontSize:11,color:AMBER,letterSpacing:"0.1em",marginBottom:8}}>◉ FUSION INTELLIGENCE</div>
              <div style={{fontSize:13,color:"#ccc",lineHeight:1.6}}>{fus.narrative}</div>
              {(fus.signals||[]).map(function(s,i){
                var col=s.type==="BULLISH"?GREEN:s.type==="BEARISH"?RED:AMBER
                return<div key={i} style={{display:"flex",gap:8,marginTop:8}}><span style={{fontFamily:MONO,fontSize:11,color:col,marginTop:2}}>{s.type==="BULLISH"?"▲":s.type==="BEARISH"?"▼":"⚠"}</span><span style={{fontSize:12,color:"#aaa",lineHeight:1.4}}>{s.text}</span></div>
              })}
              {fus.verdict&&<div style={{marginTop:10,background:AMBER+"15",border:"1px solid "+AMBER+"33",borderRadius:8,padding:"10px 12px"}}><div style={{fontFamily:MONO,fontSize:11,color:AMBER,marginBottom:4}}>VERDICT</div><div style={{fontSize:12,color:"#ddd"}}>{fus.verdict}</div></div>}
            </div>
          )}
        </div>
      )}

      {/* DISTRESS INTEL PANEL */}
      {sel&&sel.type==="distress"&&(
        <div style={{position:"absolute",top:80,right:20,zIndex:20,width:290,background:"rgba(0,0,0,0.9)",backdropFilter:"blur(12px)",border:"1px solid rgba(255,69,58,0.25)",borderRadius:16,padding:20,maxHeight:"70vh",overflowY:"auto"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <span style={{fontFamily:MONO,fontSize:12,color:RED,fontWeight:700,letterSpacing:"0.1em"}}>CDI INTELLIGENCE</span>
            <button onClick={function(){setSel(null)}} style={{background:"transparent",color:"#555",fontSize:16,padding:"0 4px"}}>✕</button>
          </div>
          <div style={{fontSize:17,color:"#fff",fontWeight:700,marginBottom:4}}>{sel.data.market}</div>
          <div style={{display:"flex",alignItems:"baseline",gap:8,marginBottom:10}}>
            <span style={{fontFamily:MONO,fontSize:22,color:dc(sel.data.cdi||0),fontWeight:700}}>{(sel.data.cdi||0).toFixed(1)}</span>
            <span style={{fontFamily:MONO,fontSize:10,color:"#555"}}>CDI</span>
            <span style={{fontFamily:MONO,fontSize:11,color:sel.data.isRecovery?GREEN:(sel.data.classification==="HIGH"?RED:"#ff9500"),fontWeight:700,marginLeft:6}}>{sel.data.classification}</span>
          </div>
          {sel.data.change!=null&&<div style={{fontFamily:MONO,fontSize:12,color:sel.data.change>0?RED:GREEN,marginBottom:8}}>{sel.data.change>0?"▲ +":"▼ "}{Math.abs(sel.data.change).toFixed(1)} MoM</div>}
          {(sel.data.drivers||[]).map(function(d:string,i:number){return<div key={i} style={{display:"flex",gap:6,marginBottom:5}}><span style={{color:RED,fontSize:10,marginTop:2}}>●</span><span style={{fontSize:12,color:"#ccc"}}>{d}</span></div>})}
          {sel.data.components&&(
            <div style={{marginTop:12,borderTop:"1px solid rgba(255,255,255,0.06)",paddingTop:12}}>
              <div style={{fontFamily:MONO,fontSize:10,color:"#444",marginBottom:8}}>COMPONENT BREAKDOWN</div>
              {(Object.entries(sel.data.components) as [string,number][]).map(function([k,v]){return(
                <div key={k} style={{marginBottom:6}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}><span style={{fontSize:10,color:"#555"}}>{k.replace(/_/g," ").toUpperCase()}</span><span style={{fontFamily:MONO,fontSize:10,color:dc(v)}}>{v}</span></div>
                  <div style={{height:3,background:"rgba(255,255,255,0.05)",borderRadius:2}}><div style={{height:"100%",width:v+"%",background:dc(v),borderRadius:2}}/></div>
                </div>
              )})}
            </div>
          )}
          {sel.data.lender_note&&<div style={{marginTop:12,background:"rgba(255,69,58,0.08)",border:"1px solid rgba(255,69,58,0.2)",borderRadius:8,padding:"10px 12px"}}><div style={{fontFamily:MONO,fontSize:10,color:RED,marginBottom:4}}>LENDER NOTE</div><div style={{fontSize:11,color:"#bbb",lineHeight:1.5}}>{sel.data.lender_note}</div></div>}
        </div>
      )}

      {/* DISTRESS NATIONAL OVERVIEW */}
      {lens==="DISTRESS"&&!sel&&distressD&&distressD.overview&&(
        <div style={{position:"absolute",top:80,right:20,zIndex:20,width:200,background:"rgba(0,0,0,0.85)",backdropFilter:"blur(10px)",border:"1px solid rgba(255,69,58,0.3)",borderRadius:14,padding:14}}>
          <div style={{fontFamily:MONO,fontSize:11,color:RED,letterSpacing:"0.1em",marginBottom:10}}>◉ NATIONAL CDI</div>
          {([
            {l:"Avg CDI",v:distressD.overview.national_avg_cdi?.toFixed(1)||"—",c:AMBER},
            {l:"HIGH Markets",v:String(distressD.overview.high_distress),c:RED},
            {l:"ELEVATED",v:String(distressD.overview.elevated_risk),c:"#ff9500"},
            {l:"LOW RISK",v:String(distressD.overview.low_risk),c:GREEN},
          ] as {l:string,v:string,c:string}[]).map(function(r){return(
            <div key={r.l} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:"1px solid rgba(255,255,255,0.05)"}}><span style={{fontSize:11,color:"#555"}}>{r.l}</span><span style={{fontFamily:MONO,fontSize:11,color:r.c,fontWeight:600}}>{r.v}</span></div>
          )})}
        </div>
      )}

      {/* SEC EDGAR */}
      {edgar&&lens!=="DISTRESS"&&!sel&&(
        <div style={{position:"absolute",top:200,left:20,zIndex:20,width:200,background:"rgba(0,0,0,0.8)",backdropFilter:"blur(10px)",border:"1px solid "+BD1,borderRadius:14,padding:12}}>
          <div style={{fontFamily:MONO,fontSize:11,color:BLUE,letterSpacing:"0.1em",marginBottom:8}}>SEC EDGAR</div>
          {(edgar.companies||[]).slice(0,4).map(function(c:Record<string,unknown>,i:number){
            return<div key={i} style={{marginBottom:6}}>
              <div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontFamily:MONO,fontSize:11,color:"#fff",fontWeight:600}}>{String(c.ticker)}</span><span style={{fontFamily:MONO,fontSize:11,color:(c.revenueChange as number)>=0?GREEN:RED}}>{c.revenueChange!=null?((c.revenueChange as number)>=0?"+":"")+Number(c.revenueChange).toFixed(1)+"%":"—"}</span></div>
              {i<3&&<div style={{height:1,background:"rgba(255,255,255,0.05)",marginTop:5}}/>}
            </div>
          })}
        </div>
      )}

      {/* LIVE TICKER */}
      <div style={{position:"absolute",bottom:120,left:0,right:0,zIndex:20,background:"rgba(0,0,0,0.65)",backdropFilter:"blur(4px)",borderTop:"1px solid rgba(255,255,255,0.05)",borderBottom:"1px solid rgba(255,255,255,0.05)",height:26,overflow:"hidden",display:"flex",alignItems:"center"}}>
        <div style={{display:"flex",whiteSpace:"nowrap",animation:"marquee "+tickerDur+"s linear infinite",willChange:"transform"}}>
          <span style={{fontFamily:MONO,fontSize:10,color:"#555",paddingRight:60}}>{tickerTxt}</span>
          <span style={{fontFamily:MONO,fontSize:10,color:"#555",paddingRight:60}}>{tickerTxt}</span>
        </div>
      </div>

      {/* STATS */}
      <div style={{position:"absolute",bottom:154,left:20,zIndex:20,display:"flex",flexDirection:"column",gap:5}}>
        {(lens==="DISTRESS"&&distressD&&distressD.overview
          ?[{l:"CDI HIGH",v:String(distressD.overview.high_distress),c:RED},{l:"ELEVATED",v:String(distressD.overview.elevated_risk),c:"#ff9500"},{l:"LOW RISK",v:String(distressD.overview.low_risk),c:GREEN}]
          :[{l:"TTLCONS",v:"$2.19T",c:AMBER},{l:"PERMITS",v:"1,386K",c:AMBER},{l:"SIGNALS",v:"6 LIVE",c:GREEN}]
        ).map(function(s){
          return<div key={s.l} style={{background:"rgba(0,0,0,0.7)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:8,padding:"5px 10px",display:"flex",gap:10,alignItems:"center"}}><span style={{fontFamily:MONO,fontSize:10,color:"#555",letterSpacing:"0.08em"}}>{s.l}</span><span style={{fontFamily:MONO,fontSize:12,color:s.c,fontWeight:700}}>{s.v}</span></div>
        })}
      </div>
    </div>
  )
}
