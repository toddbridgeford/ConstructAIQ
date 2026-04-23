'use client'
import { useState } from 'react'
import { color, font, layout } from '@/lib/theme'

export interface DataTableColumn {
  header:    string
  key:       string
  sortable?: boolean
  align?:    'left' | 'right' | 'center'
  width?:    number | string
  render?:   (value: unknown, row: Record<string, unknown>) => React.ReactNode
}

interface DataTableProps {
  columns:     DataTableColumn[]
  rows:        Record<string, unknown>[]
  onRowClick?: (row: Record<string, unknown>) => void
  sortable?:   boolean
}

export function DataTable({ columns, rows, onRowClick, sortable }: DataTableProps) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  function handleHeader(col: DataTableColumn) {
    if (!sortable && !col.sortable) return
    if (sortKey === col.key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(col.key)
      setSortDir('desc')
    }
  }

  const sorted = sortKey
    ? [...rows].sort((a, b) => {
        const av = a[sortKey], bv = b[sortKey]
        if (av == null) return 1
        if (bv == null) return -1
        const diff = av < bv ? -1 : av > bv ? 1 : 0
        return sortDir === 'asc' ? diff : -diff
      })
    : rows

  const canSort = (col: DataTableColumn) => !!(sortable || col.sortable)

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {columns.map(col => (
              <th
                key={col.key}
                onClick={() => handleHeader(col)}
                style={{
                  fontFamily:    font.mono,
                  fontSize:      11,
                  color:         color.t4,
                  fontWeight:    500,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  padding:       '0 16px 12px',
                  textAlign:     col.align ?? 'left',
                  borderBottom:  `1px solid ${color.bd1}`,
                  cursor:        canSort(col) ? 'pointer' : 'default',
                  userSelect:    'none',
                  whiteSpace:    'nowrap',
                  width:         col.width,
                }}
              >
                {col.header}
                {canSort(col) && (
                  <span style={{ marginLeft: 4, color: sortKey === col.key ? color.amber : color.bd2 }}>
                    {sortKey === col.key ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
                  </span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, i) => (
            <tr
              key={i}
              onClick={() => onRowClick?.(row)}
              style={{
                borderBottom: `1px solid ${color.bd1}`,
                cursor:       onRowClick ? 'pointer' : 'default',
                height:       layout.rowHeight,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = color.bg2 }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
            >
              {columns.map(col => (
                <td
                  key={col.key}
                  style={{
                    fontFamily:    font.sys,
                    fontSize:      14,
                    color:         color.t2,
                    padding:       '0 16px',
                    textAlign:     col.align ?? 'left',
                    verticalAlign: 'middle',
                  }}
                >
                  {col.render
                    ? col.render(row[col.key], row)
                    : String(row[col.key] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
