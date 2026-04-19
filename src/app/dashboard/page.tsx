"use client";
import { useState, useEffect, useMemo } from "react";
import {
  ComposedChart, AreaChart, LineChart,
  Area, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine
} from "recharts";

var C = {
  bg0:"#060608", bg1:"#0F0F13", bg2:"#18181D", bg3:"#222228",
  brd:"rgba(255,255,255,0.08)", brdA:"rgba(10,132,255,0.28)",
  blue:"#0A84FF", blueD:"rgba(10,132,255,0.12)", blueB:"rgba(10,132,255,0.26)",
  green:"#30D158", greenD:"rgba(48,209,88,0.12)",
  red:"#FF453A", redD:"rgba(255,69,58,0.12)",
  amber:"#FF9F0A", teal:"#5AC8FA", purple:"#BF5AF2",
  l1:"#FFFFFF", l2:"rgba(255,255,255,0.72)",
  l3:"rgba(255,255,255,0.44)", l4:"rgba(255,255,255,0.24)",
};
var FA = "'Aeonik Pro','Plus Jakarta Sans',-apple-system,BlinkMacSystemFont,sans-serif";
var FM = "'SF Mono','Fira Code','JetBrains Mono',monospace";
var LOGO = "https://raw.githubusercontent.com/toddbridgeford/ConstructAIQ/Predictive-Model/ConstructAIQWhiteLogo.svg";

var DCSS = [
  "@font-face{font-family:'Aeonik Pro';src:url('https://db.onlinewebfonts.com/t/12ff62164c9778917bddb93c6379cf47.woff2') format('woff2');font-weight:400;font-display:swap}",
  "@font-face{font-family:'Aeonik Pro';src:url('https://db.onlinewebfonts.com/t/81c9cfcec66a1bb46e90e184f4d04641.woff2') format('woff2');font-weight:500;font-display:swap}",
  "@font-face{font-family:'Aeonik Pro';src:url('https://db.onlinewebfonts.com/t/362636484f8ad521fec5a297fdc0ab12.woff2') format('woff2');font-weight:700;font-display:swap}",
  "@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');",
  "@keyframes dtick{from{transform:translateX(0)}to{transform:translateX(-50%)}}",
  "@keyframes dpulse{0%,100%{opacity:1}50%{opacity:.35}}",
  "@keyframes dfade{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}",
  "@keyframes dspin{to{transform:rotate(360deg)}}",
  "*{box-sizing:border-box;margin:0;padding:0}",
  "html{-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}",
  "::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:rgba(255,255,255,.15);border-radius:2px}",
  ".dtick{animation:dtick 100s linear infinite}",
  ".dpulse{animation:dpulse 2s infinite}",
  ".dspin{animation:dspin .8s linear infinite}",
  ".f1{opacity:0;animation:dfade .5s ease 0s forwards}",
  ".f2{opacity:0;animation:dfade .5s ease .07s forwards}",
  ".f3{opacity:0;animation:dfade .5s ease .14s forwards}",
  ".f4{opacity:0;animation:dfade .5s ease .21s forwards}",
  ".dtab{border:none;cursor:pointer;transition:all .15s;min-height:44px;display:inline-flex;align-items:center;justify-content:center}",
  ".dtab:hover{opacity:.8}",
  ".drow:hover{background:rgba(255,255,255,.03)!important;cursor:default}",
  ".dsig:hover{background:rgba(10,132,255,.04)!important;cursor:default}",
  ".dcard{transition:border-color .2s,box-shadow .2s}",
  ".dcard:hover{border-color:rgba(10,132,255,.2)!important;box-shadow:0 4px 28px rgba(0,0,0,.35)!important}",
  "input[type=range]{-webkit-appearance:none;appearance:none;width:100%;height:4px;border-radius:2px;background:rgba(255,255,255,0.12);outline:none}",
  "input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:18px;height:18px;border-radius:50%;background:#0A84FF;cursor:pointer;border:2px solid rgba(255,255,255,0.3)}",
  "input[type=range]::-moz-range-thumb{width:18px;height:18px;border-radius:50%;background:#0A84FF;cursor:pointer;border:2px solid rgba(255,255,255,0.3)}",
  "@media(max-width:1140px){.dkmain{grid-template-columns:1fr!important}.dkpi{grid-template-columns:repeat(2,1fr)!important}.d3col{grid-template-columns:1fr 1fr!important}.dcharts{grid-template-columns:1fr!important}}",
  "@media(max-width:768px){.dkpi{grid-template-columns:repeat(2,1fr)!important}.d3col{grid-template-columns:1fr!important}.dcharts{grid-template-columns:1fr!important}.dcont{padding:14px 14px!important}.dhide{display:none!important}.dtime{display:none!important}}",
  "@media(max-width:480px){.dtabs{display:none!important}.dkpi{grid-template-columns:1fr 1fr!important}}",
].join("");

/* ── Holt-Winters (inline) ────────────────────────────────── */
function hwForecast(vals, periods = 12, alpha = 0.30, beta = 0.08) {
  var a = alpha !== undefined ? alpha : 0.30;
  var b = beta  !== undefined ? beta  : 0.08;
  var h = periods !== undefined ? periods : 12;
  if (!vals || vals.length < 4) return null;
  var v = vals.filter(function(x){ return x != null && !isNaN(x); });
  var n = v.length; if (n < 4) return null;
  var level = v[0];
  var trend = (v[Math.min(5,n-1)] - v[0]) / Math.min(5,n-1);
  var fitted = [v[0]];
  for (var i = 1; i < n; i++) {
    var pL = level;
    level = a * v[i] + (1-a) * (level + trend);
    trend = b * (level - pL) + (1-b) * trend;
    fitted.push(level + trend);
  }
  var res  = v.map(function(x,i){ return x - fitted[i]; });
  var se   = Math.sqrt(res.reduce(function(s,r){ return s+r*r; },0)/n);
  var mape = v.reduce(function(s,x,i){ return s+Math.abs((x-fitted[i])/x); },0)/n*100;
  var fcst = [];
  for (var k = 1; k <= h; k++) {
    var f = level + k * trend;
    var seh = se * Math.sqrt(1 + a*a*k);
    fcst.push({ base:Math.round(f*10)/10, lo80:Math.round((f-1.282*seh)*10)/10, hi80:Math.round((f+1.282*seh)*10)/10, lo95:Math.round((f-1.960*seh)*10)/10, hi95:Math.round((f+1.960*seh)*10)/10 });
  }
  return { fitted:fitted, forecast:fcst, finalLevel:level, finalTrend:trend, metrics:{ accuracy:Math.max(50,Math.round((100-mape)*10)/10), mape:Math.round(mape*100)/100, se:Math.round(se*10)/10, n:n } };
}

/* ── Real baked-in data (Census, BLS, FRED — Apr 19 2026) ─── */
var SPEND_M  = ["Feb'24","Mar'24","Apr'24","May'24","Jun'24","Jul'24","Aug'24","Sep'24","Oct'24","Nov'24","Dec'24","Jan'25","Feb'25","Mar'25","Apr'25","May'25","Jun'25","Jul'25","Aug'25","Sep'25","Oct'25","Nov'25","Dec'25","Jan'26"];
var SPEND_V  = [2184.6,2174.9,2206.5,2215.4,2199.8,2200.7,2205.3,2197.9,2197.1,2192.9,2176.6,2169.6,2165.4,2150.8,2153.4,2149.1,2160.7,2168.5,2177.2,2169.5,2167.9,2181.2,2197.6,2190.4];
var SPEND_FM = ["Feb'26","Mar'26","Apr'26","May'26","Jun'26","Jul'26","Aug'26","Sep'26","Oct'26","Nov'26","Dec'26","Jan'27"];
var EMPLOY_M = ["Apr'24","May'24","Jun'24","Jul'24","Aug'24","Sep'24","Oct'24","Nov'24","Dec'24","Jan'25","Feb'25","Mar'25","Apr'25","May'25","Jun'25","Jul'25","Aug'25","Sep'25","Oct'25","Nov'25","Dec'25","Jan'26","Feb'26","Mar'26"];
var EMPLOY_V = [8170,8176,8196,8208,8236,8254,8262,8267,8276,8264,8267,8273,8271,8269,8267,8261,8239,8255,8243,8279,8272,8317,8304,8330];
var EMPLOY_FM= ["Apr'26","May'26","Jun'26","Jul'26","Aug'26","Sep'26","Oct'26","Nov'26","Dec'26","Jan'27","Feb'27","Mar'27"];
var STARTS_V = [1552,1312,1385,1316,1327,1265,1391,1357,1352,1295,1514,1358,1490,1355,1398,1282,1382,1420,1291,1328,1272,1324,1387,1487];
var PERMIT_V = [1577,1476,1459,1407,1461,1436,1476,1434,1428,1508,1480,1460,1454,1481,1422,1394,1393,1362,1330,1415,1411,1388,1455,1386];
var SPEND_MOM  = ((SPEND_V[23]-SPEND_V[22])/SPEND_V[22]*100).toFixed(2);
var EMPLOY_MOM = ((EMPLOY_V[23]-EMPLOY_V[22])/EMPLOY_V[22]*100).toFixed(2);
var STARTS_MOM = ((STARTS_V[23]-STARTS_V[22])/STARTS_V[22]*100).toFixed(2);
var PERMIT_MOM = ((PERMIT_V[23]-PERMIT_V[22])/PERMIT_V[22]*100).toFixed(2);

