"use client"
import { color, font, radius } from "@/lib/theme"
import { SectionVerdict } from "./SectionVerdict"
import type { WarnData, WarnNotice } from "@/app/api/warn/route"

const SYS  = font.sys
const MONO = font.mono

interface Props {
  data: WarnData | null
}

function employeeColor(n: number): string {
  if (n >= 500) return color.red
  if (n >= 100) return color.amber
  return color.t3
}

function Skeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {[1, 2, 3, 4].map(i => (
        <div key={i} style={{
          height: 32,
          borderRadius: radius.sm,
          background: color.bg2,
          opacity: 0.5,
          animation: "pulse 1.5s ease-in-out infinite",
        }} />
      ))}
      <style>{`@keyframes pulse{0%,100%{opacity:.5}50%{opacity:.25}}`}</style>
    </div>
  )
}

function InfoTooltip() {
  return (
    <span
      title="Federal WARN Act requires 60-day advance notice for layoffs of 50+ employees. Construction sector filings are an early contraction signal."
      style={{
        display:        "inline-flex",
        alignItems:     "center",
        justifyContent: "center",
        width:          16,
        height:         16,
        borderRadius:   "50%",
        border:         `1px solid ${color.bd2}`,
        fontFamily:     MONO,
        fontSize:       9,
        color:          color.t4,
        cursor:         "help",
        flexShrink:     0,
      }}
    >
      i
    </span>
  )
}

function NoticeRow({ notice }: { notice: WarnNotice }) {
  const col = employeeColor(notice.employees)
  const date = notice.notice_date
    ? new Date(notice.notice_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "—"

  return (
    <tr style={{ borderBottom: `1px solid ${color.bd1}` }}>
      <td style={{
        padding:    "9px 12px",
        fontFamily: SYS,
        fontSize:   13,
        color:      color.t2,
        maxWidth:   200,
      }}>
        <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {notice.company}
        </div>
        {notice.city && (
          <div style={{ fontFamily: MONO, fontSize: 10, color: color.t4, marginTop: 2 }}>
            {notice.city}
          </div>
        )}
      </td>
      <td style={{
        padding:    "9px 10px",
        fontFamily: MONO,
        fontSize:   12,
        color:      color.t3,
        whiteSpace: "nowrap",
      }}>
        {notice.state || "—"}
      </td>
      <td style={{
        padding:    "9px 10px",
        fontFamily: MONO,
        fontSize:   12,
        color:      col,
        fontWeight: notice.employees >= 100 ? 600 : 400,
        whiteSpace: "nowrap",
        textAlign:  "right",
      }}>
        {notice.employees.toLocaleString()}
      </td>
      <td style={{
        padding:    "9px 12px",
        fontFamily: MONO,
        fontSize:   11,
        color:      color.t4,
        whiteSpace: "nowrap",
      }}>
        {date}
      </td>
    </tr>
  )
}

export function WarnFeed({ data }: Props) {
  const notices = data?.notices?.slice(0, 10) ?? []

  return (
    <div style={{
      background:   color.bg1,
      border:       `1px solid ${color.bd1}`,
      borderRadius: radius.xl,
      overflow:     "hidden",
    }}>
      {/* Header */}
      <div style={{
        padding:       "16px 18px 12px",
        borderBottom:  `1px solid ${color.bd1}`,
        display:       "flex",
        flexDirection: "column",
        gap:           4,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{
            fontFamily:    SYS,
            fontSize:      14,
            fontWeight:    700,
            color:         color.t1,
            letterSpacing: "-0.015em",
          }}>
            WARN Act — Construction Layoff Notices
          </span>
          <InfoTooltip />
        </div>
        <div style={{ fontFamily: MONO, fontSize: 10, color: color.t4, letterSpacing: "0.06em" }}>
          SOURCE: US DEPT OF LABOR · UPDATED DAILY
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: data ? 0 : "16px 18px" }}>
        {!data ? (
          <div style={{ padding: "16px 18px" }}>
            <Skeleton />
          </div>
        ) : notices.length === 0 ? (
          <div style={{
            padding:    "24px 18px",
            fontFamily: MONO,
            fontSize:   12,
            color:      color.t4,
            textAlign:  "center",
          }}>
            No recent construction WARN Act filings found.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 380 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${color.bd1}` }}>
                  {["Company", "State", "Workers", "Notice Date"].map((h, i) => (
                    <th key={h} style={{
                      padding:       "8px 10px",
                      fontFamily:    MONO,
                      fontSize:      9,
                      color:         color.t4,
                      fontWeight:    600,
                      letterSpacing: "0.1em",
                      textAlign:     i === 2 ? "right" : "left",
                      paddingLeft:   i === 0 ? 12 : 10,
                      paddingRight:  i === 3 ? 12 : 10,
                    }}>
                      {h.toUpperCase()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {notices.map((n, i) => <NoticeRow key={i} notice={n} />)}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer */}
      {data && (
        <div style={{
          padding:      "10px 18px",
          borderTop:    `1px solid ${color.bd1}`,
          fontFamily:   MONO,
          fontSize:     10,
          color:        color.t4,
          letterSpacing: "0.04em",
          display:      "flex",
          gap:          16,
          flexWrap:     "wrap",
        }}>
          <span>
            {data.total_count} construction notices
          </span>
          <span>
            {data.total_employees_affected.toLocaleString()} workers affected
          </span>
          {data.stale && <span style={{ color: color.amber }}>STALE DATA</span>}
        </div>
      )}

      {data && (() => {
        const MONTHLY_AVG = 25
        const direction = data.total_count > MONTHLY_AVG ? 'above' : data.total_count < MONTHLY_AVG ? 'below' : 'in line with'
        return (
          <div style={{ padding: "0 18px 14px" }}>
            <SectionVerdict
              text={`${data.total_count} construction WARN Act notices in the last 30 days — ${direction} the prior 12-month average of ${MONTHLY_AVG}.`}
            />
          </div>
        )
      })()}
    </div>
  )
}
