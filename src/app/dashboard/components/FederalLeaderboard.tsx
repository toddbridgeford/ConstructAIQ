'use client'
import { font, color } from '@/lib/theme'
import { DataTable } from '@/app/components/ui/DataTable'
import type { DataTableColumn } from '@/app/components/ui/DataTable'

const SYS  = font.sys
const MONO = font.mono

interface FederalContractor {
  rank:       number
  name:       string
  awardValue: number
  contracts:  number
  agency:     string
  state:      string
}

interface FederalLeaderboardProps {
  contractors: FederalContractor[]
}

function fmtAward(v: number): string {
  return v >= 1000 ? `$${(v / 1000).toFixed(1)}B` : `$${v.toFixed(0)}M`
}

const COLUMNS: DataTableColumn[] = [
  {
    header: 'Rank', key: 'rank', sortable: true, align: 'center', width: 56,
    render: v => (
      <span style={{ fontFamily: MONO, color: color.amber, fontWeight: 700 }}>
        {String(v)}
      </span>
    ),
  },
  {
    header: 'Company', key: 'name',
    render: v => (
      <span style={{ fontFamily: SYS, fontSize: 13, fontWeight: 500, color: color.t1 }}>
        {String(v)}
      </span>
    ),
  },
  {
    header: 'Award Value', key: 'awardValue', sortable: true,
    render: v => (
      <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 600 }}>
        {fmtAward(v as number)}
      </span>
    ),
  },
  {
    header: 'Contracts', key: 'contracts', sortable: true,
    render: v => (
      <span style={{ fontFamily: MONO, fontSize: 13 }}>
        {(v as number).toLocaleString()}
      </span>
    ),
  },
  {
    header: 'Agency', key: 'agency',
    render: v => (
      <span style={{ fontFamily: SYS, fontSize: 12, color: color.t3 }}>
        {String(v)}
      </span>
    ),
  },
  {
    header: 'State', key: 'state',
    render: v => (
      <span style={{ fontFamily: MONO, fontSize: 12, color: color.t4 }}>
        {String(v)}
      </span>
    ),
  },
]

export function FederalLeaderboard({ contractors }: FederalLeaderboardProps) {
  if (!contractors || contractors.length === 0) {
    return (
      <div style={{ padding: 24, color: color.t4, fontFamily: SYS, fontSize: 14, textAlign: 'center' }}>
        No contractor data available.
      </div>
    )
  }

  const rows = contractors as unknown as Record<string, unknown>[]

  return (
    <div style={{
      background: color.bg2, border: `1px solid ${color.bd1}`,
      borderRadius: 16, overflow: 'hidden',
    }}>
      <div style={{ padding: '16px 20px 12px' }}>
        <div style={{ fontFamily: MONO, fontSize: 10, color: color.t4, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 2 }}>
          Federal Contractor Leaderboard
        </div>
        <div style={{ fontFamily: SYS, fontSize: 16, fontWeight: 600, color: color.t1 }}>
          Top {contractors.length} Federal Contractors
        </div>
      </div>
      <DataTable columns={COLUMNS} rows={rows} sortable />
    </div>
  )
}
