'use client'
import { font, color } from '@/lib/theme'
import { DataTable } from '@/app/components/ui/DataTable'
import type { DataTableColumn } from '@/app/components/ui/DataTable'

const SYS = font.sys
const MONO = font.mono

interface FederalStateAllocation {
  state:        string
  allocated:    number
  obligated:    number
  spent:        number
  executionPct: number
  rank:         number
}

interface FederalStateTableProps {
  stateAllocations: FederalStateAllocation[]
}

function fmtM(v: number): string {
  return v >= 1000 ? `$${(v / 1000).toFixed(1)}B` : `$${v.toFixed(0)}M`
}

function execColor(pct: number): string {
  if (pct > 70) return color.green
  if (pct >= 40) return color.amber
  return color.red
}

function execBg(pct: number): string {
  if (pct > 70) return color.greenDim
  if (pct >= 40) return color.amberDim
  return color.redDim
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
    header: 'State', key: 'state',
    render: v => (
      <span style={{ fontFamily: SYS, fontSize: 13, fontWeight: 600, color: color.t1 }}>
        {String(v)}
      </span>
    ),
  },
  {
    header: 'Allocated', key: 'allocated', sortable: true,
    render: v => <span style={{ fontFamily: MONO, fontSize: 13 }}>{fmtM(v as number)}</span>,
  },
  {
    header: 'Obligated', key: 'obligated', sortable: true,
    render: v => <span style={{ fontFamily: MONO, fontSize: 13 }}>{fmtM(v as number)}</span>,
  },
  {
    header: 'Spent', key: 'spent', sortable: true,
    render: v => <span style={{ fontFamily: MONO, fontSize: 13 }}>{fmtM(v as number)}</span>,
  },
  {
    header: '% Executed', key: 'executionPct', sortable: true,
    render: v => {
      const pct = v as number
      return (
        <span style={{
          fontFamily: MONO, fontSize: 12, fontWeight: 700,
          color: execColor(pct), background: execBg(pct),
          borderRadius: 6, padding: '2px 8px',
        }}>
          {pct.toFixed(1)}%
        </span>
      )
    },
  },
]

export function FederalStateTable({ stateAllocations }: FederalStateTableProps) {
  if (!stateAllocations || stateAllocations.length === 0) {
    return (
      <div style={{ padding: 24, color: color.t4, fontFamily: SYS, fontSize: 14, textAlign: 'center' }}>
        No state allocation data available.
      </div>
    )
  }

  const rows = stateAllocations as unknown as Record<string, unknown>[]

  return (
    <div style={{
      background: color.bg2, border: `1px solid ${color.bd1}`,
      borderRadius: 16, overflow: 'hidden',
    }}>
      <div style={{ padding: '16px 20px 12px' }}>
        <div style={{ fontFamily: MONO, fontSize: 10, color: color.t4, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 2 }}>
          State Allocation Tracker
        </div>
        <div style={{ fontFamily: SYS, fontSize: 16, fontWeight: 600, color: color.t1 }}>
          Federal Infrastructure Allocations by State
        </div>
      </div>
      <DataTable columns={COLUMNS} rows={rows} />
    </div>
  )
}