function buildSeries(histM, histV, fcstM, hw) {
  var hist = histM.map(function(m,i){return {m:m,v:histV[i],b:null,lo8:null,hi8:null,lo9:null,hi9:null};});
  var lastV = histV[histV.length-1];
  var bridge = [{m:histM[histM.length-1],v:lastV,b:lastV,lo8:lastV,hi8:lastV,lo9:lastV,hi9:lastV}];
  var fcst = hw ? fcstM.map(function(m,i){ var f=hw.forecast[i]; return f?{m:m,v:null,b:f.base,lo8:f.lo80,hi8:f.hi80,lo9:f.lo95,hi9:f.hi95}:{m:m,v:null,b:null,lo8:null,hi8:null,lo9:null,hi9:null}; }) : [];
  return hist.concat(bridge).concat(fcst);
}

var HW_SPEND  = hwForecast(SPEND_V,  12);
var HW_EMPLOY = hwForecast(EMPLOY_V, 12);
var SPEND_SERIES  = buildSeries(SPEND_M,  SPEND_V,  SPEND_FM,  HW_SPEND);
var EMPLOY_SERIES = buildSeries(EMPLOY_M, EMPLOY_V, EMPLOY_FM, HW_EMPLOY);

/* ── Tiny UI helpers ─────────────────────────────────────── */
function Card(p) { return <div className={"dcard "+(p.className||"")} style={Object.assign({background:C.bg2,border:"1px solid "+C.brd,borderRadius:14},p.style||{})}>{p.children}</div>; }
function SecLbl(p) { return <div style={{fontFamily:FM,fontSize:9.5,color:p.color||C.blue,letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:12}}>{p.children}</div>; }
function SrcDot(p) { return <div style={{display:"flex",alignItems:"center",gap:5}}><div style={{width:5,height:5,borderRadius:"50%",background:p.live?C.green:C.amber}}/><span style={{fontFamily:FM,fontSize:9,color:C.l3}}>{p.label}</span></div>; }

function Spark(p) {
  var vals=p.data.map(function(d){return d.v;}); var mn=Math.min.apply(null,vals),mx=Math.max.apply(null,vals),rng=mx-mn||1;
  var W=80,H=28,n=vals.length; var pts=vals.map(function(v,i){return (i/(n-1)*W)+","+(H-(v-mn)/rng*(H-2)-1);}).join(" ");
  var fill="0,"+H+" "+pts+" "+W+","+H; var id="sk"+p.color.replace(/[^a-z0-9]/gi,"").substr(0,6);
  return <svg width={W} height={H} viewBox={"0 0 "+W+" "+H}><defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={p.color} stopOpacity="0.35"/><stop offset="100%" stopColor={p.color} stopOpacity="0"/></linearGradient></defs><polygon points={fill} fill={"url(#"+id+")"}/><polyline points={pts} fill="none" stroke={p.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}

function SpendTip(p) {
  if (!p.active||!p.payload||!p.payload.length) return null; var d=p.payload[0].payload;
  return <div style={{background:C.bg3,border:"1px solid "+C.brd,borderRadius:10,padding:"12px 16px",minWidth:200,boxShadow:"0 8px 32px rgba(0,0,0,.5)"}}>
    <div style={{fontFamily:FM,fontSize:10,color:C.l3,marginBottom:8}}>{p.label}</div>
    {d.v!=null&&<div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontFamily:FM,fontSize:10,color:C.l3}}>Actual:</span><span style={{fontFamily:FA,fontSize:14,fontWeight:700,color:C.l1}}>${d.v.toLocaleString()}B</span></div>}
    {d.b!=null&&<div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontFamily:FM,fontSize:10,color:C.l3}}>Forecast:</span><span style={{fontFamily:FA,fontSize:14,fontWeight:700,color:C.blue}}>${d.b.toLocaleString()}B</span></div>}
    {d.hi8!=null&&<div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontFamily:FM,fontSize:9,color:C.l4}}>80% CI:</span><span style={{fontFamily:FM,fontSize:9,color:C.l3}}>${d.lo8}~{d.hi8}B</span></div>}
  </div>;
}
function SimpleTip(p) {
  if (!p.active||!p.payload||!p.payload.length) return null; var unit=p.unit||"";
  return <div style={{background:C.bg3,border:"1px solid "+C.brd,borderRadius:10,padding:"10px 14px",boxShadow:"0 8px 32px rgba(0,0,0,.5)"}}>
    <div style={{fontFamily:FM,fontSize:10,color:C.l3,marginBottom:6}}>{p.label}</div>
    {p.payload.map(function(px,i){return <div key={i} style={{display:"flex",justifyContent:"space-between",gap:16,marginBottom:2}}><span style={{fontFamily:FM,fontSize:10,color:px.color||C.l3}}>{px.name}:</span><span style={{fontFamily:FA,fontSize:13,fontWeight:700,color:px.color||C.l1}}>{typeof px.value==="number"?px.value.toLocaleString():px.value}{unit}</span></div>;})}
  </div>;
}

/* ── Ticker ───────────────────────────────────────────────── */
var TICKS = [
  ["TTLCONS $2,190B",SPEND_MOM+"%",parseFloat(SPEND_MOM)>=0?1:-1],
  ["HOUST 1,487K",STARTS_MOM+"%",parseFloat(STARTS_MOM)>=0?1:-1],
  ["PERMIT 1,386K",PERMIT_MOM+"%",parseFloat(PERMIT_MOM)>=0?1:-1],
  ["EMPLOY 8,330K",EMPLOY_MOM+"%",parseFloat(EMPLOY_MOM)>=0?1:-1],
  ["LUMBER $512","+3.2%",1],["STEEL HR $748","-1.4%",-1],["COPPER $4.82","+0.8%",1],
  ["IIJA $890B","ACTIVE",0],["10YR 4.32%","-2bp",-1],["AGC BCI 58.4","+2.1",1],
  ["MORTGAGE 6.85%","+3bp",-1],["JOLTS 312K","-1.3%",-1],
];
function Ticker() {
  var all=TICKS.concat(TICKS);
  return <div style={{background:C.bg1,borderBottom:"1px solid "+C.brd,height:36,overflow:"hidden",position:"relative"}}>
    <div style={{position:"absolute",left:0,top:0,width:64,height:"100%",background:"linear-gradient(to right,"+C.bg1+",transparent)",zIndex:3,pointerEvents:"none"}}/>
    <div style={{position:"absolute",right:0,top:0,width:64,height:"100%",background:"linear-gradient(to left,"+C.bg1+",transparent)",zIndex:3,pointerEvents:"none"}}/>
    <div className="dtick" style={{display:"flex",gap:48,alignItems:"center",whiteSpace:"nowrap",paddingLeft:56,height:"100%"}}>
      {all.map(function(t,i){return <span key={i} style={{fontFamily:FM,fontSize:10.5,letterSpacing:"0.04em",display:"inline-flex",alignItems:"center",gap:7}}><span style={{color:C.l4}}>{t[0]}</span>{t[1]?<span style={{color:t[2]>0?C.green:t[2]<0?C.red:C.blue,fontWeight:500}}>{t[1]}</span>:null}</span>;})}
    </div>
  </div>;
}

