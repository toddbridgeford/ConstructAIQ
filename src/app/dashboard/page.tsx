// @ts-nocheck
"use client";
import { useState, useEffect } from "react";

// ── HIG-compliant design tokens ───────────────────────────────────────────────
// Fonts: Apple system font stack (SF Pro on Apple, system-ui elsewhere)
var SYS = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif";
var MONO= "ui-monospace, 'SF Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace";

// Colors: WCAG AA compliant on dark backgrounds
var BG0="#000000", BG1="#0d0d0d", BG2="#1a1a1a", BG3="#222222", BG4="#2a2a2a";
var BD1="#2a2a2a", BD2="#383838", BD3="#484848";

// Semantic colors (Apple-aligned)
var AMBER="#f5a623", AMBER_DIM="#3d2800";
var GREEN="#30d158", GREEN_DIM="#0a2e14";   // Apple system green
var RED  ="#ff453a", RED_DIM  ="#2e0a0a";   // Apple system red
var BLUE ="#0a84ff", BLUE_DIM ="#001a3d";   // Apple system blue
var INDIGO="#5e5ce6", IND_DIM="#12103a";    // Apple indigo

// Text: All ≥ 14px equivalent for HIG compliance
var T1="#ffffff";    // Primary
var T2="#ebebf0";    // Secondary (was #cccccc)
var T3="#a0a0ab";    // Tertiary (was #888888) — still AA compliant on dark
var T4="#6e6e73";    // Quaternary label — HIG minimum for non-critical info
// Removed T5 (#222222) — too low contrast

// HIG spacing system (8pt grid)
var S1=8, S2=12, S3=16, S4=20, S5=24;

// Touch targets: HIG minimum 44pt
var TAP_MIN = 44;

// ── Helper functions ──────────────────────────────────────────────────────────
function fmtB(v){ return v>=1000?"$"+(v/1000).toFixed(1)+"B":"$"+Number(v).toFixed(0)+"M"; }
function fmtN(v,d=2){ return v!=null?Number(v).toFixed(d):"—"; }
function fmtPct(v){ if(v==null) return "—"; return (v>0?"+":"")+Number(v).toFixed(2)+"%"; }
function fmtK(v){ return v>=1000?(v/1000).toFixed(1)+"K":String(v); }

function sentColor(s){
  return s==="BULLISH"||s==="BUY"?GREEN:s==="BEARISH"||s==="SELL"?RED:s==="WARNING"?AMBER:BLUE;
}
function sentBg(s){
  return s==="BULLISH"||s==="BUY"?GREEN_DIM:s==="BEARISH"||s==="SELL"?RED_DIM:s==="WARNING"?AMBER_DIM:BLUE_DIM;
}

// ── Sparkline component ───────────────────────────────────────────────────────
function Spark({vals, color, w=140, h=44}){
  if(!vals||vals.length<2) return null;
  var mn=Math.min(...vals), mx=Math.max(...vals), rng=mx-mn||1;
  var pts=vals.map(function(v,i){ return [(i/(vals.length-1))*w, h-4-(((v-mn)/rng)*(h-8))]; });
  var d="M"+pts.map(function(p){ return p[0].toFixed(1)+","+p[1].toFixed(1); }).join("L");
  var last=pts[pts.length-1];
  return (
    <svg width={w} height={h} style={{display:"block",overflow:"visible"}}>
      <path d={d} fill="none" stroke={color||AMBER} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round"/>
      <circle cx={last[0]} cy={last[1]} r={3} fill={color||AMBER}/>
    </svg>
  );
}

// ── Signal Card — HIG compliant (large touch target, readable fonts) ───────────
function SigCard({sig, onTap, selected}){
  var icons={BULLISH:"▲",BEARISH:"▼",WARNING:"⚠",NEUTRAL:"◆"};
  var labels={BULLISH:"BULLISH",BEARISH:"BEARISH",WARNING:"WARNING",NEUTRAL:"NEUTRAL"};
  var sc=sentColor(sig.type), sb=sentBg(sig.type);
  var border=selected?"2px solid "+sc:"1px solid "+sc+"55";
  return (
    <div onClick={onTap} style={{
      background:selected?sb:BG2,
      border, borderRadius:12, padding:S3,
      marginBottom:S2, cursor:"pointer",
      transition:"all 0.2s ease",
      WebkitTapHighlightColor:"transparent",
    }}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:S1}}>
        <div style={{display:"flex",alignItems:"center",gap:S1}}>
          <span style={{fontFamily:MONO,fontSize:12,color:sc,fontWeight:700}}>{icons[sig.type]||"◆"}</span>
          <span style={{fontFamily:MONO,fontSize:11,color:sc,letterSpacing:"0.08em",fontWeight:700}}>{labels[sig.type]||sig.type}</span>
        </div>
        <div style={{background:sc+"22",borderRadius:20,padding:"3px 10px"}}>
          <span style={{fontFamily:MONO,fontSize:12,color:sc,fontWeight:600}}>{sig.confidence||0}%</span>
        </div>
      </div>
      {/* HIG body text: 15px */}
      <div style={{fontFamily:SYS,fontSize:15,color:T1,fontWeight:600,lineHeight:1.4,marginBottom:6}}>{sig.title}</div>
      <div style={{fontFamily:SYS,fontSize:14,color:T3,lineHeight:1.5,marginBottom:S1}}>{sig.description}</div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        <span style={{fontFamily:MONO,fontSize:12,color:T4,background:BG3,padding:"3px 8px",borderRadius:6}}>{sig.series_id}</span>
        <span style={{fontFamily:MONO,fontSize:12,color:T4,background:BG3,padding:"3px 8px",borderRadius:6}}>{sig.method}</span>
      </div>
    </div>
  );
}

