"use client";
import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

/* ── Brand tokens ─────────────────────────────────────────── */
const C = {
  bg: "#0D0F0E",
  surface: "#111310",
  card: "#131510",
  border: "#1E201C",
  borderLight: "#242620",
  gold: "#C8A96E",
  goldDim: "#A88A52",
  teal: "#5C9E8A",
  cream: "#E8E4DC",
  muted: "#6A6660",
  faint: "#3A3830",
  white: "#F5F2EC",
};
const bebas: React.CSSProperties = { fontFamily: "'Bebas Neue', sans-serif" };
const dm: React.CSSProperties = { fontFamily: "'DM Sans', sans-serif" };
const mono: React.CSSProperties = { fontFamily: "'IBM Plex Mono', monospace" };

/* ── Types ────────────────────────────────────────────────── */
interface DataPoint { date: string; value: number }
interface CensusData { totalSpending: DataPoint[]; residentialSpending: DataPoint[] }
interface FredData { housingStarts: DataPoint[]; buildingPermits: DataPoint[] }
interface BlsData { employment: DataPoint[] }

/* ── Shared chart config ──────────────────────────────────── */
const GRID_PROPS = {
  stroke: C.border,
  strokeDasharray: "3 3",
  vertical: false,
};
// Plain object — not React.CSSProperties — so it's assignable to SVGProps<SVGTextElement>
const AXIS_STYLE = {
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: 10,
  fill: C.muted,
  letterSpacing: "0.05em",
};

function fmtMonth(d: string) {
  const [y, m] = d.split("-");
  const abbr = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${abbr[parseInt(m) - 1]} '${y.slice(2)}`;
}