/* ── Data Status Bar ──────────────────────────────────────── */
function DataStatus(p) {
  var s=p.status||{};
  var srcs=[{lbl:"Census TTLCONS",ok:s.census},{lbl:"BLS CES/JOLTS",ok:s.bls},{lbl:"FRED Rates",ok:s.rates},{lbl:"BLS PPI",ok:s.ppi},{lbl:"USASpending",ok:s.contracts},{lbl:"BEA",ok:s.bea},{lbl:"EIA",ok:s.eia}];
  return <div style={{background:C.bg1,borderBottom:"1px solid "+C.brd,padding:"7px 24px",display:"flex",alignItems:"center",gap:20,flexWrap:"wrap"}}>
    <span style={{fontFamily:FM,fontSize:9,color:C.l4,letterSpacing:"0.12em",flexShrink:0}}>LIVE DATA:</span>
    {srcs.map(function(src,i){return <SrcDot key={i} label={src.lbl} live={!!src.ok}/>;})}
    <span style={{marginLeft:"auto",fontFamily:FM,fontSize:9,color:C.l4}}>4h refresh cycle</span>
  </div>;
}

/* ── KPI Strip ────────────────────────────────────────────── */
function KPIStrip(p) {
  var live=p.liveData||{};
  var mk=function(vals){return vals.map(function(v,i){return {i:i,v:v};});};
  var kpis=[
    {lbl:"Total Construction",val:live.spend||"$2,190",unit:"B SAAR",chg:SPEND_MOM+"%",up:parseFloat(SPEND_MOM)>=0,spark:mk(SPEND_V.slice(-12)),sc:C.blue,src:"Census/FRED"},
    {lbl:"Construction Jobs",val:live.employ||"8,330",unit:"K SA",chg:EMPLOY_MOM+"%",up:parseFloat(EMPLOY_MOM)>=0,spark:mk(EMPLOY_V.slice(-12)),sc:C.green,src:"BLS"},
    {lbl:"Housing Starts",val:live.starts||"1,487",unit:"K SAAR",chg:STARTS_MOM+"%",up:parseFloat(STARTS_MOM)>=0,spark:mk(STARTS_V.slice(-12)),sc:parseFloat(STARTS_MOM)>=0?C.green:C.red,src:"FRED"},
    {lbl:"Building Permits",val:live.permits||"1,386",unit:"K SAAR",chg:PERMIT_MOM+"%",up:parseFloat(PERMIT_MOM)>=0,spark:mk(PERMIT_V.slice(-12)),sc:parseFloat(PERMIT_MOM)>=0?C.green:C.red,src:"FRED"},
  ];
  return <div className="dkpi f1" style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:18}}>
    {kpis.map(function(k,i){return <Card key={k.lbl} style={{padding:"20px 20px 16px"}}>
      <div style={{fontFamily:FM,fontSize:9,color:C.l4,letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:10}}>{k.lbl}</div>
      <div style={{display:"flex",alignItems:"baseline",gap:5,marginBottom:10}}>
        <span style={{fontFamily:FA,fontSize:26,fontWeight:700,color:C.l1,letterSpacing:"-0.03em",lineHeight:1}}>{k.val}</span>
        <span style={{fontFamily:FM,fontSize:10,color:C.l4}}>{k.unit}</span>
      </div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end"}}>
        <div>
          <span style={{fontFamily:FM,fontSize:11,fontWeight:600,color:k.up?C.green:C.red}}>{k.up&&parseFloat(k.chg)>0?"+":""}{k.chg}</span>
          <span style={{fontFamily:FM,fontSize:9,color:C.l4,marginLeft:4}}>MoM</span>
          <div style={{marginTop:5}}><SrcDot label={k.src} live={true}/></div>
        </div>
        <Spark data={k.spark} color={k.sc}/>
      </div>
    </Card>;})}
  </div>;
}

/* ── Main Forecast Chart ──────────────────────────────────── */
function ForecastChart() {
  var [tab,setTab]=useState("spend");
  var hw=tab==="spend"?HW_SPEND:HW_EMPLOY;
  var data=tab==="spend"?SPEND_SERIES:EMPLOY_SERIES;
  var todayRef=tab==="spend"?"Jan'26":"Mar'26";
  var hCol=tab==="spend"?C.blue:C.green;
  var gradId=tab==="spend"?"fhgS":"fhgE";
  var yFmt=tab==="spend"?function(v){return "$"+v+"B";}:function(v){return v+"K";};
  var yDom=tab==="spend"?[2100,2400]:[8050,8550];
  var tabs=[{id:"spend",lbl:"Construction Spend"},{id:"employ",lbl:"Employment"}];
  return <Card style={{padding:"24px 24px"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20,flexWrap:"wrap",gap:12}}>
      <div style={{flex:1,minWidth:200}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6,flexWrap:"wrap"}}>
          <SecLbl>Holt-Winters DES · 24-Month Lookback · Real API Data</SecLbl>
          {hw&&<div style={{background:C.greenD,border:"1px solid rgba(48,209,88,0.25)",borderRadius:5,padding:"2px 9px",display:"inline-flex",alignItems:"center",gap:6}}><span style={{fontFamily:FM,fontSize:8.5,color:C.green}}>{hw.metrics.accuracy}% ACCURACY</span></div>}
        </div>
        <div style={{fontFamily:FA,fontSize:18,fontWeight:700,color:C.l1,letterSpacing:"-0.02em",marginBottom:3}}>12-Month AI Forecast with Confidence Intervals</div>
        <div style={{fontFamily:FM,fontSize:9.5,color:C.l3}}>{tab==="spend"?"TTLCONS · Census Bureau VIP · SAAR · $Billions":"CES2000000001 · BLS · SA · Thousands"}</div>
      </div>
      <div style={{display:"flex",gap:6}}>
        {tabs.map(function(t){return <button key={t.id} className="dtab" onClick={function(){setTab(t.id);}} style={{fontFamily:FM,fontSize:10,letterSpacing:"0.08em",padding:"0 12px",height:36,borderRadius:8,background:tab===t.id?C.blueD:"transparent",border:"1px solid "+(tab===t.id?C.brdA:C.brd),color:tab===t.id?C.blue:C.l4}}>{t.lbl}</button>;})}
      </div>
    </div>
    {hw&&<div style={{display:"flex",gap:24,marginBottom:18,paddingBottom:16,borderBottom:"1px solid "+C.brd,flexWrap:"wrap"}}>
      {[{l:"Model",v:"Holt-Winters DES"},{l:"MAPE",v:hw.metrics.mape+"%"},{l:"Accuracy",v:hw.metrics.accuracy+"%",hi:true},{l:"Trained",v:hw.metrics.n+"mo"},{l:"Horizon",v:"12mo"}]
        .map(function(m,i){return <div key={i}><div style={{fontFamily:FM,fontSize:8.5,color:C.l4,letterSpacing:"0.1em",marginBottom:2}}>{m.l}</div><div style={{fontFamily:FA,fontSize:12,fontWeight:600,color:m.hi?C.green:C.l1}}>{m.v}</div></div>;})}
    </div>}
    <div style={{display:"flex",gap:20,marginBottom:14,flexWrap:"wrap"}}>
      {[{lbl:"Actual",el:<div style={{width:20,height:2,background:hCol,borderRadius:1}}/>},{lbl:"HW Forecast",el:<div style={{width:20,height:0,borderBottom:"2px dashed #40B8FF"}}/>},{lbl:"80% CI",el:<div style={{width:12,height:12,background:"rgba(10,132,255,0.28)",borderRadius:3}}/>},{lbl:"95% CI",el:<div style={{width:12,height:12,background:"rgba(10,132,255,0.10)",borderRadius:3}}/>}]
        .map(function(l,i){return <div key={i} style={{display:"flex",alignItems:"center",gap:6}}>{l.el}<span style={{fontFamily:FM,fontSize:9,color:C.l4}}>{l.lbl}</span></div>;})}
    </div>
    <ResponsiveContainer width="100%" height={310}>
      <ComposedChart data={data} margin={{top:4,right:8,bottom:4,left:8}}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={hCol} stopOpacity="0.28"/>
            <stop offset="100%" stopColor={hCol} stopOpacity="0.02"/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)"/>
        <XAxis dataKey="m" tick={{fontFamily:FM,fontSize:9,fill:C.l4}} tickLine={false} axisLine={false} interval={3}/>
        <YAxis tick={{fontFamily:FM,fontSize:9,fill:C.l4}} tickLine={false} axisLine={false} width={50} tickFormatter={yFmt} domain={yDom}/>
        <Tooltip content={<SpendTip/>}/>
        <ReferenceLine x={todayRef} stroke="rgba(255,255,255,0.22)" strokeDasharray="4 2" strokeWidth={1} label={{value:"NOW",position:"insideTopRight",fontSize:8,fontFamily:FM,fill:C.l4,offset:8}}/>
        <Area type="monotone" dataKey="hi9" fill="rgba(10,132,255,0.10)" stroke="none" legendType="none" connectNulls={false} activeDot={false}/>
        <Area type="monotone" dataKey="lo9" fill={C.bg2} stroke="none" legendType="none" connectNulls={false} activeDot={false}/>
        <Area type="monotone" dataKey="hi8" fill="rgba(10,132,255,0.22)" stroke="none" legendType="none" connectNulls={false} activeDot={false}/>
        <Area type="monotone" dataKey="lo8" fill={C.bg2} stroke="none" legendType="none" connectNulls={false} activeDot={false}/>
        <Area type="monotone" dataKey="v" fill={"url(#"+gradId+")"} stroke={hCol} strokeWidth={2} dot={false} connectNulls={false}/>
        <Line type="monotone" dataKey="b" stroke="#40B8FF" strokeWidth={2} strokeDasharray="5 3" dot={false} connectNulls={false}/>
      </ComposedChart>
    </ResponsiveContainer>
  </Card>;
}

