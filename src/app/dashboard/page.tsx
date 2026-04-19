// @ts-nocheck
"use client";
import { useState, useEffect, useRef } from "react";

// ── Design tokens ─────────────────────────────────────────────────────────────
var BG0="#000000",BG1="#090909",BG2="#111111",BG3="#1a1a1a";
var BD1="#1c1c1c",BD2="#262626",BD3="#333333";
var AMBER="#f5a623",AMBER2="#7a5010",AMBER3="#2a1a04";
var GREEN="#00d97e",GREEN2="#004d2a",GREEN3="#001a0d";
var RED="#ff4757",RED2="#5c1a1a",RED3="#1a0000";
var BLUE="#339af0",BLUE2="#1a3a5c",BLUE3="#001020";
var L1="#ffffff",L2="#cccccc",L3="#888888",L4="#444444",L5="#222222";
var FM="'SF Mono','Fira Code','Consolas',monospace";
var FS="'Inter','Helvetica Neue',sans-serif";

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtB(v){ return v>=1000?"$"+(v/1000).toFixed(1)+"B":"$"+v.toFixed(0)+"M"; }
function fmtN(v,d=2){ return v!=null?Number(v).toFixed(d):"—"; }
function fmtPct(v){ if(v==null) return "—"; return (v>0?"+":"")+Number(v).toFixed(2)+"%"; }
function fmtK(v){ return v>=1000?(v/1000).toFixed(1)+"K":String(v); }
function sentColor(s){ return s==="BULLISH"?GREEN:s==="BEARISH"?RED:s==="WARNING"?AMBER:BLUE; }
function sentBg(s){ return s==="BULLISH"?GREEN3:s==="BEARISH"?RED3:s==="WARNING"?AMBER3:BLUE3; }
function sentBorder(s){ return s==="BULLISH"?GREEN2:s==="BEARISH"?RED2:s==="WARNING"?AMBER2:BLUE2; }

// ── Sparkline ─────────────────────────────────────────────────────────────────
function Spark({vals, color, w=120, h=36}){
  if(!vals||vals.length<2) return null;
  var mn=Math.min(...vals),mx=Math.max(...vals),rng=mx-mn||1;
  var pts=vals.map(function(v,i){ return [(i/(vals.length-1))*w, h-2-(((v-mn)/rng)*(h-6))]; });
  var d="M"+pts.map(function(p){ return p[0].toFixed(1)+","+p[1].toFixed(1); }).join("L");
  var last=pts[pts.length-1];
  return (
    <svg width={w} height={h} style={{display:"block",overflow:"visible"}}>
      <path d={d} fill="none" stroke={color||AMBER} strokeWidth={1.5} strokeLinejoin="round"/>
      <circle cx={last[0]} cy={last[1]} r={2.5} fill={color||AMBER}/>
    </svg>
  );
}

