import { useState, useEffect, useRef } from "react";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from "recharts";

// ── DESIGN TOKENS ──────────────────────────────────────────────────────────
const T = {
bg0: "#08080A",
bg1: "#0E0E11",
bg2: "#141417",
bg3: "#1C1C21",
bg4: "#242429",
border: "rgba(255,255,255,0.06)",
borderHi: "rgba(0,149,255,0.3)",
blue: "#0095FF",
blueLt: "#40B8FF",
blueDim: "rgba(0,149,255,0.12)",
blueGlow: "rgba(0,149,255,0.06)",
green: "#30D158",
greenDim: "rgba(48,209,88,0.12)",
red: "#FF453A",
redDim: "rgba(255,69,58,0.12)",
amber: "#FF9F0A",
purple: "#BF5AF2",
text0: "#F5F5F7",
text1: "#AEAEB2",
text2: "#636366",
text3: "#3A3A3C",
};

// ── SYNTHETIC DATA ──────────────────────────────────────────────────────────
const months = ["Feb '24","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec","Jan '25","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec","Jan '26","Feb","Mar"];

function genSpend(base, variance) {
return months.map((m, i) => {
const trend = i * 1.8;
const seasonal = Math.sin((i / 12) * 2 * Math.PI) * variance * 0.4;
const noise = (Math.random() - 0.5) * variance;
return { month: m, value: Math.round(base + trend + seasonal + noise) };
});
}

const spendData = genSpend(2050, 60).map((d, i) => ({
…d,
forecast: i >= 22 ? d.value + Math.round((i - 22) * 4.2) : null,
upper95: i >= 22 ? d.value + Math.round((i - 22) * 4.2) + Math.round((i - 22) * 8) : null,
lower95: i >= 22 ? d.value + Math.round((i - 22) * 4.2) - Math.round((i - 22) * 7) : null,
upper80: i >= 22 ? d.value + Math.round((i - 22) * 4.2) + Math.round((i - 22) * 4) : null,
lower80: i >= 22 ? d.value + Math.round((i - 22) * 4.2) - Math.round((i - 22) * 3.5) : null,
}));

const permitData = months.map((m, i) => ({
month: m,
starts: Math.round(1350 + Math.sin(i / 3.5) * 90 + i * 1.1 + (Math.random() - 0.5) * 40),
permits: Math.round(1420 + Math.sin(i / 3.2) * 80 + i * 0.9 + (Math.random() - 0.5) * 35),
}));

const employData = months.map((m, i) => ({
month: m,
value: Math.round(8100 + i * 8.8 + Math.sin(i / 4) * 45 + (Math.random() - 0.5) * 20),
}));

const materialData = [
{ name: "Lumber", ticker: "LBR", value: 512, chg: +3.2, chg30: +8.1, signal: "BUY" },
{ name: "Steel HR", ticker: "SHR", value: 748, chg: -1.4, chg30: -3.7, signal: "SELL" },
{ name: "Copper", ticker: "CU", value: 4.82, chg: +0.8, chg30: +5.2, signal: "HOLD" },
{ name: "Concrete", ticker: "RMC", value: 168, chg: +0.2, chg30: +2.1, signal: "BUY" },
{ name: "Gypsum", ticker: "GYP", value: 234, chg: -0.6, chg30: -1.8, signal: "HOLD" },
{ name: "Rebar", ticker: "RBR", value: 680, chg: -2.1, chg30: -6.2, signal: "SELL" },
];

const sectorHeat = [
{ sector: "Residential", spend: 945, mom: +2.1, yoy: +4.3, heat: 0.72 },
{ sector: "Commercial", spend: 412, mom: -0.8, yoy: +1.2, heat: 0.41 },
{ sector: "Infrastructure", spend: 398, mom: +3.4, yoy: +8.7, heat: 0.88 },
{ sector: "Industrial", spend: 187, mom: +1.1, yoy: +3.9, heat: 0.61 },
{ sector: "Healthcare", spend: 134, mom: -1.2, yoy: -0.4, heat: 0.29 },
{ sector: "Education", spend: 98, mom: +0.4, yoy: +1.8, heat: 0.45 },
{ sector: "Energy", spend: 312, mom: +5.2, yoy: +14.2, heat: 0.95 },
{ sector: "Transportation", spend: 276, mom: +2.8, yoy: +9.1, heat: 0.81 },
];