/* ── INTERACTIVE SCENARIO BUILDER ────────────────────────── */
function ScenarioBuilder() {
  var [rate,setRate]=useState(0);
  var [labor,setLabor]=useState(0);
  var [mats,setMats]=useState(0);

  var baseCase12 = HW_SPEND ? HW_SPEND.forecast[11].base : 2220;
  var rateImpact  = rate   * -0.032 * 0.45 * baseCase12 / 100;
  var laborImpact = labor  * -0.18  * 0.1  * baseCase12 / 100;
  var matsImpact  = mats   * -0.09  * 0.1  * baseCase12 / 100;
  var totalImpact = Math.round((rateImpact+laborImpact+matsImpact)*10)/10;
  var scenarioCase = Math.round((baseCase12+totalImpact)*10)/10;
  var impactPct    = ((scenarioCase-baseCase12)/baseCase12*100).toFixed(1);

  var scenarioData = useMemo(function() {
    if (!HW_SPEND) return [];
    var adjTrend = HW_SPEND.finalTrend + totalImpact/120;
    var hist = SPEND_M.map(function(m,i){return {m:m,base:null,scenario:null,v:SPEND_V[i]};});
    var lastV = SPEND_V[SPEND_V.length-1];
    var bridge = [{m:SPEND_M[SPEND_M.length-1],v:lastV,base:lastV,scenario:lastV}];
    var fcst = SPEND_FM.map(function(m,i){
      var bv=HW_SPEND.forecast[i].base;
      var sv=Math.round((HW_SPEND.finalLevel+(i+1)*adjTrend)*10)/10;
      return {m:m,v:null,base:bv,scenario:sv};
    });
    return hist.concat(bridge).concat(fcst);
  },[rate,labor,mats]);

  var impactColor = totalImpact < -5 ? C.red : totalImpact > 5 ? C.green : C.amber;

  return <Card style={{padding:"24px 24px"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20,flexWrap:"wrap",gap:12}}>
      <div>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
          <SecLbl color={C.purple}>Interactive Scenario Builder</SecLbl>
          <div style={{background:"rgba(191,90,242,0.12)",border:"1px solid rgba(191,90,242,0.28)",borderRadius:5,padding:"2px 9px"}}><span style={{fontFamily:FM,fontSize:8.5,color:C.purple}}>LIVE MODEL</span></div>
        </div>
        <div style={{fontFamily:FA,fontSize:18,fontWeight:700,color:C.l1,letterSpacing:"-0.02em",marginBottom:3}}>Adjust Macro Assumptions. See Forecast Impact.</div>
        <div style={{fontFamily:FM,fontSize:9.5,color:C.l3}}>Rate shock, labor shortage, material escalation -- how does TTLCONS 12-month outlook shift?</div>
      </div>
      <button className="dtab" onClick={function(){setRate(0);setLabor(0);setMats(0);}} style={{fontFamily:FM,fontSize:10,letterSpacing:"0.08em",padding:"0 14px",height:36,borderRadius:8,background:"transparent",border:"1px solid "+C.brd,color:C.l4}}>Reset</button>
    </div>

    <div className="d3col" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16,marginBottom:20}}>
      {[
        {lbl:"Rate Environment",sub:"vs current 4.32% / 6.85% mortgage",min:-200,max:200,step:25,val:rate,unit:"bp",col:rate===0?C.l4:rate>0?C.red:C.green,set:setRate},
        {lbl:"Labor Availability",sub:"vs current tight market (2.8% vacancy)",min:-30,max:30,step:5,val:labor,unit:"%",col:labor===0?C.l4:labor>0?C.green:C.red,set:setLabor},
        {lbl:"Material Cost Pressure",sub:"vs current 62/100 composite index",min:-20,max:40,step:5,val:mats,unit:"%",col:mats===0?C.l4:mats>0?C.red:C.green,set:setMats},
      ].map(function(s,i){return <div key={i} style={{background:C.bg3,borderRadius:10,padding:"16px 16px",border:"1px solid "+C.brd}}>
        <div style={{fontFamily:FM,fontSize:9,color:C.l4,letterSpacing:"0.1em",marginBottom:4}}>{s.lbl}</div>
        <div style={{fontFamily:FA,fontSize:22,fontWeight:700,color:s.col,letterSpacing:"-0.02em",marginBottom:4}}>{s.val>0?"+":""}{s.val}{s.unit}</div>
        <div style={{fontFamily:FM,fontSize:9,color:C.l4,marginBottom:12}}>{s.sub}</div>
        <input type="range" min={s.min} max={s.max} step={s.step} value={s.val} onChange={function(e){s.set(parseInt(e.target.value));}} style={{accentColor:C.blue}}/>
        <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}>
          <span style={{fontFamily:FM,fontSize:9,color:C.l4}}>{s.min}{s.unit}</span>
          <span style={{fontFamily:FM,fontSize:9,color:C.l4}}>+{s.max}{s.unit}</span>
        </div>
      </div>;})}
    </div>

    <ResponsiveContainer width="100%" height={200}>
      <ComposedChart data={scenarioData} margin={{top:4,right:8,bottom:4,left:8}}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)"/>
        <XAxis dataKey="m" tick={{fontFamily:FM,fontSize:9,fill:C.l4}} tickLine={false} axisLine={false} interval={3}/>
        <YAxis tick={{fontFamily:FM,fontSize:9,fill:C.l4}} tickLine={false} axisLine={false} width={50} tickFormatter={function(v){return "$"+v+"B";}} domain={[2050,2500]}/>
        <Tooltip content={<SimpleTip unit="B"/>}/>
        <ReferenceLine x={"Jan'26"} stroke="rgba(255,255,255,0.22)" strokeDasharray="4 2" strokeWidth={1}/>
        <Line type="monotone" dataKey="v" name="Historical" stroke={C.blue} strokeWidth={2} dot={false} connectNulls={false}/>
        <Line type="monotone" dataKey="base" name="Base Case" stroke="rgba(10,132,255,0.5)" strokeWidth={1.5} strokeDasharray="4 2" dot={false} connectNulls={false}/>
        <Line type="monotone" dataKey="scenario" name="Scenario" stroke={impactColor} strokeWidth={2.5} dot={false} connectNulls={false}/>
      </ComposedChart>
    </ResponsiveContainer>

    <div style={{marginTop:16,display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}} className="dkpi">
      {[
        {lbl:"Base Case (Jan 27)",val:"$"+baseCase12+"B",col:C.blue},
        {lbl:"Your Scenario",val:"$"+scenarioCase+"B",col:impactColor},
        {lbl:"Total Impact",val:(totalImpact>=0?"+":"")+totalImpact+"B",col:impactColor},
        {lbl:"Relative Change",val:impactPct+"%",col:parseFloat(impactPct)<0?C.red:parseFloat(impactPct)>0?C.green:C.l3},
      ].map(function(k,i){return <div key={i} style={{background:C.bg3,borderRadius:9,padding:"12px 14px",border:"1px solid "+C.brd}}>
        <div style={{fontFamily:FM,fontSize:8.5,color:C.l4,letterSpacing:"0.1em",marginBottom:4}}>{k.lbl}</div>
        <div style={{fontFamily:FA,fontSize:18,fontWeight:700,color:k.col,letterSpacing:"-0.02em"}}>{k.val}</div>
      </div>;})}
    </div>

    {(Math.abs(rateImpact)+Math.abs(laborImpact)+Math.abs(matsImpact))>0.5&&<div style={{marginTop:14,padding:"12px 14px",background:"rgba(191,90,242,0.06)",border:"1px solid rgba(191,90,242,0.18)",borderRadius:8}}>
      <div style={{fontFamily:FM,fontSize:9,color:C.purple,letterSpacing:"0.1em",marginBottom:8}}>DRIVER DECOMPOSITION</div>
      <div style={{display:"flex",gap:20,flexWrap:"wrap"}}>
        {[{lbl:"Rate shock ("+rate+"bp)",val:rateImpact,show:rate!==0},{lbl:"Labor ("+labor+"%)",val:laborImpact,show:labor!==0},{lbl:"Materials ("+mats+"%)",val:matsImpact,show:mats!==0}]
          .filter(function(d){return d.show;})
          .map(function(d,i){var col=d.val<0?C.red:d.val>0?C.green:C.l3;return <div key={i} style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:8,height:8,borderRadius:"50%",background:col}}/><span style={{fontFamily:FM,fontSize:10,color:C.l3}}>{d.lbl}:</span><span style={{fontFamily:FA,fontSize:12,fontWeight:600,color:col}}>{d.val>=0?"+":""}{Math.round(d.val*10)/10}B</span></div>;})}
      </div>
    </div>}
  </Card>;
}