/* ── Custom Tooltip ───────────────────────────────────────── */
function BrandTooltip({ active, payload, label, unit }: {
  active?: boolean; payload?: { name: string; value: number; color: string }[];
  label?: string; unit?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: C.card, border: `1px solid ${C.border}`, borderRadius: "2px",
      padding: "12px 16px", ...mono,
    }}>
      <div style={{ fontSize: "11px", color: C.gold, letterSpacing: "0.1em", marginBottom: "8px" }}>
        {label ? fmtMonth(label) : ""}
      </div>
      {payload.map((p) => (
        <div key={p.name} style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "4px" }}>
          <span style={{ width: "8px", height: "8px", background: p.color, borderRadius: "50%", flexShrink: 0 }} />
          <span style={{ fontSize: "11px", color: C.muted, minWidth: "130px" }}>{p.name}</span>
          <span style={{ fontSize: "12px", color: C.cream, fontWeight: 600 }}>
            {p.value.toLocaleString()}{unit ?? ""}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ── Card wrapper ─────────────────────────────────────────── */
function ChartCard({ title, subtitle, tag, children, span }: {
  title: string; subtitle: string; tag: string;
  children: React.ReactNode; span?: boolean;
}) {
  return (
    <div style={{
      background: C.card, border: `1px solid ${C.border}`, borderRadius: "2px",
      padding: "28px 28px 20px",
      gridColumn: span ? "span 2" : undefined,
    }}>
      <div style={{ marginBottom: "20px" }}>
        <div style={{ ...mono, fontSize: "9px", letterSpacing: "0.22em", color: C.gold, textTransform: "uppercase", marginBottom: "6px" }}>
          {tag}
        </div>
        <div style={{ ...bebas, fontSize: "26px", color: C.white, letterSpacing: "0.04em", lineHeight: 1 }}>
          {title}
        </div>
        <div style={{ ...dm, fontSize: "12px", color: C.muted, marginTop: "4px" }}>{subtitle}</div>
      </div>
      {children}
    </div>
  );
}

/* ── Loading skeleton ─────────────────────────────────────── */
function Skeleton() {
  return (
    <div style={{
      height: "220px", background: `linear-gradient(90deg, ${C.surface} 0%, ${C.border} 50%, ${C.surface} 100%)`,
      backgroundSize: "200% 100%", borderRadius: "2px",
      animation: "shimmer 1.6s infinite linear",
    }} />
  );
}

/* ── Stat pill ────────────────────────────────────────────── */
function StatPill({ label, value, delta }: { label: string; value: string; delta?: string }) {
  const up = delta?.startsWith("+");
  return (
    <div style={{
      ...mono, padding: "14px 20px", background: C.surface, border: `1px solid ${C.border}`,
      borderRadius: "2px",
    }}>
      <div style={{ fontSize: "9px", letterSpacing: "0.2em", color: C.muted, textTransform: "uppercase", marginBottom: "6px" }}>{label}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
        <span style={{ ...bebas, fontSize: "28px", color: C.white, letterSpacing: "0.02em", lineHeight: 1 }}>{value}</span>
        {delta && (
          <span style={{ fontSize: "10px", color: up ? C.teal : "#C05A5A", letterSpacing: "0.05em" }}>{delta}</span>
        )}
      </div>
    </div>
  );
}

/* ── Main dashboard ───────────────────────────────────────── */
export default function Dashboard() {
  const [census, setCensus] = useState<CensusData | null>(null);
  const [fred, setFred] = useState<FredData | null>(null);
  const [bls, setBls] = useState<BlsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/census").then((r) => r.json()),
      fetch("/api/fred").then((r) => r.json()),
      fetch("/api/bls").then((r) => r.json()),
    ])
      .then(([c, f, b]) => { setCensus(c); setFred(f); setBls(b); })
      .catch(() => setError("Failed to load data — please refresh."));
  }, []);

  /* Derived summary stats */
  const latestTotal = census?.totalSpending.at(-1);
  const prevTotal = census?.totalSpending.at(-2);
  const deltaTotal = latestTotal && prevTotal
    ? ((latestTotal.value - prevTotal.value) / prevTotal.value * 100).toFixed(1)
    : null;

  const latestEmp = bls?.employment.at(-1);
  const prevEmp = bls?.employment.at(-2);
  const deltaEmp = latestEmp && prevEmp ? latestEmp.value - prevEmp.value : null;

  const latestStarts = fred?.housingStarts.at(-1);
  const latestPermits = fred?.buildingPermits.at(-1);

  /* Merge housing starts + permits into a single dataset for dual-line chart */
  const housingData = fred
    ? fred.housingStarts.map((pt, i) => ({
        date: pt.date,
        starts: pt.value,
        permits: fred.buildingPermits[i]?.value ?? null,
      }))
    : null;

  return (
    <div style={{ background: C.bg, minHeight: "100vh", ...dm }}>
      {/* Shimmer keyframe */}
      <style>{`
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: ${C.bg}; }
        ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 3px; }
      `}</style>

      {/* ── Top nav ──────────────────────────────────────────── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(13,15,14,0.94)", backdropFilter: "blur(12px)",
        borderBottom: `1px solid ${C.border}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 32px", height: "56px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "2px" }}>
            <span style={{ ...bebas, fontSize: "22px", letterSpacing: "0.06em", color: C.white, fontWeight: 300 }}>CONSTRUCT</span>
            <span style={{ ...bebas, fontSize: "22px", letterSpacing: "0.01em", color: C.gold }}>AIQ</span>
          </div>
          <div style={{ width: "1px", height: "18px", background: C.border }} />
          <span style={{ ...mono, fontSize: "11px", letterSpacing: "0.18em", color: C.muted, textTransform: "uppercase" }}>
            Market Intelligence
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <span style={{ ...mono, fontSize: "10px", letterSpacing: "0.1em", color: C.faint }}>
            LAST UPDATED: {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }).toUpperCase()}
          </span>
          <div style={{
            ...mono, fontSize: "9px", letterSpacing: "0.15em", color: C.gold,
            padding: "4px 10px", border: `1px solid ${C.border}`, borderRadius: "2px",
          }}>LIVE</div>
        </div>
      </nav>

      {/* ── Page body ─────────────────────────────────────────── */}
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "32px 32px 64px" }}>

        {/* Page header */}
        <div style={{ marginBottom: "28px" }}>
          <h1 style={{ ...bebas, fontSize: "clamp(36px, 5vw, 52px)", color: C.white, letterSpacing: "0.04em", margin: "0 0 6px" }}>
            Construction Market Dashboard
          </h1>
          <p style={{ ...dm, fontSize: "13px", color: C.muted, margin: 0 }}>
            Federal & state data unified — Census Bureau · FRED · BLS · 24-month rolling
          </p>
        </div>

        {/* Error banner */}
        {error && (
          <div style={{
            ...mono, fontSize: "12px", color: "#C05A5A", padding: "12px 20px",
            border: "1px solid #3A1A1A", background: "#1A1010", borderRadius: "2px", marginBottom: "24px",
          }}>
            ⚠ {error}
          </div>
        )}

        {/* ── Summary stats row ───────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "24px" }}>
          <StatPill
            label="Total Construction (SAAR)"
            value={latestTotal ? `$${latestTotal.value.toFixed(1)}B` : "—"}
            delta={deltaTotal ? `${Number(deltaTotal) >= 0 ? "+" : ""}${deltaTotal}% MoM` : undefined}
          />
          <StatPill
            label="Construction Employment"
            value={latestEmp ? `${(latestEmp.value / 1000).toFixed(2)}M` : "—"}
            delta={deltaEmp != null ? `${deltaEmp >= 0 ? "+" : ""}${deltaEmp}K MoM` : undefined}
          />
          <StatPill
            label="Housing Starts (SAAR)"
            value={latestStarts ? `${latestStarts.value.toLocaleString()}K` : "—"}
          />
          <StatPill
            label="Building Permits (SAAR)"
            value={latestPermits ? `${latestPermits.value.toLocaleString()}K` : "—"}
          />
        </div>

        {/* ── Charts grid ─────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>

          {/* Chart 1 — Total Construction Spending */}
          <ChartCard
            tag="Census Bureau · VIP Survey"
            title="Total Construction Spending"
            subtitle="Seasonally adjusted annual rate · $billions"
          >
            {!census ? <Skeleton /> : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={census.totalSpending} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
                  <CartesianGrid {...GRID_PROPS} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={fmtMonth}
                    tick={AXIS_STYLE}
                    tickLine={false}
                    axisLine={{ stroke: C.border }}
                    interval={3}
                  />
                  <YAxis
                    tick={AXIS_STYLE}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `$${v.toLocaleString()}`}
                    width={56}
                  />
                  <Tooltip content={<BrandTooltip unit="B" />} />
                  <Line
                    dataKey="value"
                    name="Total Spending ($B)"
                    stroke={C.gold}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: C.gold, stroke: C.bg, strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          {/* Chart 2 — Housing Starts vs Building Permits */}
          <ChartCard
            tag="Federal Reserve · FRED"
            title="Housing Starts vs Building Permits"
            subtitle="Seasonally adjusted annual rate · thousands of units"
          >
            {!fred ? <Skeleton /> : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={housingData!} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
                  <CartesianGrid {...GRID_PROPS} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={fmtMonth}
                    tick={AXIS_STYLE}
                    tickLine={false}
                    axisLine={{ stroke: C.border }}
                    interval={3}
                  />
                  <YAxis
                    tick={AXIS_STYLE}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => v.toLocaleString()}
                    width={52}
                  />
                  <Tooltip content={<BrandTooltip unit="K" />} />
                  <Legend
                    wrapperStyle={{ ...mono, fontSize: "10px", color: C.muted, paddingTop: "8px", letterSpacing: "0.08em" }}
                  />
                  <Line
                    dataKey="starts"
                    name="Housing Starts"
                    stroke={C.gold}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: C.gold, stroke: C.bg, strokeWidth: 2 }}
                  />
                  <Line
                    dataKey="permits"
                    name="Building Permits"
                    stroke={C.teal}
                    strokeWidth={2}
                    dot={false}
                    strokeDasharray="5 3"
                    activeDot={{ r: 4, fill: C.teal, stroke: C.bg, strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          {/* Chart 3 — Residential Construction Spending */}
          <ChartCard
            tag="Census Bureau · VIP Survey"
            title="Residential Construction Spending"
            subtitle="Seasonally adjusted annual rate · $billions"
          >
            {!census ? <Skeleton /> : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={census.residentialSpending} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
                  <CartesianGrid {...GRID_PROPS} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={fmtMonth}
                    tick={AXIS_STYLE}
                    tickLine={false}
                    axisLine={{ stroke: C.border }}
                    interval={3}
                  />
                  <YAxis
                    tick={AXIS_STYLE}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `$${v.toLocaleString()}`}
                    width={56}
                  />
                  <Tooltip content={<BrandTooltip unit="B" />} />
                  <Line
                    dataKey="value"
                    name="Residential Spending ($B)"
                    stroke={C.gold}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: C.gold, stroke: C.bg, strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          {/* Chart 4 — Construction Employment */}
          <ChartCard
            tag="Bureau of Labor Statistics · CES"
            title="Construction Employment"
            subtitle="Seasonally adjusted · thousands of workers"
          >
            {!bls ? <Skeleton /> : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={bls.employment} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
                  <CartesianGrid {...GRID_PROPS} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={fmtMonth}
                    tick={AXIS_STYLE}
                    tickLine={false}
                    axisLine={{ stroke: C.border }}
                    interval={3}
                  />
                  <YAxis
                    tick={AXIS_STYLE}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => v.toLocaleString()}
                    width={52}
                  />
                  <Tooltip content={<BrandTooltip unit="K" />} />
                  <Line
                    dataKey="value"
                    name="Construction Jobs (K)"
                    stroke={C.gold}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: C.gold, stroke: C.bg, strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>

        {/* ── Footer note ─────────────────────────────────────── */}
        <div style={{
          marginTop: "24px", padding: "16px 20px",
          background: C.surface, border: `1px solid ${C.border}`, borderRadius: "2px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <span style={{ ...mono, fontSize: "10px", color: C.faint, letterSpacing: "0.1em" }}>
            SOURCES: U.S. CENSUS BUREAU VIP SURVEY · FEDERAL RESERVE FRED · BUREAU OF LABOR STATISTICS CES
          </span>
          <span style={{ ...mono, fontSize: "10px", color: C.faint, letterSpacing: "0.1em" }}>
            ALL DATA SEASONALLY ADJUSTED · REFRESHED EVERY 4 HOURS
          </span>
        </div>
      </div>
    </div>
  );
}