const regionData = [
{ region: "South", score: 94, permits: 312, spend: 618, employ: 2840, trend: "↑" },
{ region: "Mountain West", score: 88, permits: 187, spend: 289, employ: 1240, trend: "↑" },
{ region: "Mid-Atlantic", score: 71, permits: 143, spend: 412, employ: 1890, trend: "→" },
{ region: "Southeast", score: 83, permits: 224, spend: 378, employ: 1620, trend: "↑" },
{ region: "Midwest", score: 62, permits: 118, spend: 287, employ: 1340, trend: "→" },
{ region: "Pacific", score: 79, permits: 198, spend: 498, employ: 2180, trend: "↓" },
{ region: "Northeast", score: 58, permits: 89, spend: 312, employ: 1410, trend: "↓" },
{ region: "Southwest", score: 86, permits: 201, spend: 334, employ: 1580, trend: "↑" },
];

const signals = [
{ type: "BULLISH", label: "Infrastructure Surge", detail: "IIJA funds accelerating Q2–Q3", time: "2m ago", conf: 94 },
{ type: "WARNING", label: "Labor Shortage Signal", detail: "Craft unemployment 2.8% — 12-yr low", time: "8m ago", conf: 87 },
{ type: "BULLISH", label: "Energy Build Expansion", detail: "Grid hardening projects up 34% YoY", time: "15m ago", conf: 91 },
{ type: "BEARISH", label: "Multifamily Correction", detail: "Permit pullback accelerating in SunBelt", time: "31m ago", conf: 78 },
{ type: "DATA", label: "BLS Release", detail: "Construction +18,400 jobs — March 2026", time: "1h ago", conf: 100 },
{ type: "WARNING", label: "Steel Cost Pressure", detail: "HRC futures up 7.2% in 30 days", time: "2h ago", conf: 82 },
];

const forecastTable = [
{ horizon: "1 Month", sector: "Total Construction", base: 2218, bull: 2285, bear: 2151, conf: "HIGH", accuracy: "97.2%" },
{ horizon: "3 Months", sector: "Total Construction", base: 2290, bull: 2410, bear: 2140, conf: "HIGH", accuracy: "94.8%" },
{ horizon: "6 Months", sector: "Total Construction", base: 2380, bull: 2560, bear: 2180, conf: "MED", accuracy: "91.3%" },
{ horizon: "12 Months", sector: "Total Construction", base: 2490, bull: 2740, bear: 2210, conf: "MED", accuracy: "87.6%" },
{ horizon: "3 Months", sector: "Residential", base: 962, bull: 1040, bear: 890, conf: "HIGH", accuracy: "93.1%" },
{ horizon: "3 Months", sector: "Infrastructure", base: 418, bull: 465, bear: 388, conf: "HIGH", accuracy: "95.4%" },
];

// ── MINI SPARKLINE ─────────────────────────────────────────────────────────
function Spark({ data, color = T.blue, positive = true }) {
const w = 80, h = 28;
const vals = data.map(d => d.value || d.starts || d);
const min = Math.min(…vals), max = Math.max(…vals);
const pts = vals.map((v, i) => {
const x = (i / (vals.length - 1)) * w;
const y = h - ((v - min) / (max - min || 1)) * h;
return `${x},${y}`;
}).join(" ");
const fill = pts + ` ${w},${h} 0,${h}`;
return (
<svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
<defs>
<linearGradient id={`sg-${color}`} x1="0" y1="0" x2="0" y2="1">
<stop offset="0%" stopColor={color} stopOpacity="0.3" />
<stop offset="100%" stopColor={color} stopOpacity="0" />
</linearGradient>
</defs>
<polygon points={fill} fill={`url(#sg-${color})`} />
<polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
</svg>
);
}