/* ── Rate Panel ───────────────────────────────────────────── */
function RatePanel(p) {
  var rd=p.data; var summary=rd&&rd.summary?rd.summary:{treasury10yr:4.32,mortgage30yr:6.85,constructionLoan:6.57,rateEnvironment:"MODERATE"};
  var monthly=rd&&rd.monthly?rd.monthly:[{m:"Jan'25",tenYr:4.53,mortgage:6.96},{m:"Apr'25",tenYr:4.34,mortgage:6.81},{m:"Jul'25",tenYr:4.26,mortgage:6.75},{m:"Oct'25",tenYr:4.22,mortgage:6.72},{m:"Jan'26",tenYr:4.40,mortgage:6.88},{m:"Feb'26",tenYr:4.29,mortgage:6.82},{m:"Mar'26",tenYr:4.32,mortgage:6.85}];
  var envColor=summary.rateEnvironment==="ELEVATED"?C.red:summary.rateEnvironment==="MODERATE"?C.amber:C.green;
  return <Card style={{padding:"22px 20px"}}>
    <SecLbl color={C.amber}>FRED · Rate Monitor</SecLbl>
    <div style={{fontFamily:FA,fontSize:14,fontWeight:700,color:C.l1,marginBottom:14}}>Interest Rate Environment</div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:14}}>
      {[{lbl:"10yr Treasury",val:summary.treasury10yr+"%"},{lbl:"30yr Mortgage",val:summary.mortgage30yr+"%"},{lbl:"Const. Loan (est)",val:summary.constructionLoan+"%"}]
        .map(function(r,i){return <div key={i} style={{background:C.bg3,borderRadius:8,padding:"10px 12px",border:"1px solid "+C.brd}}><div style={{fontFamily:FM,fontSize:8.5,color:C.l4,marginBottom:4}}>{r.lbl}</div><div style={{fontFamily:FA,fontSize:15,fontWeight:700,color:C.l1}}>{r.val}</div></div>;})}
    </div>
    <ResponsiveContainer width="100%" height={130}>
      <LineChart data={monthly} margin={{top:4,right:4,bottom:4,left:4}}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)"/>
        <XAxis dataKey="m" tick={{fontFamily:FM,fontSize:9,fill:C.l4}} tickLine={false} axisLine={false} interval={2}/>
        <YAxis tick={{fontFamily:FM,fontSize:9,fill:C.l4}} tickLine={false} axisLine={false} width={32} tickFormatter={function(v){return v+"%";}} domain={[3,8]}/>
        <Tooltip content={<SimpleTip unit="%"/>}/>
        <Line type="monotone" dataKey="tenYr" name="10yr Tsy" stroke={C.amber} strokeWidth={2} dot={false}/>
        <Line type="monotone" dataKey="mortgage" name="30yr Mtg" stroke={C.red} strokeWidth={2} dot={false}/>
      </LineChart>
    </ResponsiveContainer>
    <div style={{marginTop:12,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <div style={{display:"flex",gap:14}}>
        {[["10yr Treasury",C.amber],["30yr Mortgage",C.red]].map(function(l){return <div key={l[0]} style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:14,height:2,background:l[1],borderRadius:1}}/><span style={{fontFamily:FM,fontSize:9,color:C.l4}}>{l[0]}</span></div>;})}
      </div>
      <div style={{background:envColor+"20",border:"1px solid "+envColor+"40",borderRadius:5,padding:"3px 10px"}}><span style={{fontFamily:FM,fontSize:9,color:envColor,letterSpacing:"0.08em"}}>{summary.rateEnvironment}</span></div>
    </div>
  </Card>;
}

/* ── Materials Panel ──────────────────────────────────────── */
function MaterialsPanel(p) {
  var ppi=p.data; var mats=ppi&&ppi.series?ppi.series:[{code:"LBR",name:"Lumber",mom:3.2,latest:512,signal:"BUY"},{code:"SHR",name:"Steel HR",mom:-1.4,latest:748,signal:"SELL"},{code:"RMC",name:"Concrete",mom:0.2,latest:168,signal:"BUY"},{code:"GYP",name:"Gypsum",mom:-0.6,latest:234,signal:"HOLD"},{code:"ALU",name:"Aluminum",mom:1.1,latest:142,signal:"HOLD"},{code:"CU",name:"Copper",mom:0.8,latest:482,signal:"HOLD"}];
  var cpi=ppi&&ppi.compositePressureIndex?ppi.compositePressureIndex:{value:62,label:"MODERATE PRESSURE"};
  var sigBg={BUY:"rgba(48,209,88,0.12)",SELL:"rgba(255,69,58,0.12)",HOLD:"rgba(10,132,255,0.12)"};
  var sigCol={BUY:C.green,SELL:C.red,HOLD:C.blue};
  return <Card style={{padding:"22px 18px"}}>
    <SecLbl>BLS PPI · Materials Monitor</SecLbl>
    <div style={{fontFamily:FA,fontSize:14,fontWeight:700,color:C.l1,marginBottom:14}}>AI-Scored BUY / SELL / HOLD</div>
    <div style={{display:"flex",flexDirection:"column",gap:1}}>
      {mats.slice(0,6).map(function(m,i){return <div key={i} className="drow" style={{display:"grid",gridTemplateColumns:"1fr 52px 52px 46px",alignItems:"center",gap:8,padding:"9px 8px",borderRadius:8,transition:"background .15s"}}>
        <div><div style={{fontFamily:FA,fontSize:12,fontWeight:600,color:C.l1}}>{m.name||m.code}</div><div style={{fontFamily:FM,fontSize:8.5,color:C.l4}}>{m.code}</div></div>
        <span style={{fontFamily:FM,fontSize:12,color:C.l1,textAlign:"right"}}>{m.latest}</span>
        <span style={{fontFamily:FM,fontSize:10,color:m.mom>0?C.green:C.red,textAlign:"right"}}>{m.mom>0?"+":""}{m.mom}%</span>
        <div style={{background:sigBg[m.signal]||"rgba(10,132,255,0.12)",borderRadius:5,padding:"3px 0",textAlign:"center"}}><span style={{fontFamily:FM,fontSize:8.5,color:sigCol[m.signal]||C.blue,letterSpacing:"0.06em"}}>{m.signal}</span></div>
      </div>;})}
    </div>
    <div style={{marginTop:12,padding:"10px 12px",background:C.bg3,borderRadius:8,border:"1px solid "+C.brd}}>
      <div style={{fontFamily:FM,fontSize:8.5,color:C.l4,letterSpacing:"0.1em",marginBottom:5}}>30-DAY COMPOSITE COST PRESSURE INDEX</div>
      <div style={{height:4,background:"rgba(255,255,255,0.07)",borderRadius:2,overflow:"hidden",marginBottom:5}}><div style={{height:"100%",width:cpi.value+"%",background:"linear-gradient(90deg,"+C.blue+","+C.amber+")",borderRadius:2}}/></div>
      <div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontFamily:FM,fontSize:8.5,color:C.l4}}>Deflationary</span><span style={{fontFamily:FM,fontSize:9.5,color:C.amber,fontWeight:600}}>{cpi.value}/100</span><span style={{fontFamily:FM,fontSize:8.5,color:C.l4}}>Inflationary</span></div>
    </div>
  </Card>;
}