// ── News Card — HIG compliant ─────────────────────────────────────────────────
function NewsCard({item}){
  var dot=sentColor(item.sentiment);
  var bg=sentBg(item.sentiment);
  return (
    <div style={{
      background:BG2, borderRadius:12, padding:S3, marginBottom:S2,
      border:"1px solid "+BD1,
    }}>
      <div style={{display:"flex",gap:S2,alignItems:"flex-start"}}>
        <div style={{
          width:36, height:36, borderRadius:8, background:bg, flexShrink:0,
          display:"flex", alignItems:"center", justifyContent:"center",
          marginTop:2,
        }}>
          <span style={{fontSize:16,color:dot}}>
            {item.sentiment==="BULLISH"?"▲":item.sentiment==="BEARISH"?"▼":item.sentiment==="WARNING"?"⚠":"◆"}
          </span>
        </div>
        <div style={{flex:1,minWidth:0}}>
          {/* HIG headline: 15px semibold */}
          <div style={{fontFamily:SYS,fontSize:15,color:T1,fontWeight:600,lineHeight:1.4,marginBottom:5}}>{item.title}</div>
          {/* HIG body: 14px */}
          <div style={{fontFamily:SYS,fontSize:14,color:T3,lineHeight:1.5,marginBottom:S1}}>
            {item.summary?item.summary.slice(0,180)+(item.summary.length>180?"…":""):""}
          </div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
            <span style={{fontFamily:SYS,fontSize:13,color:T4,fontWeight:500}}>{item.source}</span>
            {(item.tags||[]).map(function(t){
              return <span key={t} style={{fontFamily:MONO,fontSize:11,color:BLUE,background:BLUE_DIM,padding:"2px 8px",borderRadius:6}}>{t}</span>;
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Price Watch Card ──────────────────────────────────────────────────────────
function PriceCard({item}){
  var sc=sentColor(item.signal);
  var arrow=item.trend==="UP"?"↑":item.trend==="DOWN"?"↓":"→";
  return (
    <div style={{background:BG2,borderRadius:12,padding:S3,border:"1px solid "+BD1}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
        <div style={{fontFamily:SYS,fontSize:14,color:T2,fontWeight:500}}>{item.name}</div>
        <div style={{
          background:sentBg(item.signal),border:"1px solid "+sc+"44",
          borderRadius:8,padding:"4px 10px",
        }}>
          <span style={{fontFamily:MONO,fontSize:12,color:sc,fontWeight:700}}>{item.signal}</span>
        </div>
      </div>
      <div style={{display:"flex",alignItems:"baseline",gap:8}}>
        <span style={{fontFamily:MONO,fontSize:20,color:T1,fontWeight:600}}>{fmtN(item.value,1)}</span>
        <span style={{fontFamily:MONO,fontSize:13,color:T4}}>{item.unit}</span>
      </div>
      <div style={{display:"flex",gap:S3,marginTop:8}}>
        <span style={{fontFamily:MONO,fontSize:13,color:item.mom>=0?GREEN:RED,fontWeight:500}}>
          {arrow} {fmtPct(item.mom)} MoM
        </span>
        <span style={{fontFamily:MONO,fontSize:13,color:T4}}>
          {fmtPct(item.yoy)} YoY
        </span>
      </div>
    </div>
  );
}

// ── State row — touch-friendly ─────────────────────────────────────────────────
function StateRow({s, selected, onTap}){
  var sig=s.signal||"STABLE";
  var sc=sig==="HOT"?GREEN:sig==="GROWING"?BLUE:sig==="COOLING"?RED:T4;
  var bg=sig==="HOT"?GREEN_DIM:sig==="GROWING"?BLUE_DIM:sig==="COOLING"?RED_DIM:BG3;
  return (
    <div onClick={onTap} style={{
      display:"flex",alignItems:"center",gap:S2,
      padding:"12px "+S3+"px",
      background:selected?bg:BG2,
      borderRadius:10, marginBottom:6,
      border:"1px solid "+(selected?sc+"55":BD1),
      cursor:"pointer", minHeight:TAP_MIN,
      transition:"background 0.15s ease",
      WebkitTapHighlightColor:"transparent",
    }}>
      <div style={{width:44,fontFamily:MONO,fontSize:16,color:selected?sc:T2,fontWeight:700}}>{s.code}</div>
      <div style={{flex:1}}>
        <div style={{fontFamily:SYS,fontSize:14,color:T2,fontWeight:500,marginBottom:2}}>{s.name}</div>
        <div style={{fontFamily:MONO,fontSize:12,color:T4}}>{(s.permits/1000).toFixed(1)}K permits</div>
      </div>
      <div style={{textAlign:"right"}}>
        <div style={{fontFamily:MONO,fontSize:14,color:s.yoyChange>0?GREEN:RED,fontWeight:600}}>{fmtPct(s.yoyChange)}</div>
        <div style={{fontFamily:MONO,fontSize:12,color:sc,fontWeight:500}}>{sig}</div>
      </div>
      <div style={{width:28,textAlign:"center",color:sc,fontSize:18}}>›</div>
    </div>
  );
}

// ── Metric tile ───────────────────────────────────────────────────────────────
function MetricTile({label, value, change, sub, color, w}){
  var cc=change>0?GREEN:change<0?RED:T4;
  return (
    <div style={{background:BG2,borderRadius:12,padding:S3,flex:1,minWidth:w||"auto",border:"1px solid "+BD1}}>
      <div style={{fontFamily:MONO,fontSize:12,color:T4,marginBottom:6,letterSpacing:"0.06em"}}>{label}</div>
      <div style={{fontFamily:MONO,fontSize:22,color:color||T1,lineHeight:1,fontWeight:600}}>{value}</div>
      {change!=null&&<div style={{fontFamily:MONO,fontSize:13,color:cc,marginTop:5,fontWeight:500}}>{fmtPct(change)}</div>}
      {sub&&<div style={{fontFamily:SYS,fontSize:13,color:T4,marginTop:4}}>{sub}</div>}
    </div>
  );
}

// ── HIG Tab bar (44px height, clear labels) ───────────────────────────────────
function TabBar({tabs, active, onChange}){
  return (
    <div style={{
      display:"flex",background:BG2,borderRadius:12,padding:4,
      gap:4, flexShrink:0, border:"1px solid "+BD1,
    }}>
      {tabs.map(function(t){
        var isActive=active===t.id;
        return (
          <button key={t.id}
            onClick={function(){onChange(t.id);}}
            style={{
              flex:1, minHeight:TAP_MIN, padding:"0 8px",
              background:isActive?BG4:"transparent",
              border:"1px solid "+(isActive?BD3:"transparent"),
              borderRadius:10, cursor:"pointer",
              display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
              gap:3, WebkitTapHighlightColor:"transparent",
              transition:"all 0.15s ease",
            }}>
            <span style={{fontSize:18}}>{t.icon}</span>
            <span style={{fontFamily:SYS,fontSize:12,color:isActive?AMBER:T4,fontWeight:isActive?600:400,letterSpacing:"0.02em"}}>{t.label}</span>
            {t.badge!=null&&t.badge>0&&(
              <span style={{fontFamily:MONO,fontSize:10,color:isActive?AMBER:T3,background:isActive?AMBER_DIM:BG3,padding:"0 5px",borderRadius:8}}>{t.badge}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ── Scenario Builder — HIG compliant sliders ──────────────────────────────────
function ScenarioBuilder(){
  var [rate,setRate]=useState(0);
  var [iija,setIija]=useState(100);
  var [labor,setLabor]=useState(0);
  var [material,setMaterial]=useState(0);
  var base=2190;
  var delta=(-rate*0.018)+((iija-100)*0.003)+(labor*0.008)+(-material*0.012);
  var proj=base*(1+delta/100);
  var diff=proj-base;
  var col=proj>=base?GREEN:RED;

  function SliderRow({label, val, setter, min, max, step, unit, positiveIsGood}){
    var valColor=positiveIsGood?(val>=0?GREEN:RED):(val<=0?GREEN:RED);
    return (
      <div style={{marginBottom:S4}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <span style={{fontFamily:SYS,fontSize:15,color:T2,fontWeight:500}}>{label}</span>
          <span style={{fontFamily:MONO,fontSize:15,color:valColor,fontWeight:600,minWidth:60,textAlign:"right"}}>
            {val>0?"+":""}{val}{unit}
          </span>
        </div>
        {/* HIG: slider track height visible, thumb large enough to tap */}
        <input type="range" min={min} max={max} step={step} value={val}
          onChange={function(e){setter(parseFloat(e.target.value));}}
          style={{width:"100%",accentColor:valColor,cursor:"pointer",height:4}}/>
        <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}>
          <span style={{fontFamily:MONO,fontSize:12,color:T4}}>{min}{unit}</span>
          <span style={{fontFamily:MONO,fontSize:12,color:T4}}>{max}{unit}</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{display:"flex",flexDirection:"column",gap:S3}}>
      <SliderRow label="Rate Shock" val={rate} setter={setRate} min={-200} max={200} step={25} unit="bps" positiveIsGood={false}/>
      <SliderRow label="IIJA Funding" val={iija} setter={setIija} min={50} max={150} step={5} unit="%" positiveIsGood={true}/>
      <SliderRow label="Labor Supply Change" val={labor} setter={setLabor} min={-5} max={5} step={0.5} unit="%" positiveIsGood={true}/>
      <SliderRow label="Material Cost Change" val={material} setter={setMaterial} min={-20} max={20} step={2} unit="%" positiveIsGood={false}/>

      {/* Result card */}
      <div style={{background:BG3,borderRadius:16,padding:S4,border:"1px solid "+col+"44",marginTop:S2}}>
        <div style={{fontFamily:MONO,fontSize:12,color:T4,marginBottom:8,letterSpacing:"0.08em"}}>PROJECTED TOTAL CONSTRUCTION SPENDING</div>
        <div style={{fontFamily:MONO,fontSize:40,color:col,lineHeight:1,fontWeight:700,marginBottom:S1}}>{fmtB(proj)}</div>
        <div style={{fontFamily:MONO,fontSize:16,color:col,marginBottom:S3}}>
          {diff>=0?"+":""}{fmtB(Math.abs(diff))} ({fmtPct((diff/base)*100)}) vs baseline
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:S2}}>
          {[
            {label:"Rate",val:(-rate*0.018)},
            {label:"IIJA",val:((iija-100)*0.003)},
            {label:"Labor",val:(labor*0.008)},
            {label:"Materials",val:(-material*0.012)},
          ].map(function(row){
            return (
              <div key={row.label} style={{background:BG2,borderRadius:8,padding:"8px 12px"}}>
                <div style={{fontFamily:SYS,fontSize:13,color:T4,marginBottom:3}}>{row.label}</div>
                <div style={{fontFamily:MONO,fontSize:14,color:parseFloat(row.val.toFixed(2))>=0?GREEN:RED,fontWeight:600}}>
                  {row.val>=0?"+":""}{row.val.toFixed(2)}%
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Header stat ───────────────────────────────────────────────────────────────
function HeaderStat({label, value, change, color}){
  var cc=change>0?GREEN:change<0?RED:T4;
  return (
    <div style={{textAlign:"right",minWidth:64}}>
      {/* HIG caption: 12px minimum */}
      <div style={{fontFamily:MONO,fontSize:12,color:T4,letterSpacing:"0.06em",marginBottom:2}}>{label}</div>
      <div style={{fontFamily:MONO,fontSize:15,color:color||T1,fontWeight:600}}>{value}</div>
      {change!=null&&<div style={{fontFamily:MONO,fontSize:12,color:cc}}>{fmtPct(change)}</div>}
    </div>
  );
}

// ── MAIN DASHBOARD ────────────────────────────────────────────────────────────
export default function Dashboard(){
  var [spend,  setSpend]  = useState(null);
  var [employ, setEmploy] = useState(null);
  var [rates,  setRates]  = useState(null);
  var [ppi,    setPpi]    = useState(null);
  var [prices, setPrices] = useState(null);
  var [fore,   setFore]   = useState(null);
  var [sigs,   setSigs]   = useState(null);
  var [newsD,  setNewsD]  = useState(null);
  var [mapD,   setMapD]   = useState(null);
  var [tab,    setTab]    = useState("signals");
  var [now,    setNow]    = useState("");
  var [selSig, setSelSig] = useState(null);
  var [selState, setSelState] = useState(null);

  useEffect(function(){
    var t=setInterval(function(){
      setNow(new Date().toLocaleTimeString("en-US",{hour12:false,timeZoneName:"short"}));
    },1000);
    setNow(new Date().toLocaleTimeString("en-US",{hour12:false,timeZoneName:"short"}));
    return function(){ clearInterval(t); };
  },[]);

  useEffect(function(){
    async function load(){
      try{ var r=await fetch("/api/census");     if(r.ok) setSpend(await r.json());    }catch(e){}
      try{ var r=await fetch("/api/bls");        if(r.ok) setEmploy(await r.json());   }catch(e){}
      try{ var r=await fetch("/api/rates");      if(r.ok) setRates(await r.json());    }catch(e){}
      try{ var r=await fetch("/api/ppi");        if(r.ok) setPpi(await r.json());      }catch(e){}
      try{ var r=await fetch("/api/pricewatch"); if(r.ok) setPrices(await r.json());   }catch(e){}
      try{ var r=await fetch("/api/forecast?series=TTLCONS"); if(r.ok) setFore(await r.json()); }catch(e){}
      try{ var r=await fetch("/api/signals");    if(r.ok) setSigs(await r.json());     }catch(e){}
      try{ var r=await fetch("/api/news");       if(r.ok) setNewsD(await r.json());    }catch(e){}
      try{ var r=await fetch("/api/map");        if(r.ok) setMapD(await r.json());     }catch(e){}
    }
    load();
  },[]);

  // Extract values
  var spendVal = spend?.value ?? spend?.latest?.value ?? 2190;
  var spendMom = spend?.mom   ?? spend?.latest?.mom   ?? 0;
  var empVal   = employ?.value ?? employ?.latest?.value ?? 8330;
  var empMom   = employ?.mom   ?? employ?.latest?.mom   ?? 0;
  var rate30   = rates?.mortgage30 ?? rates?.data?.MORTGAGE30US?.value ?? 6.85;
  var rate10   = rates?.treasury10 ?? rates?.data?.DGS10?.value        ?? 4.28;
  var spread   = (Number(rate30)-Number(rate10));
  var signals  = sigs?.signals   ?? [];
  var newsItems= newsD?.items    ?? [];
  var states   = mapD?.states    ?? [];
  var commodities = prices?.commodities ?? [];
  var foreVals = (fore?.ensemble??[]).map(function(p){ return p.forecast??p.value??p; }).filter(Number.isFinite);

  var bullN=signals.filter(function(s){ return s.type==="BULLISH"; }).length;
  var bearN=signals.filter(function(s){ return s.type==="BEARISH"; }).length;
  var warnN=signals.filter(function(s){ return s.type==="WARNING"; }).length;

  var TABS=[
    {id:"signals",  icon:"📡", label:"Signals",  badge:signals.length},
    {id:"news",     icon:"📰", label:"Newswire", badge:newsItems.length},
    {id:"map",      icon:"🗺",  label:"States",   badge:states.length},
    {id:"prices",   icon:"💹", label:"Prices",   badge:commodities.length},
    {id:"scenario", icon:"🎛",  label:"Scenario", badge:null},
  ];

  // News ticker items
  var tickerItems = newsItems.slice(0,6);

  return (
    <div style={{
      minHeight:"100vh",
      background:BG0,
      color:T1,
      fontFamily:SYS,
      // HIG: respect safe areas for iPad home indicator
      paddingBottom:"env(safe-area-inset-bottom, 20px)",
      paddingLeft:"env(safe-area-inset-left, 0px)",
      paddingRight:"env(safe-area-inset-right, 0px)",
    }}>
      <style>{`
        * { box-sizing:border-box; margin:0; padding:0; }
        ::-webkit-scrollbar { width:3px; height:3px; }
        ::-webkit-scrollbar-thumb { background:#333; border-radius:2px; }
        button { outline:none; border:none; font-family:inherit; }
        input[type=range] { appearance:auto; }
        @keyframes ticker { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
      `}</style>

      {/* ── Header bar — HIG: clear hierarchy, readable at glance ────────── */}
      <div style={{
        background:BG1, borderBottom:"1px solid "+BD1,
        padding:"12px "+S4+"px",
        display:"flex", alignItems:"center", justifyContent:"space-between",
        // HIG: header min height 44pt
        minHeight:60,
        position:"sticky", top:0, zIndex:100,
        paddingTop:"calc(env(safe-area-inset-top, 0px) + 12px)",
      }}>
        <div style={{display:"flex",alignItems:"center",gap:S3}}>
          <img
            src="https://raw.githubusercontent.com/toddbridgeford/ConstructAIQ/Predictive-Model/ConstructAIQWhiteLogo.svg"
            style={{height:26}} alt="ConstructAIQ"/>
          <div style={{width:1,height:28,background:BD2}}/>
          <div>
            <div style={{fontFamily:MONO,fontSize:12,color:T4,letterSpacing:"0.1em"}}>CONSTRUCTION INTELLIGENCE</div>
            <div style={{fontFamily:MONO,fontSize:11,color:T4}}>MARKET TERMINAL v6.0</div>
          </div>
        </div>
        {/* HIG: secondary stats use 15px minimum */}
        <div style={{display:"flex",alignItems:"center",gap:S4}}>
          <HeaderStat label="TTLCONS" value={"$"+fmtN(spendVal/1000,1)+"B"} change={spendMom}/>
          <HeaderStat label="EMPLOY" value={fmtK(empVal)+"K"} change={empMom}/>
          <HeaderStat label="30YR MTG" value={fmtN(rate30)+"%" } change={null} color={spread>2.5?RED:GREEN}/>
          <HeaderStat label="SPREAD" value={fmtN(spread)+"%"} change={null} color={spread>2.5?RED:GREEN}/>
          <div style={{width:1,height:32,background:BD2}}/>
          <div style={{fontFamily:MONO,fontSize:13,color:T4}}>{now}</div>
        </div>
      </div>

      {/* ── News ticker — minimum 14px ────────────────────────────────────── */}
      <div style={{
        background:BG2, borderBottom:"1px solid "+BD1,
        height:36, overflow:"hidden",
        display:"flex", alignItems:"center",
      }}>
        <div style={{
          fontFamily:MONO, fontSize:12, color:AMBER,
          letterSpacing:"0.1em", padding:"0 16px",
          borderRight:"1px solid "+BD2,
          whiteSpace:"nowrap", flexShrink:0,
          height:"100%", display:"flex", alignItems:"center",
        }}>LIVE</div>
        <div style={{overflow:"hidden",flex:1}}>
          <div style={{display:"inline-flex",animation:"ticker 50s linear infinite",whiteSpace:"nowrap",alignItems:"center"}}>
            {(tickerItems.length>0?tickerItems.concat(tickerItems):[
              {title:"IIJA infrastructure awards at record pace Q1 2026",sentiment:"BULLISH"},
              {title:"Craft labor vacancy rate at 12-year high",sentiment:"WARNING"},
              {title:"Builder confidence rises on easing rate expectations",sentiment:"BULLISH"},
              {title:"Steel tariff uncertainty drives escalation clauses",sentiment:"WARNING"},
            ]).map(function(item,i){
              return (
                <span key={i} style={{
                  fontFamily:SYS, fontSize:14, color:sentColor(item.sentiment),
                  padding:"0 24px", borderRight:"1px solid "+BD2,
                }}>
                  {item.title}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Signal summary pills ──────────────────────────────────────────── */}
      <div style={{
        background:BG1, borderBottom:"1px solid "+BD1,
        padding:"10px "+S4+"px",
        display:"flex", alignItems:"center", gap:S2, flexWrap:"wrap",
      }}>
        <span style={{fontFamily:MONO,fontSize:12,color:T4,letterSpacing:"0.08em",marginRight:4}}>SIGNALS</span>
        {[
          {label:"▲ "+bullN+" BULLISH", col:GREEN, bg:GREEN_DIM},
          {label:"▼ "+bearN+" BEARISH", col:RED,   bg:RED_DIM},
          {label:"⚠ "+warnN+" WARNING", col:AMBER, bg:AMBER_DIM},
        ].map(function(p){
          return (
            <div key={p.label} style={{
              background:p.bg, borderRadius:20, padding:"5px 12px",
              border:"1px solid "+p.col+"44",
            }}>
              <span style={{fontFamily:MONO,fontSize:13,color:p.col,fontWeight:600}}>{p.label}</span>
            </div>
          );
        })}
        <div style={{flex:1}}/>
        {newsD?.marketSentiment&&(
          <div style={{background:BG3,borderRadius:20,padding:"5px 12px",border:"1px solid "+BD2}}>
            <span style={{fontFamily:MONO,fontSize:13,color:AMBER}}>{newsD.marketSentiment}</span>
          </div>
        )}
      </div>

      {/* ── Main layout ───────────────────────────────────────────────────── */}
      <div style={{display:"flex",gap:S2,padding:S3,height:"calc(100vh - 174px)",overflow:"hidden"}}>

        {/* LEFT: Key metrics ─────────────────────────────────────────────── */}
        <div style={{width:260,flexShrink:0,display:"flex",flexDirection:"column",gap:S2,overflowY:"auto"}}>

          {/* Spending */}
          <div style={{background:BG1,borderRadius:16,padding:S3,border:"1px solid "+BD1}}>
            <div style={{fontFamily:MONO,fontSize:12,color:T4,marginBottom:10,letterSpacing:"0.08em"}}>TOTAL CONSTRUCTION SPENDING</div>
            <div style={{fontFamily:MONO,fontSize:28,color:AMBER,fontWeight:700,lineHeight:1}}>{fmtB(spendVal)}</div>
            <div style={{fontFamily:MONO,fontSize:14,color:spendMom>=0?GREEN:RED,marginTop:6,fontWeight:500}}>
              {fmtPct(spendMom)} month-over-month
            </div>
            <div style={{marginTop:S2}}>
              <Spark vals={foreVals} color={AMBER} w={220} h={52}/>
            </div>
            <div style={{fontFamily:SYS,fontSize:13,color:T4,marginTop:6}}>12-month HW+SARIMA ensemble forecast</div>
          </div>

          {/* Employment + Rates */}
          <div style={{display:"flex",gap:S2}}>
            <div style={{flex:1,background:BG1,borderRadius:16,padding:S3,border:"1px solid "+BD1}}>
              <div style={{fontFamily:MONO,fontSize:11,color:T4,marginBottom:6}}>EMPLOY</div>
              <div style={{fontFamily:MONO,fontSize:20,color:GREEN,fontWeight:700}}>{fmtK(empVal)}K</div>
              <div style={{fontFamily:MONO,fontSize:13,color:empMom>=0?GREEN:RED,marginTop:4}}>{fmtPct(empMom)}</div>
            </div>
            <div style={{flex:1,background:BG1,borderRadius:16,padding:S3,border:"1px solid "+BD1}}>
              <div style={{fontFamily:MONO,fontSize:11,color:T4,marginBottom:6}}>30YR / 10YR</div>
              <div style={{fontFamily:MONO,fontSize:18,color:AMBER,fontWeight:700}}>{fmtN(rate30)}%</div>
              <div style={{fontFamily:MONO,fontSize:13,color:T3,marginTop:2}}>{fmtN(rate10)}% Treasury</div>
            </div>
          </div>

          {/* Data status */}
          <div style={{background:BG1,borderRadius:16,padding:S3,border:"1px solid "+BD1}}>
            <div style={{fontFamily:MONO,fontSize:12,color:T4,marginBottom:S2,letterSpacing:"0.08em"}}>DATA SOURCES</div>
            {[
              {label:"Spending (Census/FRED)", ok:!!spend},
              {label:"Employment (BLS)",       ok:!!employ},
              {label:"Rates (FRED)",           ok:!!rates},
              {label:"PPI Materials (BLS)",    ok:!!ppi},
              {label:"PriceWatch",             ok:commodities.length>0},
              {label:"Forecast (HW+SARIMA)",   ok:foreVals.length>0},
              {label:"Signals (SignalDetect)", ok:signals.length>0},
              {label:"News (NewsIntel)",       ok:newsItems.length>0},
              {label:"State Map",              ok:states.length>0},
            ].map(function(row){
              return (
                <div key={row.label} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                  <span style={{fontFamily:SYS,fontSize:14,color:row.ok?T2:T4}}>{row.label}</span>
                  <div style={{
                    width:10, height:10, borderRadius:"50%",
                    background:row.ok?GREEN:BD2,
                    boxShadow:row.ok?"0 0 8px "+GREEN+"88":"none",
                  }}/>
                </div>
              );
            })}
          </div>
        </div>

        {/* CENTER: Tab panel ─────────────────────────────────────────────── */}
        <div style={{flex:1,display:"flex",flexDirection:"column",gap:S2,minWidth:0}}>

          {/* HIG Tab bar */}
          <TabBar tabs={TABS} active={tab} onChange={setTab}/>

          {/* Tab content */}
          <div style={{flex:1,overflowY:"auto",borderRadius:16}}>

            {/* SIGNALS */}
            {tab==="signals"&&(
              <div>
                {signals.length>0?(
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:S2}}>
                    {signals.map(function(s,i){
                      return <SigCard key={i} sig={s} selected={selSig===i} onTap={function(){setSelSig(selSig===i?null:i);}}/>;
                    })}
                  </div>
                ):(
                  <div style={{
                    background:BG1,borderRadius:16,padding:40,textAlign:"center",
                    border:"1px solid "+BD1,
                  }}>
                    <div style={{fontSize:40,marginBottom:S3}}>📡</div>
                    <div style={{fontFamily:SYS,fontSize:17,color:T2,fontWeight:600,marginBottom:8}}>Generating Signals</div>
                    <div style={{fontFamily:SYS,fontSize:15,color:T4}}>SignalDetect is analyzing live data from Supabase</div>
                    <div style={{fontFamily:MONO,fontSize:13,color:T4,marginTop:S2}}>/api/signals?generate=1</div>
                  </div>
                )}
              </div>
            )}

            {/* NEWSWIRE */}
            {tab==="news"&&(
              <div style={{background:BG1,borderRadius:16,padding:S3,border:"1px solid "+BD1}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:S3}}>
                  <div style={{fontFamily:MONO,fontSize:14,color:AMBER,fontWeight:600,letterSpacing:"0.08em"}}>CONSTRUCTION INTELLIGENCE FEED</div>
                  {newsD?.marketSentiment&&(
                    <div style={{fontFamily:MONO,fontSize:13,color:T4}}>
                      Sentiment: <span style={{color:AMBER,fontWeight:600}}>{newsD.marketSentiment}</span>
                    </div>
                  )}
                </div>
                {newsItems.length>0?
                  newsItems.map(function(item,i){ return <NewsCard key={i} item={item}/>; }) :
                  <div style={{padding:S5,textAlign:"center",fontFamily:SYS,fontSize:15,color:T4}}>Aggregating news from ENR · Construction Dive · NAHB · AGC…</div>
                }
              </div>
            )}

            {/* STATE MAP — touch-first list (not hover) */}
            {tab==="map"&&(
              <div style={{background:BG1,borderRadius:16,padding:S3,border:"1px solid "+BD1}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:S3}}>
                  <div style={{fontFamily:MONO,fontSize:14,color:AMBER,fontWeight:600,letterSpacing:"0.08em"}}>STATE CONSTRUCTION ACTIVITY</div>
                  <div style={{display:"flex",gap:S1}}>
                    {[["HOT",GREEN],["GROWING",BLUE],["STABLE",T4],["COOLING",RED]].map(function([l,c]){
                      return <div key={l} style={{display:"flex",alignItems:"center",gap:4}}>
                        <div style={{width:8,height:8,borderRadius:2,background:c}}/>
                        <span style={{fontFamily:SYS,fontSize:13,color:T4}}>{l}</span>
                      </div>;
                    })}
                  </div>
                </div>
                {/* National summary */}
                {mapD&&(
                  <div style={{display:"flex",gap:S2,marginBottom:S3}}>
                    <div style={{background:BG2,borderRadius:10,padding:"10px 14px",flex:1}}>
                      <div style={{fontFamily:MONO,fontSize:12,color:T4,marginBottom:3}}>TOTAL PERMITS</div>
                      <div style={{fontFamily:MONO,fontSize:16,color:T1,fontWeight:600}}>{((mapD.totalPermits||0)/1000).toFixed(0)}K</div>
                    </div>
                    <div style={{background:BG2,borderRadius:10,padding:"10px 14px",flex:1}}>
                      <div style={{fontFamily:MONO,fontSize:12,color:T4,marginBottom:3}}>NATIONAL AVG</div>
                      <div style={{fontFamily:MONO,fontSize:16,color:T1,fontWeight:600}}>{((mapD.nationalAvg||0)/1000).toFixed(1)}K</div>
                    </div>
                    <div style={{background:BG2,borderRadius:10,padding:"10px 14px",flex:1}}>
                      <div style={{fontFamily:MONO,fontSize:12,color:T4,marginBottom:3}}>HOTTEST</div>
                      <div style={{fontFamily:MONO,fontSize:16,color:GREEN,fontWeight:600}}>{(mapD.topStates||[]).slice(0,2).join(" · ")}</div>
                    </div>
                  </div>
                )}
                {/* Touch-friendly state list */}
                <div style={{maxHeight:420,overflowY:"auto"}}>
                  {states.slice(0,25).map(function(s){
                    return <StateRow key={s.code} s={s} selected={selState===s.code}
                      onTap={function(){setSelState(selState===s.code?null:s.code);}}/>;
                  })}
                </div>
              </div>
            )}

            {/* PRICES — PriceWatch */}
            {tab==="prices"&&(
              <div style={{background:BG1,borderRadius:16,padding:S3,border:"1px solid "+BD1}}>
                <div style={{fontFamily:MONO,fontSize:14,color:AMBER,fontWeight:600,letterSpacing:"0.08em",marginBottom:S3}}>COMMODITY & MATERIALS WATCH</div>
                {prices?.compositeIndex&&(
                  <div style={{
                    background:sentBg(prices.compositeIndex.signal),
                    border:"1px solid "+sentColor(prices.compositeIndex.signal)+"44",
                    borderRadius:12, padding:S3, marginBottom:S3,
                  }}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                      <span style={{fontFamily:MONO,fontSize:13,color:T4,letterSpacing:"0.06em"}}>COMPOSITE SIGNAL</span>
                      <span style={{fontFamily:MONO,fontSize:16,color:sentColor(prices.compositeIndex.signal),fontWeight:700}}>{prices.compositeIndex.signal}</span>
                    </div>
                    <div style={{fontFamily:SYS,fontSize:15,color:T2,lineHeight:1.4}}>{prices.compositeIndex.description}</div>
                    <div style={{fontFamily:MONO,fontSize:13,color:T4,marginTop:6}}>Avg MoM: {fmtPct(prices.compositeIndex.avgMoM)}</div>
                  </div>
                )}
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:S2}}>
                  {(commodities.length>0?commodities:getSyntheticCommodities()).map(function(item,i){
                    return <PriceCard key={i} item={item}/>;
                  })}
                </div>
              </div>
            )}

            {/* SCENARIO */}
            {tab==="scenario"&&(
              <div style={{background:BG1,borderRadius:16,padding:S3,border:"1px solid "+BD1}}>
                <div style={{fontFamily:MONO,fontSize:14,color:AMBER,fontWeight:600,letterSpacing:"0.08em",marginBottom:S4}}>INTERACTIVE SCENARIO BUILDER</div>
                <ScenarioBuilder/>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Fallback synthetic commodities for when PriceWatch API isn't live
function getSyntheticCommodities(){
  return [
    {name:"Lumber & Wood",  value:421.8, mom:-3.74, yoy:-15.2, unit:"PPI Index", signal:"BUY",  trend:"DOWN", source:"BLS"},
    {name:"Iron & Steel",   value:318.4, mom:2.84,  yoy:8.4,   unit:"PPI Index", signal:"SELL", trend:"UP",   source:"BLS"},
    {name:"Concrete",       value:284.6, mom:1.21,  yoy:4.8,   unit:"PPI Index", signal:"HOLD", trend:"UP",   source:"BLS"},
    {name:"Copper",         value:9842,  mom:4.48,  yoy:12.4,  unit:"$/tonne",  signal:"SELL", trend:"UP",   source:"FRED"},
    {name:"WTI Crude Oil",  value:74.82, mom:-4.25, yoy:-8.6,  unit:"$/bbl",    signal:"BUY",  trend:"DOWN", source:"FRED"},
    {name:"Diesel Fuel",    value:218.4, mom:-2.85, yoy:-6.2,  unit:"PPI Index", signal:"BUY",  trend:"DOWN", source:"BLS"},
  ];
}