// ── CUSTOM TOOLTIP ─────────────────────────────────────────────────────────
function BloomTooltip({ active, payload, label }) {
if (!active || !payload?.length) return null;
return (
<div style={{ background: T.bg3, border: `1px solid ${T.border}`, padding: "10px 14px", borderRadius: 4, minWidth: 160 }}>
<div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: T.text2, letterSpacing: "0.1em", marginBottom: 6 }}>{label}</div>
{payload.map((p, i) => p.value != null && (
<div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 16, marginBottom: 2 }}>
<span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: p.stroke || p.fill || T.text1 }}>{p.name}</span>
<span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: T.text0, fontWeight: 600 }}>{p.value?.toLocaleString()}</span>
</div>
))}
</div>
);
}

// ── HEAT COLOR ─────────────────────────────────────────────────────────────
function heatColor(v) {
if (v > 0.85) return "#30D158";
if (v > 0.65) return "#0095FF";
if (v > 0.45) return "#FF9F0A";
if (v > 0.25) return "#FF6B35";
return "#FF453A";
}

function signalColor(t) {
if (t === "BULLISH") return T.green;
if (t === "BEARISH") return T.red;
if (t === "WARNING") return T.amber;
return T.blue;
}

// ── TICKER ─────────────────────────────────────────────────────────────────
function Ticker() {
const items = [
"TTLCONS $2,190B ▲0.42%", "HOUST 1,487K ▲7.22%", "PERMIT 1,386K ▼0.87%",
"EMPLOY 8,330K ▲0.31%", "LBR $512 ▲3.2%", "SHR $748 ▼1.4%", "CU $4.82 ▲0.8%",
"TLRESCONS $945B ▼0.74%", "10YR 4.32% ▼2bp", "PPI CONST +4.1% YoY",
"JOLTS CONST 312K", "AGC BCI 58.4 ▲", "INFRA PIPELINE $890B",
];
return (
<div style={{ background: T.bg1, borderBottom: `1px solid ${T.border}`, height: 32, display: "flex", alignItems: "center", overflow: "hidden", position: "relative" }}>
<div style={{ position: "absolute", left: 0, width: 80, height: "100%", background: `linear-gradient(to right, ${T.bg1}, transparent)`, zIndex: 2 }} />
<div style={{ position: "absolute", right: 0, width: 80, height: "100%", background: `linear-gradient(to left, ${T.bg1}, transparent)`, zIndex: 2 }} />
<div style={{ display: "flex", gap: 40, animation: "tickerScroll 60s linear infinite", whiteSpace: "nowrap", paddingLeft: 40 }}>
{[…items, …items].map((item, i) => {
const up = item.includes("▲");
const down = item.includes("▼");
return (
<span key={i} style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.06em", color: up ? T.green : down ? T.red : T.text1 }}>
{item}
</span>
);
})}
</div>
</div>
);
}

// ── STAT CARD ─────────────────────────────────────────────────────────────
function StatCard({ label, value, unit, chg, chgLabel, sparkData, delay = 0 }) {
const pos = chg >= 0;
return (
<div style={{ background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 6, padding: "16px 18px", display: "flex", flexDirection: "column", gap: 4, opacity: 0, animation: `fadeUp 0.5s ease ${delay}s forwards` }}>
<div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.15em", color: T.text2, textTransform: "uppercase" }}>{label}</div>
<div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
<span style={{ fontFamily: "'Syne', sans-serif", fontSize: 26, fontWeight: 700, color: T.text0, letterSpacing: "-0.02em" }}>{value}</span>
<span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: T.text2 }}>{unit}</span>
</div>
<div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 4 }}>
<div>
<span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: pos ? T.green : T.red, fontWeight: 600 }}>
{pos ? "▲" : "▼"} {Math.abs(chg)}%
</span>
<span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: T.text3, marginLeft: 4 }}>{chgLabel}</span>
</div>
<Spark data={sparkData} color={pos ? T.green : T.red} />
</div>
</div>
);
}