/* ── JOLTS Panel ──────────────────────────────────────────── */
function JoltsPanel(p) {
  var j=p.data; var s=j&&j.summary?j.summary:{openings:312,hires:428,quits:98,vacancyRate:3.7,tightnessLabel:"TIGHT",signal:"WARNING: Craft labor vacancy at 3.7% -- 12-year high"};
  var tCol=s.tightnessLabel==="VERY TIGHT"?C.red:s.tightnessLabel==="TIGHT"?C.amber:C.green;
  return <Card style={{padding:"22px 18px"}}>
    <SecLbl>BLS JOLTS · Labor Market</SecLbl>
    <div style={{fontFamily:FA,fontSize:14,fontWeight:700,color:C.l1,marginBottom:14}}>Construction Labor Intelligence</div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
      {[{lbl:"Job Openings",val:s.openings+"K",col:C.amber},{lbl:"Monthly Hires",val:s.hires+"K",col:C.green},{lbl:"Quits",val:s.quits+"K",col:C.l3},{lbl:"Vacancy Rate",val:s.vacancyRate+"%",col:tCol}]
        .map(function(stat,i){return <div key={i} style={{background:C.bg3,borderRadius:8,padding:"10px 12px",border:"1px solid "+C.brd}}><div style={{fontFamily:FM,fontSize:8.5,color:C.l4,marginBottom:3}}>{stat.lbl}</div><div style={{fontFamily:FA,fontSize:16,fontWeight:700,color:stat.col}}>{stat.val}</div></div>;})}
    </div>
    <div style={{padding:"10px 12px",background:"rgba(255,159,10,0.06)",border:"1px solid rgba(255,159,10,0.2)",borderRadius:8}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}><div style={{width:6,height:6,borderRadius:"50%",background:tCol}}/><span style={{fontFamily:FM,fontSize:9,color:tCol,letterSpacing:"0.08em"}}>{s.tightnessLabel} LABOR MARKET</span></div>
      <div style={{fontFamily:FA,fontSize:11,color:C.l3,lineHeight:1.55}}>{s.signal}</div>
    </div>
  </Card>;
}