// ── Signal card ───────────────────────────────────────────────────────────────
function SigCard({s}){
  var icons={BULLISH:"▲ BULLISH",BEARISH:"▼ BEARISH",WARNING:"⚠ WARNING",NEUTRAL:"◆ NEUTRAL"};
  var sc=sentColor(s.type),sb=sentBg(s.type),sr=sentBorder(s.type);
  return (
    <div style={{background:sb,border:"1px solid "+sr,borderRadius:4,padding:"10px 12px",marginBottom:8}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
        <span style={{fontFamily:FM,fontSize:9,color:sc,letterSpacing:"0.1em",fontWeight:700}}>{icons[s.type]||s.type}</span>
        <span style={{fontFamily:FM,fontSize:9,color:L4}}>{s.confidence||0}%</span>
      </div>
      <div style={{fontFamily:FS,fontSize:12,color:L1,fontWeight:600,lineHeight:1.35,marginBottom:5}}>{s.title}</div>
      <div style={{fontFamily:FS,fontSize:10,color:L3,lineHeight:1.5}}>{s.description}</div>
      <div style={{marginTop:7,display:"flex",gap:10}}>
        <span style={{fontFamily:FM,fontSize:8,color:L4,background:BG2,padding:"2px 6px",borderRadius:2}}>{s.series_id}</span>
        <span style={{fontFamily:FM,fontSize:8,color:L4,background:BG2,padding:"2px 6px",borderRadius:2}}>{s.method}</span>
      </div>
    </div>
  );
}

// ── News item ─────────────────────────────────────────────────────────────────
function NewsItem({item}){
  var dot=sentColor(item.sentiment);
  return (
    <div style={{padding:"10px 0",borderBottom:"1px solid "+BD1,display:"flex",gap:10,alignItems:"flex-start"}}>
      <div style={{width:6,height:6,borderRadius:"50%",background:dot,marginTop:4,flexShrink:0}}/>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontFamily:FS,fontSize:11,color:L2,fontWeight:500,lineHeight:1.4,marginBottom:3}}>{item.title}</div>
        <div style={{fontFamily:FS,fontSize:10,color:L4,lineHeight:1.4}}>{item.summary?item.summary.slice(0,160)+(item.summary.length>160?"…":""):""}</div>
        <div style={{marginTop:5,display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
          <span style={{fontFamily:FM,fontSize:8,color:L4}}>{item.source}</span>
          <span style={{fontFamily:FM,fontSize:8,color:dot,background:sentBg(item.sentiment),padding:"1px 6px",borderRadius:2}}>{item.sentiment}</span>
          {(item.tags||[]).map(function(t){ return <span key={t} style={{fontFamily:FM,fontSize:8,color:L4,background:BG2,padding:"1px 5px",borderRadius:2}}>{t}</span>; })}
        </div>
      </div>
    </div>
  );
}

// ── State heat grid ───────────────────────────────────────────────────────────
function StateGrid({states}){
  var [hov,setHov]=useState(null);
  var map={};
  (states||[]).forEach(function(s){ map[s.code]=s; });
  // Grid layout col,row for each state code
  var pos={
    WA:[0,0],OR:[0,1],CA:[0,2],NV:[1,2],ID:[1,1],MT:[2,0],WY:[2,1],UT:[2,2],CO:[2,3],AZ:[2,4],NM:[2,5],
    ND:[3,0],SD:[3,1],NE:[3,2],KS:[3,3],OK:[3,4],TX:[3,5],
    MN:[4,0],IA:[4,1],MO:[4,2],AR:[4,3],LA:[4,4],
    WI:[5,0],IL:[5,1],TN:[5,2],MS:[5,3],
    MI:[6,0],IN:[6,1],KY:[6,2],AL:[6,3],
    OH:[7,0],WV:[7,1],GA:[7,2],FL:[7,3],
    PA:[8,0],VA:[8,1],SC:[8,2],
    NY:[9,0],MD:[9,1],NC:[9,2],
    VT:[10,0],DE:[10,1],
    MA:[10,2],NJ:[10,3],
    CT:[11,2],RI:[11,3],
    ME:[11,0],NH:[11,1],
    AK:[0,5],HI:[1,5],
  };
  var CW=34,CH=24;
  var hovSt=hov?map[hov]:null;
  return (
    <div>
      <div style={{position:"relative",overflowX:"auto"}}>
        <svg width={12*CW+8} height={7*CH+8}>
          {Object.entries(pos).map(function([code,[col,row]]){
            var s=map[code];
            var sig=s?s.signal:"STABLE";
            var intensity=s?s.intensity:0.2;
            var bc=sig==="HOT"?GREEN:sig==="GROWING"?BLUE:sig==="COOLING"?RED:BD2;
            var bg=sig==="HOT"?GREEN3:sig==="GROWING"?BLUE3:sig==="COOLING"?RED3:BG2;
            var x=col*CW+4,y=row*CH+4;
            var isH=hov===code;
            return (
              <g key={code} style={{cursor:"pointer"}} onMouseEnter={function(){setHov(code);}} onMouseLeave={function(){setHov(null);}}>
                <rect x={x} y={y} width={CW-2} height={CH-2} rx={2}
                  fill={isH?bc+"44":bg}
                  stroke={isH?bc:bc+"55"}
                  strokeWidth={isH?1.5:0.5}
                  opacity={0.35+intensity*0.65}/>
                <text x={x+(CW-2)/2} y={y+(CH-2)/2+3.5} textAnchor="middle"
                  fontFamily={FM} fontSize={8} fill={isH?L1:L4} fontWeight={isH?"700":"400"}>
                  {code}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      {hovSt && (
        <div style={{marginTop:8,background:BG2,border:"1px solid "+BD2,borderRadius:4,padding:"8px 12px",display:"flex",gap:20}}>
          <span style={{fontFamily:FM,fontSize:10,color:AMBER}}>{hovSt.name}</span>
          <span style={{fontFamily:FM,fontSize:9,color:L3}}>Permits: <b style={{color:L1}}>{(hovSt.permits/1000).toFixed(1)}K</b></span>
          <span style={{fontFamily:FM,fontSize:9,color:hovSt.yoyChange>0?GREEN:RED}}>YoY: {fmtPct(hovSt.yoyChange)}</span>
          <span style={{fontFamily:FM,fontSize:9,color:L3}}>GDP Const: <b style={{color:L2}}>${hovSt.gdpConst}M</b></span>
          <span style={{fontFamily:FM,fontSize:9,color:hovSt.signal==="HOT"?GREEN:hovSt.signal==="COOLING"?RED:BLUE}}>{hovSt.signal}</span>
        </div>
      )}
    </div>
  );
}

// ── Stat box ──────────────────────────────────────────────────────────────────
function StatBox({label,value,sub,color}){
  return (
    <div style={{background:BG2,border:"1px solid "+BD1,borderRadius:4,padding:"10px 12px"}}>
      <div style={{fontFamily:FM,fontSize:8,color:L4,marginBottom:4,letterSpacing:"0.08em"}}>{label}</div>
      <div style={{fontFamily:FM,fontSize:18,color:color||L1,lineHeight:1}}>{value}</div>
      {sub&&<div style={{fontFamily:FM,fontSize:9,color:L3,marginTop:4}}>{sub}</div>}
    </div>
  );
}

// ── Panel wrapper ─────────────────────────────────────────────────────────────
function Panel({title,badge,children,style}){
  return (
    <div style={{background:BG1,border:"1px solid "+BD1,borderRadius:4,...style}}>
      <div style={{padding:"8px 12px",borderBottom:"1px solid "+BD1,display:"flex",alignItems:"center",gap:8}}>
        <span style={{fontFamily:FM,fontSize:9,color:AMBER,letterSpacing:"0.12em"}}>{title}</span>
        {badge&&<span style={{fontFamily:FM,fontSize:8,color:L4,background:BG3,padding:"1px 7px",borderRadius:10}}>{badge}</span>}
      </div>
      <div style={{padding:12}}>{children}</div>
    </div>
  );
}

// ── Scenario Builder ──────────────────────────────────────────────────────────
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
  return (
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        {[
          {label:"Rate Shock",val:rate,set:setRate,min:-200,max:200,step:25,unit:"bps",col:rate>0?RED:GREEN},
          {label:"IIJA Funding",val:iija,set:setIija,min:50,max:150,step:5,unit:"%",col:iija>=100?GREEN:AMBER},
          {label:"Labor Supply Δ",val:labor,set:setLabor,min:-5,max:5,step:0.5,unit:"%",col:labor>=0?GREEN:RED},
          {label:"Material Cost Δ",val:material,set:setMaterial,min:-20,max:20,step:2,unit:"%",col:material<=0?GREEN:RED},
        ].map(function(sl){
          return (
            <div key={sl.label}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                <span style={{fontFamily:FM,fontSize:9,color:L3}}>{sl.label}</span>
                <span style={{fontFamily:FM,fontSize:10,color:sl.col}}>{sl.val>0?"+":""}{sl.val}{sl.unit}</span>
              </div>
              <input type="range" min={sl.min} max={sl.max} step={sl.step} value={sl.val}
                onChange={function(e){sl.set(parseFloat(e.target.value));}}
                style={{width:"100%",accentColor:sl.col,cursor:"pointer"}}/>
            </div>
          );
        })}
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        <div style={{background:BG0,border:"1px solid "+BD2,borderRadius:4,padding:16,flex:1}}>
          <div style={{fontFamily:FM,fontSize:8,color:L4,marginBottom:8,letterSpacing:"0.1em"}}>PROJECTED TTLCONS</div>
          <div style={{fontFamily:FM,fontSize:32,color:col,lineHeight:1}}>{fmtB(proj)}</div>
          <div style={{fontFamily:FM,fontSize:12,color:col,marginTop:6}}>{diff>=0?"+":""}{fmtB(diff)} vs baseline</div>
          <div style={{fontFamily:FM,fontSize:10,color:L4,marginTop:4}}>{fmtPct((diff/base)*100)} change</div>
        </div>
        <div style={{background:BG2,border:"1px solid "+BD1,borderRadius:4,padding:"10px 12px"}}>
          <div style={{fontFamily:FM,fontSize:8,color:L4,marginBottom:6}}>SENSITIVITY</div>
          {[
            {label:"Rate impact",val:(-rate*0.018).toFixed(2)},
            {label:"IIJA impact",val:((iija-100)*0.003).toFixed(2)},
            {label:"Labor impact",val:(labor*0.008).toFixed(2)},
            {label:"Materials impact",val:(-material*0.012).toFixed(2)},
          ].map(function(row){
            return (
              <div key={row.label} style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                <span style={{fontFamily:FM,fontSize:8,color:L4}}>{row.label}</span>
                <span style={{fontFamily:FM,fontSize:8,color:parseFloat(row.val)>=0?GREEN:RED}}>{parseFloat(row.val)>0?"+":""}{row.val}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Ticker strip ──────────────────────────────────────────────────────────────
function TickerItem({label,value,change,sigColor}){
  var cc=change>0?GREEN:change<0?RED:L4;
  return (
    <span style={{display:"inline-flex",alignItems:"center",gap:6,padding:"0 20px",borderRight:"1px solid "+BD1}}>
      <span style={{fontFamily:FM,fontSize:9,color:L4}}>{label}</span>
      <span style={{fontFamily:FM,fontSize:10,color:sigColor||L1}}>{value}</span>
      {change!=null&&<span style={{fontFamily:FM,fontSize:9,color:cc}}>{fmtPct(change)}</span>}
    </span>
  );
}

// ── MAIN DASHBOARD ────────────────────────────────────────────────────────────
export default function Dashboard(){
  var [spend,setSpend]=useState(null);
  var [employ,setEmploy]=useState(null);
  var [rates,setRates]=useState(null);
  var [ppi,setPpi]=useState(null);
  var [fore,setFore]=useState(null);
  var [sigs,setSigs]=useState(null);
  var [newsD,setNewsD]=useState(null);
  var [mapD,setMapD]=useState(null);
  var [tab,setTab]=useState("signals");
  var [now,setNow]=useState("");

  useEffect(function(){
    function tick(){ setNow(new Date().toUTCString().replace("GMT","UTC")); }
    tick();
    var t=setInterval(tick,1000);
    return function(){ clearInterval(t); };
  },[]);

  useEffect(function(){
    async function go(){
      try{ var r=await fetch("/api/census");    if(r.ok) setSpend(await r.json());  }catch(e){}
      try{ var r=await fetch("/api/bls");       if(r.ok) setEmploy(await r.json()); }catch(e){}
      try{ var r=await fetch("/api/rates");     if(r.ok) setRates(await r.json());  }catch(e){}
      try{ var r=await fetch("/api/ppi");       if(r.ok) setPpi(await r.json());    }catch(e){}
      try{ var r=await fetch("/api/forecast?series=TTLCONS"); if(r.ok) setFore(await r.json()); }catch(e){}
      try{ var r=await fetch("/api/signals");   if(r.ok) setSigs(await r.json());   }catch(e){}
      try{ var r=await fetch("/api/news");      if(r.ok) setNewsD(await r.json());  }catch(e){}
      try{ var r=await fetch("/api/map");       if(r.ok) setMapD(await r.json());   }catch(e){}
    }
    go();
  },[]);

  // ── Extract values ──────────────────────────────────────────────────────────
  var spendVal = spend?.value ?? spend?.latest?.value ?? 2190;
  var spendMom = spend?.mom ?? spend?.latest?.mom ?? 0;
  var empVal   = employ?.value ?? employ?.latest?.value ?? 8330;
  var empMom   = employ?.mom ?? employ?.latest?.mom ?? 0;
  var rate30   = rates?.mortgage30 ?? rates?.data?.MORTGAGE30US?.value ?? 6.85;
  var rate10   = rates?.treasury10 ?? rates?.data?.DGS10?.value ?? 4.28;
  var spread   = Number(rate30)-Number(rate10);
  var lumber   = ppi?.materials?.lumber ?? ppi?.lumber ?? null;
  var steel    = ppi?.materials?.steel ?? ppi?.steel ?? null;
  var signals  = sigs?.signals ?? [];
  var newsItems= newsD?.items ?? [];
  var states   = mapD?.states ?? [];
  var foreVals = (fore?.ensemble??[]).map(function(p){ return p.forecast??p.value??p; }).filter(Number.isFinite);

  // ── Signal counts ───────────────────────────────────────────────────────────
  var bullN=signals.filter(function(s){ return s.type==="BULLISH"; }).length;
  var bearN=signals.filter(function(s){ return s.type==="BEARISH"; }).length;
  var warnN=signals.filter(function(s){ return s.type==="WARNING"; }).length;

  var TABS=["signals","news","map","scenario"];
  var tabLabels={"signals":"SIGNALS","news":"NEWSWIRE","map":"STATE MAP","scenario":"SCENARIO"};

  return (
    <div style={{minHeight:"100vh",background:BG0,color:L1,fontFamily:FS,overflow:"hidden"}}>

      {/* ── CSS ─────────────────────────────────────────────────────────────── */}
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:3px;height:3px;background:transparent;}
        ::-webkit-scrollbar-thumb{background:#1c1c1c;border-radius:2px;}
        button{outline:none;border:none;cursor:pointer;}
        input[type=range]{height:3px;border-radius:2px;}
        @keyframes scroll{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
      `}</style>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div style={{background:BG1,borderBottom:"1px solid "+BD1,height:46,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 16px",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:16}}>
          <img src="https://raw.githubusercontent.com/toddbridgeford/ConstructAIQ/Predictive-Model/ConstructAIQWhiteLogo.svg" style={{height:22}} alt="ConstructAIQ"/>
          <div style={{width:1,height:22,background:BD2}}/>
          <span style={{fontFamily:FM,fontSize:8,color:L4,letterSpacing:"0.14em"}}>BLOOMBERG TERMINAL  ·  v5.0  ·  CONSTRUCTION INTELLIGENCE PLATFORM</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:20}}>
          <div style={{display:"flex",gap:16}}>
            <HeaderStat label="TTLCONS" value={"$"+fmtN(spendVal/1000,1)+"B"} change={spendMom} />
            <HeaderStat label="EMPLOY"  value={fmtK(empVal)+"K"}              change={empMom}   />
            <HeaderStat label="30YR"    value={fmtN(rate30)+"%"}               change={null} color={spread>2.5?RED:GREEN}/>
            <HeaderStat label="10YR"    value={fmtN(rate10)+"%"}               change={null} color={BLUE}/>
            <HeaderStat label="SPREAD"  value={fmtN(spread)+"%"}               change={null} color={spread>2.5?RED:GREEN}/>
          </div>
          <div style={{width:1,height:22,background:BD2}}/>
          <span style={{fontFamily:FM,fontSize:9,color:L4}}>{now}</span>
        </div>
      </div>

      {/* ── News ticker ─────────────────────────────────────────────────────── */}
      <div style={{background:BG2,borderBottom:"1px solid "+BD1,height:28,overflow:"hidden",display:"flex",alignItems:"center",flexShrink:0}}>
        <div style={{fontFamily:FM,fontSize:8,color:AMBER,letterSpacing:"0.12em",padding:"0 12px",borderRight:"1px solid "+BD2,whiteSpace:"nowrap",flexShrink:0}}>NEWSWIRE</div>
        <div style={{overflow:"hidden",flex:1}}>
          <div style={{display:"inline-flex",animation:"scroll 50s linear infinite",whiteSpace:"nowrap"}}>
            {(newsItems.length>0?newsItems:
              [{title:"IIJA infrastructure awards at record pace Q1 2026",sentiment:"BULLISH"},
               {title:"Craft labor vacancies 12-year high — specialty trades tightest since 2014",sentiment:"WARNING"},
               {title:"Builder confidence +4 pts on easing rate expectations",sentiment:"BULLISH"},
               {title:"Steel tariff uncertainty driving material escalation clauses",sentiment:"WARNING"},
               {title:"Data center construction boom offsets multifamily softness",sentiment:"BULLISH"},
              ]).concat(newsItems.length>0?newsItems:[]).map(function(item,i){
              var c=sentColor(item.sentiment);
              return <span key={i} style={{fontFamily:FM,fontSize:9,color:c,padding:"0 28px",borderRight:"1px solid "+BD1}}>{item.title}</span>;
            })}
          </div>
        </div>
      </div>

      {/* ── Signal summary bar ───────────────────────────────────────────────── */}
      <div style={{background:BG1,borderBottom:"1px solid "+BD1,height:32,display:"flex",alignItems:"center",padding:"0 16px",gap:24,flexShrink:0}}>
        <span style={{fontFamily:FM,fontSize:8,color:L4,letterSpacing:"0.1em"}}>SIGNAL SUMMARY</span>
        <span style={{fontFamily:FM,fontSize:9,color:GREEN}}>▲ {bullN} BULLISH</span>
        <span style={{fontFamily:FM,fontSize:9,color:RED}}>▼ {bearN} BEARISH</span>
        <span style={{fontFamily:FM,fontSize:9,color:AMBER}}>⚠ {warnN} WARNING</span>
        <div style={{flex:1}}/>
        {newsD?.marketSentiment&&<span style={{fontFamily:FM,fontSize:8,color:L4}}>MARKET: <span style={{color:AMBER}}>{newsD.marketSentiment}</span></span>}
        {mapD?.topStates&&<span style={{fontFamily:FM,fontSize:8,color:L4}}>HOTTEST: <span style={{color:GREEN}}>{mapD.topStates.slice(0,3).join(" · ")}</span></span>}
      </div>

      {/* ── Main layout ─────────────────────────────────────────────────────── */}
      <div style={{display:"flex",gap:8,padding:8,height:"calc(100vh - 134px)",overflow:"hidden"}}>

        {/* LEFT COLUMN: Key data ─────────────────────────────────────────── */}
        <div style={{width:240,flexShrink:0,display:"flex",flexDirection:"column",gap:8,overflowY:"auto"}}>

          {/* Spending */}
          <Panel title="TOTAL CONSTRUCTION SPENDING">
            <div style={{fontFamily:FM,fontSize:24,color:AMBER,lineHeight:1}}>{fmtB(spendVal)}</div>
            <div style={{fontFamily:FM,fontSize:9,color:spendMom>=0?GREEN:RED,marginTop:4}}>{fmtPct(spendMom)} MoM</div>
            <div style={{marginTop:10}}><Spark vals={foreVals} color={AMBER} w={200} h={42}/></div>
            <div style={{fontFamily:FM,fontSize:8,color:L4,marginTop:4}}>12-MO ENSEMBLE FORECAST</div>
          </Panel>

          {/* Employment */}
          <Panel title="CONSTRUCTION EMPLOYMENT">
            <div style={{fontFamily:FM,fontSize:24,color:GREEN,lineHeight:1}}>{fmtK(empVal)}K</div>
            <div style={{fontFamily:FM,fontSize:9,color:empMom>=0?GREEN:RED,marginTop:4}}>{fmtPct(empMom)} MoM</div>
          </Panel>

          {/* Rates */}
          <Panel title="RATES WATCH">
            <div style={{display:"flex",gap:10,marginBottom:10}}>
              <div>
                <div style={{fontFamily:FM,fontSize:8,color:L4,marginBottom:2}}>30YR MORTGAGE</div>
                <div style={{fontFamily:FM,fontSize:18,color:AMBER}}>{fmtN(rate30)}%</div>
              </div>
              <div>
                <div style={{fontFamily:FM,fontSize:8,color:L4,marginBottom:2}}>10YR TREASURY</div>
                <div style={{fontFamily:FM,fontSize:18,color:BLUE}}>{fmtN(rate10)}%</div>
              </div>
            </div>
            <div style={{background:BG0,borderRadius:3,padding:"6px 8px",display:"flex",justifyContent:"space-between"}}>
              <span style={{fontFamily:FM,fontSize:8,color:L4}}>SPREAD</span>
              <span style={{fontFamily:FM,fontSize:9,color:spread>2.5?RED:GREEN}}>{fmtN(spread)}%</span>
            </div>
          </Panel>

          {/* Materials */}
          <Panel title="MATERIALS WATCH">
            {ppi?.materials ? Object.entries(ppi.materials).map(function([k,m]){
              var sig=m.signal||"HOLD";
              var sc=sig==="BUY"?GREEN:sig==="SELL"?RED:AMBER;
              return (
                <div key={k} style={{marginBottom:8,paddingBottom:8,borderBottom:"1px solid "+BD1}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
                    <span style={{fontFamily:FM,fontSize:9,color:L3}}>{k.toUpperCase()}</span>
                    <span style={{fontFamily:FM,fontSize:8,color:sc,background:sentBg(sig==="BUY"?"BULLISH":sig==="SELL"?"BEARISH":"WARNING"),padding:"1px 6px",borderRadius:2}}>{sig}</span>
                  </div>
                  <div style={{fontFamily:FM,fontSize:13,color:L1}}>{fmtN(m.value,1)}</div>
                  <div style={{fontFamily:FM,fontSize:8,color:m.mom>=0?GREEN:RED}}>{fmtPct(m.mom)} MoM</div>
                </div>
              );
            }) : (
              <div style={{fontFamily:FM,fontSize:9,color:L4,textAlign:"center",padding:12}}>LOADING…</div>
            )}
          </Panel>
        </div>

        {/* CENTER: Tab panel ─────────────────────────────────────────────── */}
        <div style={{flex:1,display:"flex",flexDirection:"column",gap:8,minWidth:0}}>

          {/* Tab bar */}
          <div style={{display:"flex",gap:2,background:BG1,border:"1px solid "+BD1,borderRadius:4,padding:4,flexShrink:0}}>
            {TABS.map(function(t){
              var active=tab===t;
              var badge=t==="signals"?signals.length:t==="news"?newsItems.length:t==="map"?states.length:null;
              return (
                <button key={t} onClick={function(){setTab(t);}}
                  style={{flex:1,padding:"6px 4px",background:active?BG3:"transparent",border:"1px solid "+(active?BD2:"transparent"),
                    borderRadius:3,fontFamily:FM,fontSize:9,color:active?AMBER:L4,letterSpacing:"0.08em",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                  {tabLabels[t]}
                  {badge!=null&&badge>0&&<span style={{fontFamily:FM,fontSize:8,color:active?AMBER:L5,background:active?AMBER3:BG3,padding:"0 5px",borderRadius:8}}>{badge}</span>}
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          <div style={{flex:1,overflowY:"auto",minHeight:0}}>

            {/* SIGNALS TAB */}
            {tab==="signals"&&(
              <div>
                {signals.length>0?(
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                    {signals.map(function(s,i){ return <SigCard key={i} s={s}/>; })}
                  </div>
                ):(
                  <div style={{padding:40,textAlign:"center"}}>
                    <div style={{fontFamily:FM,fontSize:12,color:L4,marginBottom:8}}>GENERATING SIGNALS FROM LIVE DATA</div>
                    <div style={{fontFamily:FM,fontSize:9,color:L5}}>Hit /api/signals?generate=1 to trigger SignalDetect</div>
                  </div>
                )}
              </div>
            )}

            {/* NEWS TAB */}
            {tab==="news"&&(
              <Panel title="CONSTRUCTION INTELLIGENCE FEED" badge={newsD?.marketSentiment||"LOADING"}>
                {newsItems.length>0?
                  newsItems.map(function(item,i){ return <NewsItem key={i} item={item}/>; }) :
                  <div style={{padding:20,textAlign:"center",fontFamily:FM,fontSize:9,color:L4}}>AGGREGATING NEWS FROM ENR · CONSTRUCTION DIVE · NAHB · AGC…</div>
                }
              </Panel>
            )}

            {/* MAP TAB */}
            {tab==="map"&&(
              <Panel title="STATE CONSTRUCTION ACTIVITY" badge={mapD?"50 STATES":"LOADING"}>
                <StateGrid states={states}/>
                <div style={{marginTop:12,display:"flex",gap:12,flexWrap:"wrap"}}>
                  {[["HOT",GREEN,"HOT markets >10% YoY"],["GROWING",BLUE,"0-10% growth"],["STABLE",BD3,"Flat ±0%"],["COOLING",RED,"Declining <0%"]].map(function([label,col,tip]){
                    return <div key={label} style={{display:"flex",alignItems:"center",gap:5}}>
                      <div style={{width:10,height:10,background:col,borderRadius:2}}/>
                      <span style={{fontFamily:FM,fontSize:8,color:L4}}>{tip}</span>
                    </div>;
                  })}
                </div>
                {states.length>0&&(
                  <div style={{marginTop:12}}>
                    <div style={{fontFamily:FM,fontSize:8,color:L4,marginBottom:8,letterSpacing:"0.1em"}}>TOP 10 BY PERMITS</div>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:6}}>
                      {states.slice(0,10).map(function(s){
                        return (
                          <div key={s.code} style={{background:BG2,border:"1px solid "+BD1,borderRadius:3,padding:"7px 9px"}}>
                            <div style={{fontFamily:FM,fontSize:10,color:AMBER,marginBottom:2}}>{s.code}</div>
                            <div style={{fontFamily:FM,fontSize:9,color:L2}}>{(s.permits/1000).toFixed(0)}K</div>
                            <div style={{fontFamily:FM,fontSize:8,color:s.yoyChange>0?GREEN:RED}}>{fmtPct(s.yoyChange)}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </Panel>
            )}

            {/* SCENARIO TAB */}
            {tab==="scenario"&&(
              <Panel title="INTERACTIVE SCENARIO BUILDER" badge="MODEL IMPACT">
                <ScenarioBuilder/>
              </Panel>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Signal stats + summary ─────────────────────────── */}
        <div style={{width:220,flexShrink:0,display:"flex",flexDirection:"column",gap:8,overflowY:"auto"}}>

          <Panel title="SIGNAL BREAKDOWN">
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {[["BULLISH",bullN,GREEN,GREEN3],["BEARISH",bearN,RED,RED3],["WARNING",warnN,AMBER,AMBER3]].map(function([type,count,col,bg]){
                var pct=signals.length>0?Math.round(count/signals.length*100):0;
                return (
                  <div key={type}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                      <span style={{fontFamily:FM,fontSize:8,color:col}}>{type}</span>
                      <span style={{fontFamily:FM,fontSize:9,color:col}}>{count}</span>
                    </div>
                    <div style={{background:BG2,borderRadius:2,height:4,overflow:"hidden"}}>
                      <div style={{width:pct+"%",height:"100%",background:col,borderRadius:2,transition:"width 0.6s ease"}}/>
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>

          <Panel title="TOP SIGNALS">
            {signals.slice(0,4).map(function(s,i){
              return <SigCard key={i} s={s}/>;
            })}
            {signals.length===0&&<div style={{fontFamily:FM,fontSize:9,color:L4,textAlign:"center",padding:12}}>LOADING…</div>}
          </Panel>

          <Panel title="DATA STATUS" style={{flex:1}}>
            {[
              {label:"TTLCONS Harvest",ok:!!spend,src:"Census/FRED"},
              {label:"Employment",     ok:!!employ,src:"BLS CES"},
              {label:"Rates",          ok:!!rates, src:"FRED"},
              {label:"PPI Materials",  ok:!!ppi,   src:"BLS PPI"},
              {label:"Forecast",       ok:foreVals.length>0,src:"HW+SARIMA"},
              {label:"Signals",        ok:signals.length>0, src:"SignalDetect"},
              {label:"News Feed",      ok:newsItems.length>0,src:"NewsIntel"},
              {label:"State Map",      ok:states.length>0,  src:"BEA+FRED"},
            ].map(function(row){
              return (
                <div key={row.label} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                  <div>
                    <div style={{fontFamily:FM,fontSize:9,color:L3}}>{row.label}</div>
                    <div style={{fontFamily:FM,fontSize:7,color:L5}}>{row.src}</div>
                  </div>
                  <div style={{width:6,height:6,borderRadius:"50%",background:row.ok?GREEN:BD2,boxShadow:row.ok?"0 0 6px "+GREEN2:"none"}}/>
                </div>
              );
            })}
          </Panel>
        </div>
      </div>
    </div>
  );
}

// ── Header stat chip ──────────────────────────────────────────────────────────
function HeaderStat({label,value,change,color}){
  var cc=change>0?GREEN:change<0?RED:L4;
  return (
    <div style={{textAlign:"right"}}>
      <div style={{fontFamily:FM,fontSize:7,color:L4,letterSpacing:"0.1em"}}>{label}</div>
      <div style={{fontFamily:FM,fontSize:11,color:color||L1,lineHeight:1.2}}>{value}</div>
      {change!=null&&<div style={{fontFamily:FM,fontSize:8,color:cc}}>{fmtPct(change)}</div>}
    </div>
  );
}