// ── MAIN DASHBOARD ─────────────────────────────────────────────────────────
export default function ConstructAIQTerminal() {
const [activeTab, setActiveTab] = useState("overview");
const [activeModel, setActiveModel] = useState("spend");
const [time, setTime] = useState(new Date());

useEffect(() => {
const t = setInterval(() => setTime(new Date()), 1000);
return () => clearInterval(t);
}, []);

const tabs = [
{ id: "overview", label: "Overview" },
{ id: "forecast", label: "AI Forecast" },
{ id: "sectors", label: "Sectors" },
{ id: "regional", label: "Regional" },
{ id: "materials", label: "Materials" },
];

return (
<div style={{ background: T.bg0, minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", color: T.text0 }}>
<style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap'); @keyframes tickerScroll { from { transform: translateX(0); } to { transform: translateX(-50%); } } @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } } @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } } @keyframes scanline { 0% { top: -2px; } 100% { top: 100%; } } * { box-sizing: border-box; margin: 0; padding: 0; scrollbar-width: thin; scrollbar-color: #2C2C2E transparent; } ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: #2C2C2E; border-radius: 2px; } .tab-btn { background: transparent; border: none; cursor: pointer; font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 500; letter-spacing: 0.04em; padding: 6px 14px; border-radius: 4px; transition: all 0.15s; } .tab-active { background: rgba(0,149,255,0.15); color: #0095FF; } .tab-inactive { color: #636366; } .tab-inactive:hover { color: #AEAEB2; background: rgba(255,255,255,0.04); } .row-hover:hover { background: rgba(255,255,255,0.03) !important; } .signal-row:hover { background: rgba(0,149,255,0.04) !important; cursor: default; }`}</style>

```
  {/* TOP NAV */}
  <nav style={{ background: T.bg1, borderBottom: `1px solid ${T.border}`, height: 52, display: "flex", alignItems: "center", padding: "0 24px", gap: 0, position: "sticky", top: 0, zIndex: 100 }}>
    <div style={{ display: "flex", alignItems: "baseline", gap: 2, marginRight: 32 }}>
      <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800, color: T.text0, letterSpacing: "-0.01em" }}>CONSTRUCT</span>
      <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800, color: T.blue, letterSpacing: "-0.01em" }}>AIQ</span>
      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: T.text3, marginLeft: 6, letterSpacing: "0.12em" }}>TERMINAL</span>
    </div>

    <div style={{ display: "flex", gap: 2 }}>
      {tabs.map(t => (
        <button key={t.id} className={`tab-btn ${activeTab === t.id ? "tab-active" : "tab-inactive"}`} onClick={() => setActiveTab(t.id)}>
          {t.label}
        </button>
      ))}
    </div>

    <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: T.green, animation: "pulse 2s infinite" }} />
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: T.text2, letterSpacing: "0.1em" }}>LIVE</span>
      </div>
      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: T.text3, letterSpacing: "0.06em" }}>
        {time.toLocaleTimeString("en-US", { hour12: false })} ET
      </span>
      <div style={{ background: T.blueDim, border: `1px solid ${T.borderHi}`, borderRadius: 4, padding: "4px 10px" }}>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: T.blue, letterSpacing: "0.12em" }}>PRO TIER</span>
      </div>
    </div>
  </nav>

  {/* MARKET TICKER */}
  <Ticker />

  {/* MAIN CONTENT */}
  <div style={{ padding: "20px 24px", maxWidth: 1600, margin: "0 auto" }}>

    {/* KPI ROW */}
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
      <StatCard label="Total Construction Spend" value="$2,190" unit="B SAAR" chg={0.42} chgLabel="MoM" sparkData={spendData.slice(-12)} delay={0} />
      <StatCard label="Construction Employment" value="8,330" unit="K SA" chg={0.31} chgLabel="MoM" sparkData={employData.slice(-12)} delay={0.05} />
      <StatCard label="Housing Starts" value="1,487" unit="K SAAR" chg={7.22} chgLabel="MoM" sparkData={permitData.slice(-12)} delay={0.1} />
      <StatCard label="Building Permits" value="1,386" unit="K SAAR" chg={-0.87} chgLabel="MoM" sparkData={permitData.slice(-12).map(d => ({ value: d.permits }))} delay={0.15} />
    </div>

    {/* MAIN CHART + SIGNALS */}
    <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 12, marginBottom: 12 }}>

      {/* AI FORECAST CHART */}
      <div style={{ background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 6, padding: "20px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.18em", color: T.blue, textTransform: "uppercase" }}>AI · Predictive Model v2.4</span>
              <div style={{ background: T.blueDim, borderRadius: 2, padding: "2px 6px" }}>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: T.blue }}>94.8% ACC</span>
              </div>
            </div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 700, color: T.text0, letterSpacing: "-0.01em" }}>
              Total Construction Spending — 24-Month Rolling + Forecast
            </div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: T.text2, marginTop: 2 }}>TTLCONS · Census Bureau VIP · SAAR · $Billions</div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {["spend", "permits", "employ"].map(m => (
              <button key={m} onClick={() => setActiveModel(m)} style={{ background: activeModel === m ? T.blueDim : "transparent", border: `1px solid ${activeModel === m ? T.borderHi : T.border}`, borderRadius: 4, padding: "4px 10px", cursor: "pointer", fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.1em", color: activeModel === m ? T.blue : T.text2, textTransform: "uppercase" }}>
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* LEGEND */}
        <div style={{ display: "flex", gap: 20, marginBottom: 14, paddingLeft: 4 }}>
          {[
            { color: T.blue, label: "Historical", dash: false },
            { color: "#40B8FF", label: "AI Forecast", dash: true },
            { color: "rgba(0,149,255,0.3)", label: "80% Confidence", dash: false, fill: true },
            { color: "rgba(0,149,255,0.12)", label: "95% Confidence", dash: false, fill: true },
          ].map((l, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: l.fill ? 10 : 20, height: l.fill ? 10 : 2, background: l.color, borderRadius: l.fill ? 2 : 0, border: l.dash ? "1px dashed #40B8FF" : "none" }} />
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: T.text2, letterSpacing: "0.08em" }}>{l.label}</span>
            </div>
          ))}
        </div>

        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={activeModel === "spend" ? spendData : activeModel === "permits" ? permitData.map((d, i) => ({ ...d, value: d.starts, month: d.month })) : employData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="histGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={T.blue} stopOpacity={0.15} />
                <stop offset="100%" stopColor={T.blue} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="foreGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#40B8FF" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#40B8FF" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="month" tick={{ fontFamily: "'DM Mono', monospace", fontSize: 9, fill: T.text3 }} tickLine={false} axisLine={false} interval={3} />
            <YAxis tick={{ fontFamily: "'DM Mono', monospace", fontSize: 9, fill: T.text3 }} tickLine={false} axisLine={false} width={48} tickFormatter={v => v.toLocaleString()} />
            <Tooltip content={<BloomTooltip />} />
            <ReferenceLine x="Jan '26" stroke="rgba(255,255,255,0.1)" strokeDasharray="4 4" label={{ value: "FORECAST →", position: "insideTopRight", fill: T.text3, fontFamily: "'DM Mono', monospace", fontSize: 8 }} />

            {/* 95% band */}
            {activeModel === "spend" && <Area type="monotone" dataKey="upper95" stroke="none" fill="rgba(0,149,255,0.06)" />}
            {activeModel === "spend" && <Area type="monotone" dataKey="lower95" stroke="none" fill={T.bg2} />}
            {/* 80% band */}
            {activeModel === "spend" && <Area type="monotone" dataKey="upper80" stroke="none" fill="rgba(0,149,255,0.12)" />}
            {activeModel === "spend" && <Area type="monotone" dataKey="lower80" stroke="none" fill={T.bg2} />}

            <Area type="monotone" dataKey="value" stroke={T.blue} strokeWidth={2} fill="url(#histGrad)" dot={false} name="Historical" />
            {activeModel === "spend" && <Area type="monotone" dataKey="forecast" stroke="#40B8FF" strokeWidth={2} strokeDasharray="6 3" fill="url(#foreGrad)" dot={false} name="Forecast" connectNulls />}
          </AreaChart>
        </ResponsiveContainer>

        {/* AI INSIGHT BAR */}
        <div style={{ marginTop: 16, padding: "12px 14px", background: T.blueGlow, border: `1px solid ${T.borderHi}`, borderRadius: 4, display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: T.blue, flexShrink: 0 }} />
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: T.blueLt, letterSpacing: "0.06em" }}>
            AI MODEL: 12-month forecast projects TTLCONS reaching <strong>$2,490B</strong> by Jan 2027 (base case) · Infrastructure subsector primary driver · Labor constraints represent primary downside risk · Confidence interval widening post-Q3 2026
          </span>
        </div>
      </div>

      {/* SIGNAL PANEL */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 6, padding: "16px 18px", flex: 1, overflow: "hidden" }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.15em", color: T.text2, textTransform: "uppercase", marginBottom: 12, display: "flex", justifyContent: "space-between" }}>
            <span>AI Signals</span>
            <span style={{ color: T.blue }}>{signals.length} active</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {signals.map((s, i) => (
              <div key={i} className="signal-row" style={{ padding: "9px 10px", borderRadius: 4, background: "transparent", transition: "background 0.15s" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 4, height: 4, borderRadius: "50%", background: signalColor(s.type), flexShrink: 0 }} />
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, letterSpacing: "0.1em", color: signalColor(s.type) }}>{s.type}</span>
                  </div>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: T.text3 }}>{s.time}</span>
                </div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 500, color: T.text0, marginBottom: 1, paddingLeft: 10 }}>{s.label}</div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: T.text2, paddingLeft: 10, lineHeight: 1.4 }}>{s.detail}</div>
                <div style={{ paddingLeft: 10, marginTop: 4 }}>
                  <div style={{ height: 2, borderRadius: 1, background: T.bg4, width: "100%", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${s.conf}%`, background: signalColor(s.type), borderRadius: 1 }} />
                  </div>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: T.text3 }}>{s.conf}% conf</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>

    {/* SECTOR HEAT MAP + REGIONAL + MATERIALS */}
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>

      {/* SECTOR HEAT MAP */}
      <div style={{ background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 6, padding: "16px 18px" }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.15em", color: T.text2, textTransform: "uppercase", marginBottom: 14 }}>Sector Heat Map · Construction Spend $B</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
          {sectorHeat.map((s, i) => (
            <div key={i} style={{ background: T.bg3, borderRadius: 4, padding: "10px 12px", border: `1px solid ${T.border}`, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, width: `${s.heat * 100}%`, height: 2, background: heatColor(s.heat), borderRadius: "2px 0 0 0" }} />
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, fontWeight: 600, color: T.text0, marginBottom: 2 }}>{s.sector}</div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 700, color: heatColor(s.heat) }}>${s.spend}B</div>
              <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: s.mom >= 0 ? T.green : T.red }}>{s.mom >= 0 ? "▲" : "▼"}{Math.abs(s.mom)}% MoM</span>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: s.yoy >= 0 ? T.green : T.red }}>{s.yoy >= 0 ? "+" : ""}{s.yoy}% YoY</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* REGIONAL RANKINGS */}
      <div style={{ background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 6, padding: "16px 18px" }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.15em", color: T.text2, textTransform: "uppercase", marginBottom: 14 }}>Regional Market Score · 100pt Index</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {regionData.sort((a, b) => b.score - a.score).map((r, i) => (
            <div key={i} className="row-hover" style={{ display: "grid", gridTemplateColumns: "24px 1fr 44px 60px", alignItems: "center", gap: 8, padding: "7px 8px", borderRadius: 4, transition: "background 0.15s" }}>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: T.text3 }}>#{i + 1}</span>
              <div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 500, color: T.text0 }}>{r.region}</div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: T.text3 }}>${r.spend}B · {r.employ.toLocaleString()}K jobs</div>
              </div>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: r.trend === "↑" ? T.green : r.trend === "↓" ? T.red : T.amber }}>{r.trend}</span>
              <div>
                <div style={{ height: 3, background: T.bg4, borderRadius: 2, overflow: "hidden", marginBottom: 2 }}>
                  <div style={{ height: "100%", width: `${r.score}%`, background: r.score > 80 ? T.blue : r.score > 60 ? T.amber : T.red, borderRadius: 2 }} />
                </div>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: T.text0, fontWeight: 600 }}>{r.score}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MATERIALS PRICING */}
      <div style={{ background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 6, padding: "16px 18px" }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.15em", color: T.text2, textTransform: "uppercase", marginBottom: 14 }}>Materials Cost Monitor · AI-Scored</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {materialData.map((m, i) => (
            <div key={i} className="row-hover" style={{ display: "grid", gridTemplateColumns: "1fr 50px 44px 44px", alignItems: "center", gap: 8, padding: "8px 8px", borderRadius: 4, transition: "background 0.15s" }}>
              <div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 500, color: T.text0 }}>{m.name}</div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: T.text3 }}>{m.ticker}</div>
              </div>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: T.text0, textAlign: "right" }}>{m.value}</span>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: m.chg >= 0 ? T.green : T.red, textAlign: "right" }}>{m.chg >= 0 ? "+" : ""}{m.chg}%</span>
              <div style={{ background: m.signal === "BUY" ? T.greenDim : m.signal === "SELL" ? T.redDim : T.blueDim, borderRadius: 2, padding: "2px 5px", textAlign: "center" }}>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: m.signal === "BUY" ? T.green : m.signal === "SELL" ? T.red : T.blue, letterSpacing: "0.06em" }}>{m.signal}</span>
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 12, padding: "8px 10px", background: T.bg3, borderRadius: 4, border: `1px solid ${T.border}` }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: T.text3, letterSpacing: "0.1em", marginBottom: 4 }}>30-DAY COMPOSITE PRESSURE INDEX</div>
          <div style={{ height: 4, background: T.bg4, borderRadius: 2, overflow: "hidden" }}>
            <div style={{ height: "100%", width: "62%", background: `linear-gradient(to right, ${T.blue}, ${T.amber})`, borderRadius: 2 }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: T.text3 }}>Deflationary</span>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: T.amber, fontWeight: 600 }}>62 / 100 — MODERATE PRESSURE</span>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: T.text3 }}>Inflationary</span>
          </div>
        </div>
      </div>
    </div>

    {/* FORECAST TABLE */}
    <div style={{ background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 6, padding: "16px 18px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.15em", color: T.blue, textTransform: "uppercase", marginBottom: 2 }}>AI · Predictive Scenario Analysis</div>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 700, color: T.text0 }}>Multi-Horizon Forecast Matrix · $Billions SAAR</div>
        </div>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: T.text3 }}>Model: Prophet + XGBoost Ensemble · Trained 2004–2026</div>
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            {["Horizon", "Segment", "Base Case", "Bull Case", "Bear Case", "Confidence", "Hist. Accuracy"].map(h => (
              <th key={h} style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.1em", color: T.text2, textTransform: "uppercase", padding: "6px 12px", textAlign: h === "Horizon" || h === "Segment" ? "left" : "right", borderBottom: `1px solid ${T.border}` }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {forecastTable.map((row, i) => (
            <tr key={i} className="row-hover" style={{ background: "transparent", transition: "background 0.15s" }}>
              <td style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: T.blue, padding: "9px 12px" }}>{row.horizon}</td>
              <td style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: T.text0, padding: "9px 12px", fontWeight: 500 }}>{row.sector}</td>
              <td style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: T.text0, padding: "9px 12px", textAlign: "right", fontWeight: 600 }}>${row.base.toLocaleString()}B</td>
              <td style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: T.green, padding: "9px 12px", textAlign: "right" }}>${row.bull.toLocaleString()}B</td>
              <td style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: T.red, padding: "9px 12px", textAlign: "right" }}>${row.bear.toLocaleString()}B</td>
              <td style={{ padding: "9px 12px", textAlign: "right" }}>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, background: row.conf === "HIGH" ? T.greenDim : T.blueDim, color: row.conf === "HIGH" ? T.green : T.blue, padding: "2px 7px", borderRadius: 2, letterSpacing: "0.06em" }}>{row.conf}</span>
              </td>
              <td style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: T.text1, padding: "9px 12px", textAlign: "right" }}>{row.accuracy}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* BOTTOM AI ANNOTATION */}
      <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
        {[
          { label: "PRIMARY DRIVER", value: "IIJA Infrastructure Pipeline", color: T.blue },
          { label: "PRIMARY RISK", value: "Craft Labor Shortage + Material Cost Pressure", color: T.amber },
          { label: "MODEL LAST TRAINED", value: "April 18, 2026 · 847K data points", color: T.text2 },
        ].map((a, i) => (
          <div key={i} style={{ padding: "8px 12px", background: T.bg3, borderRadius: 4, border: `1px solid ${T.border}` }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: T.text3, letterSpacing: "0.12em", marginBottom: 3 }}>{a.label}</div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: a.color, fontWeight: 500 }}>{a.value}</div>
          </div>
        ))}
      </div>
    </div>

    {/* EMPLOYMENT + PERMITS DUAL CHART */}
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
      <div style={{ background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 6, padding: "16px 18px" }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.15em", color: T.text2, textTransform: "uppercase", marginBottom: 4 }}>BLS · Construction Employment</div>
        <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 700, color: T.text0, marginBottom: 14 }}>CES2000000001 · SA · Thousands</div>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={employData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="empGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={T.green} stopOpacity={0.2} />
                <stop offset="100%" stopColor={T.green} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="month" tick={{ fontFamily: "'DM Mono', monospace", fontSize: 8, fill: T.text3 }} tickLine={false} axisLine={false} interval={5} />
            <YAxis tick={{ fontFamily: "'DM Mono', monospace", fontSize: 8, fill: T.text3 }} tickLine={false} axisLine={false} width={42} domain={["auto", "auto"]} />
            <Tooltip content={<BloomTooltip />} />
            <Area type="monotone" dataKey="value" stroke={T.green} strokeWidth={2} fill="url(#empGrad)" dot={false} name="Employment (K)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div style={{ background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 6, padding: "16px 18px" }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.15em", color: T.text2, textTransform: "uppercase", marginBottom: 4 }}>FRED · Housing Starts vs Building Permits</div>
        <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 700, color: T.text0, marginBottom: 14 }}>HOUST + PERMIT · SAAR · Thousands</div>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={permitData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="month" tick={{ fontFamily: "'DM Mono', monospace", fontSize: 8, fill: T.text3 }} tickLine={false} axisLine={false} interval={5} />
            <YAxis tick={{ fontFamily: "'DM Mono', monospace", fontSize: 8, fill: T.text3 }} tickLine={false} axisLine={false} width={42} domain={["auto", "auto"]} />
            <Tooltip content={<BloomTooltip />} />
            <Line type="monotone" dataKey="starts" stroke={T.blue} strokeWidth={2} dot={false} name="Starts (K)" />
            <Line type="monotone" dataKey="permits" stroke={T.amber} strokeWidth={2} strokeDasharray="5 3" dot={false} name="Permits (K)" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>

    {/* FOOTER */}
    <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: T.text3, letterSpacing: "0.1em" }}>SOURCES: U.S. CENSUS BUREAU · FEDERAL RESERVE FRED · BUREAU OF LABOR STATISTICS · BLS PPI · USASPENDING.GOV</span>
      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: T.text3, letterSpacing: "0.06em" }}>ALL DATA SEASONALLY ADJUSTED · REFRESHED EVERY 4 HOURS · © 2026 CONSTRUCTAIQ INC.</span>
    </div>
  </div>
</div>
```

);
}