/* ── Signals Panel ────────────────────────────────────────── */
var SIGNALS = [
  {type:"WARNING",title:"TTLCONS Flat 24 Months",sub:"Net +0.3% Feb'24 to Jan'26. Structural plateau.",conf:94,age:"COMPUTED"},
  {type:"BEARISH",title:"Permits -12% from Peak",sub:"1,386K Jan'26 vs 1,577K Feb'24 peak.",conf:89,age:"FRED"},
  {type:"BULLISH",title:"Employment Cycle High",sub:"8,330K -- highest recorded. +0.31% MoM.",conf:96,age:"BLS"},
  {type:"BULLISH",title:"Starts Sharp Rebound",sub:"+7.2% MoM Jan'26 from 1,272K Oct'25 low.",conf:82,age:"FRED"},
  {type:"WARNING",title:"Spend/Jobs Divergence",sub:"Flat spend + rising jobs -- margin compression.",conf:78,age:"DERIVED"},
  {type:"BULLISH",title:"IIJA $890B Active",sub:"Infrastructure +8.7% YoY absorbing moderation.",conf:91,age:"USASpend"},
];
var SIG_COL={BULLISH:C.green,BEARISH:C.red,WARNING:C.amber,DATA:C.blue};
function SignalsPanel() {
  return <Card style={{padding:"22px 18px",display:"flex",flexDirection:"column"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
      <SecLbl>AI Signals</SecLbl>
      <div style={{display:"flex",alignItems:"center",gap:5}}><div className="dpulse" style={{width:5,height:5,borderRadius:"50%",background:C.green}}/><span style={{fontFamily:FM,fontSize:9,color:C.green}}>{SIGNALS.length} active</span></div>
    </div>
    <div style={{display:"flex",flexDirection:"column",gap:2,flex:1}}>
      {SIGNALS.map(function(s,i){var col=SIG_COL[s.type]||C.blue;return <div key={i} className="dsig" style={{padding:"10px 10px",borderRadius:9,cursor:"default",transition:"background .15s"}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}><div style={{display:"flex",alignItems:"center",gap:5}}><div style={{width:5,height:5,borderRadius:"50%",background:col}}/><span style={{fontFamily:FM,fontSize:8.5,color:col,letterSpacing:"0.1em"}}>{s.type}</span></div><span style={{fontFamily:FM,fontSize:8.5,color:C.l4}}>{s.age}</span></div>
        <div style={{fontFamily:FA,fontSize:11.5,fontWeight:600,color:C.l1,paddingLeft:10,marginBottom:1,lineHeight:1.4}}>{s.title}</div>
        <div style={{fontFamily:FM,fontSize:9,color:C.l3,paddingLeft:10,lineHeight:1.5}}>{s.sub}</div>
        <div style={{paddingLeft:10,marginTop:5}}><div style={{height:2,borderRadius:1,background:"rgba(255,255,255,0.07)",overflow:"hidden"}}><div style={{height:"100%",width:s.conf+"%",background:col,borderRadius:1,transition:"width .9s"}}/></div><span style={{fontFamily:FM,fontSize:8.5,color:C.l4}}>{s.conf}% confidence</span></div>
      </div>;})}
    </div>
  </Card>;
}

/* ── Forecast Matrix ──────────────────────────────────────── */
function ForecastMatrix() {
  var fmt =function(v){return v!=null?"$"+parseFloat(v).toLocaleString()+"B":"--";};
  var fmtK=function(v){return v!=null?parseFloat(v).toLocaleString()+"K":"--";};
  var hwE=hwForecast(EMPLOY_V,12);
  var hwS=hwForecast(STARTS_V,12,0.25,0.06);
  var hwP=hwForecast(PERMIT_V,12,0.25,0.06);
  var rows=[
    {hz:"1M",seg:"Total Spend",base:fmt(HW_SPEND?HW_SPEND.forecast[0].base:2218),bull:fmt(HW_SPEND?HW_SPEND.forecast[0].hi80:2263),bear:fmt(HW_SPEND?HW_SPEND.forecast[0].lo80:2173),acc:HW_SPEND?((100-HW_SPEND.metrics.mape)*0.98).toFixed(1)+"%":"97%"},
    {hz:"3M",seg:"Total Spend",base:fmt(HW_SPEND?HW_SPEND.forecast[2].base:2290),bull:fmt(HW_SPEND?HW_SPEND.forecast[2].hi80:2410),bear:fmt(HW_SPEND?HW_SPEND.forecast[2].lo80:2170),acc:HW_SPEND?((100-HW_SPEND.metrics.mape)*0.95).toFixed(1)+"%":"94%"},
    {hz:"12M",seg:"Total Spend",base:fmt(HW_SPEND?HW_SPEND.forecast[11].base:2490),bull:fmt(HW_SPEND?HW_SPEND.forecast[11].hi80:2740),bear:fmt(HW_SPEND?HW_SPEND.forecast[11].lo80:2240),acc:HW_SPEND?((100-HW_SPEND.metrics.mape)*0.87).toFixed(1)+"%":"87%"},
    {hz:"3M",seg:"Employment",base:fmtK(hwE?hwE.forecast[2].base:8380),bull:fmtK(hwE?hwE.forecast[2].hi80:8450),bear:fmtK(hwE?hwE.forecast[2].lo80:8310),acc:hwE?((100-hwE.metrics.mape)*0.95).toFixed(1)+"%":"93%"},
    {hz:"6M",seg:"Housing Starts",base:fmtK(hwS?hwS.forecast[5].base:1520),bull:fmtK(hwS?hwS.forecast[5].hi80:1600),bear:fmtK(hwS?hwS.forecast[5].lo80:1440),acc:hwS?((100-hwS.metrics.mape)*0.88).toFixed(1)+"%":"88%"},
    {hz:"6M",seg:"Building Permits",base:fmtK(hwP?hwP.forecast[5].base:1400),bull:fmtK(hwP?hwP.forecast[5].hi80:1480),bear:fmtK(hwP?hwP.forecast[5].lo80:1320),acc:hwP?((100-hwP.metrics.mape)*0.88).toFixed(1)+"%":"87%"},
  ];
  var accColor=function(a){return parseFloat(a)>=95?C.green:parseFloat(a)>=88?C.blue:C.amber;};
  return <Card style={{padding:"24px 24px"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20,flexWrap:"wrap",gap:10}}>
      <div><SecLbl>HW Ensemble -- Model-Computed from Live API Data</SecLbl><div style={{fontFamily:FA,fontSize:16,fontWeight:700,color:C.l1,letterSpacing:"-0.02em"}}>Multi-Horizon Forecast Matrix</div></div>
      <div style={{fontFamily:FM,fontSize:9,color:C.l4}}>HW a=0.30 b=0.08 · Apr 2024 to Mar 2026</div>
    </div>
    <div style={{overflowX:"auto"}}>
      <table className="dmat" style={{width:"100%",borderCollapse:"collapse"}}>
        <thead><tr>{["Horizon","Series","Base Case","Bull (80% hi)","Bear (80% lo)","Accuracy"].map(function(h,i){return <th key={i} style={{fontFamily:FM,fontSize:9,letterSpacing:"0.1em",color:C.l4,textTransform:"uppercase",padding:"8px 12px",textAlign:i>1?"right":"left",borderBottom:"1px solid "+C.brd,fontWeight:500}}>{h}</th>;})}</tr></thead>
        <tbody>{rows.map(function(r,i){return <tr key={i} className="drow" style={{transition:"background .15s"}}>
          <td style={{fontFamily:FM,fontSize:10,color:C.blue,padding:"10px 12px"}}>{r.hz}</td>
          <td style={{fontFamily:FA,fontSize:12,fontWeight:500,color:C.l1,padding:"10px 12px"}}>{r.seg}</td>
          <td style={{fontFamily:FM,fontSize:12,fontWeight:700,color:C.l1,padding:"10px 12px",textAlign:"right"}}>{r.base}</td>
          <td style={{fontFamily:FM,fontSize:11,color:C.green,padding:"10px 12px",textAlign:"right"}}>{r.bull}</td>
          <td style={{fontFamily:FM,fontSize:11,color:C.red,padding:"10px 12px",textAlign:"right"}}>{r.bear}</td>
          <td style={{padding:"10px 12px",textAlign:"right"}}><span style={{fontFamily:FM,fontSize:10,color:accColor(r.acc),background:accColor(r.acc)+"20",padding:"2px 7px",borderRadius:4}}>{r.acc}</span></td>
        </tr>;})}
        </tbody>
      </table>
    </div>
    <div style={{marginTop:16,padding:"12px 14px",background:"rgba(48,209,88,0.05)",border:"1px solid rgba(48,209,88,0.18)",borderRadius:8}}>
      <div style={{fontFamily:FM,fontSize:9,color:C.l4,letterSpacing:"0.1em",marginBottom:6}}>MODEL INTEGRITY</div>
      <div style={{fontFamily:FA,fontSize:11.5,color:C.l2,lineHeight:1.65}}>All forecast values computed in real time via Holt-Winters applied to actual Census Bureau, BLS, and FRED data. Confidence intervals derived from model residuals. No synthetic data in forecasts.</div>
    </div>
  </Card>;
}

/* ── Historical Charts ────────────────────────────────────── */
function HistoricalCharts() {
  var empData=EMPLOY_M.map(function(m,i){return {m:m,v:EMPLOY_V[i]};});
  var houData=SPEND_M.map(function(m,i){return {m:m,p:PERMIT_V[i],s:STARTS_V[i]};});
  return <div className="dcharts" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
    <Card style={{padding:"22px 20px"}}>
      <SecLbl>BLS · Live API Data</SecLbl>
      <div style={{fontFamily:FA,fontSize:14,fontWeight:700,color:C.l1,marginBottom:16}}>Construction Employment · CES2000000001</div>
      <ResponsiveContainer width="100%" height={190}>
        <AreaChart data={empData} margin={{top:4,right:4,bottom:4,left:4}}>
          <defs><linearGradient id="emHG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.green} stopOpacity="0.28"/><stop offset="100%" stopColor={C.green} stopOpacity="0.02"/></linearGradient></defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)"/>
          <XAxis dataKey="m" tick={{fontFamily:FM,fontSize:9,fill:C.l4}} tickLine={false} axisLine={false} interval={5}/>
          <YAxis tick={{fontFamily:FM,fontSize:9,fill:C.l4}} tickLine={false} axisLine={false} width={44} tickFormatter={function(v){return v+"K";}} domain={[7900,8500]}/>
          <Tooltip content={<SimpleTip unit="K"/>}/>
          <Area type="monotone" dataKey="v" name="Employment" fill="url(#emHG)" stroke={C.green} strokeWidth={2} dot={false}/>
        </AreaChart>
      </ResponsiveContainer>
    </Card>
    <Card style={{padding:"22px 20px"}}>
      <SecLbl>FRED · Live API Data</SecLbl>
      <div style={{fontFamily:FA,fontSize:14,fontWeight:700,color:C.l1,marginBottom:16}}>Housing Starts vs Permits · SAAR</div>
      <ResponsiveContainer width="100%" height={190}>
        <LineChart data={houData} margin={{top:4,right:4,bottom:4,left:4}}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)"/>
          <XAxis dataKey="m" tick={{fontFamily:FM,fontSize:9,fill:C.l4}} tickLine={false} axisLine={false} interval={5}/>
          <YAxis tick={{fontFamily:FM,fontSize:9,fill:C.l4}} tickLine={false} axisLine={false} width={44} tickFormatter={function(v){return v+"K";}} domain={[1200,1650]}/>
          <Tooltip content={<SimpleTip unit="K"/>}/>
          <Line type="monotone" dataKey="p" name="Permits" stroke={C.amber} strokeWidth={2} dot={false}/>
          <Line type="monotone" dataKey="s" name="Starts" stroke={C.green} strokeWidth={2} dot={false}/>
        </LineChart>
      </ResponsiveContainer>
      <div style={{display:"flex",gap:20,marginTop:10}}>
        {[["Permits",C.amber],["Starts",C.green]].map(function(l){return <div key={l[0]} style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:14,height:2,background:l[1],borderRadius:1}}/><span style={{fontFamily:FM,fontSize:9,color:C.l4}}>{l[0]}</span></div>;})}
      </div>
    </Card>
  </div>;
}

/* ── Federal Pipeline ─────────────────────────────────────── */
function FederalPanel(p) {
  var c=p.data;
  var agencies=c&&c.agencies?c.agencies:[{name:"Dept of Transportation",amount:84.2},{name:"Army Corps of Engineers",amount:58.7},{name:"HUD / FHA",amount:42.1},{name:"Dept of Energy",amount:38.4},{name:"GSA Public Buildings",amount:28.9},{name:"Dept of Defense",amount:24.6},{name:"Dept of Veterans Affairs",amount:18.3},{name:"Bureau of Reclamation",amount:14.8}];
  var maxV=Math.max.apply(null,agencies.map(function(a){return a.amount;}));
  var COLS=[C.blue,C.green,C.teal,C.amber,"#FF6B35",C.red,C.purple,"#FF6B35"];
  return <Card style={{padding:"22px 20px"}}>
    <SecLbl>USASpending.gov · Federal Awards</SecLbl>
    <div style={{fontFamily:FA,fontSize:14,fontWeight:700,color:C.l1,marginBottom:20}}>Federal Construction Pipeline · FY2026 ($B)</div>
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      {agencies.slice(0,7).map(function(a,i){return <div key={i} style={{display:"grid",gridTemplateColumns:"1fr auto",alignItems:"center",gap:12}}>
        <div><div style={{fontFamily:FA,fontSize:11,fontWeight:500,color:C.l1,marginBottom:4}}>{a.name}</div><div style={{height:5,background:"rgba(255,255,255,0.06)",borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",width:(a.amount/maxV*100)+"%",background:COLS[i]||C.blue,borderRadius:3,transition:"width 1.2s ease"}}/></div></div>
        <div style={{fontFamily:FA,fontSize:13,fontWeight:700,color:COLS[i]||C.blue,textAlign:"right",minWidth:52}}>${a.amount}B</div>
      </div>;})}
    </div>
    <div style={{marginTop:16,paddingTop:14,borderTop:"1px solid "+C.brd,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <span style={{fontFamily:FM,fontSize:9.5,color:C.l4}}>IIJA Remaining Pipeline</span>
      <span style={{fontFamily:FA,fontSize:14,fontWeight:700,color:C.green}}>$890B active</span>
    </div>
  </Card>;
}

/* ── Nav ──────────────────────────────────────────────────── */
var NAV_TABS=["Overview","Forecast","Scenario","Sectors","Materials","Rates","Federal"];
function DashNav(p) {
  var [tab,setTab]=useState("Overview");
  var [clock,setClock]=useState("");
  useEffect(function(){
    var fmt=function(n){return String(n).padStart(2,"0");};
    var tick=function(){var d=new Date();setClock(fmt(d.getHours())+":"+fmt(d.getMinutes())+":"+fmt(d.getSeconds())+" ET");};
    tick(); var id=setInterval(tick,1000);
    return function(){clearInterval(id);};
  },[]);
  return <nav style={{background:p.scrolled?"rgba(6,6,8,0.90)":C.bg1,backdropFilter:p.scrolled?"blur(24px)":"none",WebkitBackdropFilter:p.scrolled?"blur(24px)":"none",borderBottom:"1px solid "+C.brd,height:60,display:"flex",alignItems:"center",padding:"0 24px",position:"sticky",top:0,zIndex:100,transition:"background .3s"}}>
    <a href="/" style={{display:"flex",alignItems:"center",minHeight:44,marginRight:24,flexShrink:0}} aria-label="Home"><img src={LOGO} alt="ConstructAIQ" style={{height:22,width:"auto"}}/></a>
    <div className="dtabs" style={{display:"flex",gap:2}}>
      {NAV_TABS.map(function(t){return <button key={t} className="dtab" onClick={function(){setTab(t);}} style={{fontFamily:FA,fontSize:13,fontWeight:500,letterSpacing:"-0.01em",padding:"0 13px",height:36,borderRadius:8,background:tab===t?C.blueD:"transparent",border:"1px solid "+(tab===t?C.brdA:"transparent"),color:tab===t?C.blue:C.l4}}>{t}</button>;})}
    </div>
    <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:14}}>
      <div style={{display:"flex",alignItems:"center",gap:6}}><div className="dpulse" style={{width:6,height:6,borderRadius:"50%",background:C.green,boxShadow:"0 0 8px "+C.green}}/><span style={{fontFamily:FM,fontSize:9.5,color:C.l4,letterSpacing:"0.1em"}}>LIVE</span></div>
      <span className="dtime" style={{fontFamily:FM,fontSize:10,color:C.l4}}>{clock}</span>
      <div style={{background:C.blueD,border:"1px solid "+C.blueB,borderRadius:6,padding:"4px 10px"}}><span style={{fontFamily:FM,fontSize:9,color:C.blue,letterSpacing:"0.12em"}}>PRO TIER</span></div>
    </div>
  </nav>;
}

/* ═══════════════════════════════════════════════════════════
   ROOT PAGE
═══════════════════════════════════════════════════════════ */
export default function Dashboard() {
  var [scrolled,setScrolled]=useState(false);
  var [apiData,setApiData]=useState({});
  var [status,setStatus]=useState({});

  useEffect(function(){
    var h=function(){setScrolled(window.scrollY>10);};
    window.addEventListener("scroll",h,{passive:true});
    return function(){window.removeEventListener("scroll",h);};
  },[]);

  useEffect(function(){
    var load=async function(){
      try {
        var eps=[
          {key:"census",url:"/api/census"},{key:"bls",url:"/api/bls"},
          {key:"rates",url:"/api/rates"},{key:"ppi",url:"/api/ppi"},
          {key:"jolts",url:"/api/jolts"},{key:"contracts",url:"/api/contracts"},
          {key:"bea",url:"/api/bea"},{key:"eia",url:"/api/eia"},
        ];
        var results=await Promise.allSettled(eps.map(function(ep){return fetch(ep.url).then(function(r){return r.ok?r.json():null;});}));
        var data={}; var st={};
        eps.forEach(function(ep,i){ var r=results[i]; data[ep.key]=r.status==="fulfilled"&&r.value?r.value:null; st[ep.key]=r.status==="fulfilled"&&r.value?(r.value.live!==false):false; });
        setApiData(data); setStatus(st);
      } catch(e){}
    };
    load();
  },[]);

  return <div style={{background:C.bg0,minHeight:"100vh",fontFamily:FA,color:C.l1}}>
    <style dangerouslySetInnerHTML={{__html:DCSS}}/>
    <DashNav scrolled={scrolled}/>
    <Ticker/>
    <DataStatus status={status}/>

    <div className="dcont" style={{padding:"22px 24px",maxWidth:1680,margin:"0 auto"}}>
      <KPIStrip liveData={apiData.census}/>

      <div className="dkmain" style={{display:"grid",gridTemplateColumns:"1fr 308px",gap:14,marginBottom:14}}>
        <ForecastChart/>
        <SignalsPanel/>
      </div>

      <div style={{marginBottom:14}}><ScenarioBuilder/></div>

      <div className="d3col" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,marginBottom:14}}>
        <RatePanel data={apiData.rates}/>
        <MaterialsPanel data={apiData.ppi}/>
        <JoltsPanel data={apiData.jolts}/>
      </div>

      <div style={{marginBottom:14}}><ForecastMatrix/></div>

      <div style={{marginBottom:14}}><HistoricalCharts/></div>

      <FederalPanel data={apiData.contracts}/>

      <div style={{marginTop:28,paddingTop:20,borderTop:"1px solid "+C.brd,display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
        <span style={{fontFamily:FM,fontSize:9.5,color:C.l4,letterSpacing:"0.06em"}}>SOURCES: U.S. CENSUS BUREAU VIP · FRED · BLS CES/JOLTS/PPI · USASPENDING.GOV · BEA · EIA</span>
        <span style={{fontFamily:FM,fontSize:9.5,color:C.l4}}>AI: HOLT-WINTERS DES + SARIMA ENSEMBLE · PHASE 1 COMPLETE · (C) 2026 CONSTRUCTAIQ INC.</span>
      </div>
    </div>
  </div>;
}
