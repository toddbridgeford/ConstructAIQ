'use client'
import { useState, useEffect } from 'react'
import { color, font } from '@/lib/theme'
import { Plus, Trash2, Bell } from 'lucide-react'

interface Alert {
  id:        string
  series:    string
  seriesLabel: string
  condition: 'above' | 'below' | 'change'
  value:     number
  timeframe: 'mom' | 'yoy'
  via:       'push' | 'both'
}

const SERIES_OPTIONS = [
  { value: 'TTLCONS',       label: 'Construction Spending' },
  { value: 'PERMIT',        label: 'Building Permits' },
  { value: 'CES2000000001', label: 'Construction Employment' },
  { value: 'PPI_LUMBER',    label: 'Lumber PPI' },
  { value: 'PPI_STEEL',     label: 'Steel PPI' },
  { value: 'MORTGAGE30US',  label: 'Mortgage Rate' },
]

const STORAGE_KEY = 'constructaiq_alerts'

function loadAlerts(): Alert[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch { return [] }
}

function saveAlerts(alerts: Alert[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts))
}

export function AlertSettings() {
  const [alerts, setAlerts]   = useState<Alert[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Partial<Alert>>({
    condition: 'above', timeframe: 'mom', via: 'push',
  })

  useEffect(() => { setAlerts(loadAlerts()) }, [])

  function addAlert() {
    if (!form.series || form.value === undefined) return
    const opt = SERIES_OPTIONS.find(o => o.value === form.series)
    const newAlert: Alert = {
      id:          Date.now().toString(),
      series:      form.series,
      seriesLabel: opt?.label ?? form.series,
      condition:   form.condition ?? 'above',
      value:       form.value,
      timeframe:   form.timeframe ?? 'mom',
      via:         form.via ?? 'push',
    }
    const updated = [...alerts, newAlert]
    setAlerts(updated)
    saveAlerts(updated)
    setShowForm(false)
    setForm({ condition: 'above', timeframe: 'mom', via: 'push' })
  }

  function removeAlert(id: string) {
    const updated = alerts.filter(a => a.id !== id)
    setAlerts(updated)
    saveAlerts(updated)
  }

  const conditionLabel = (c: Alert['condition']) =>
    c === 'above' ? 'rises above'
    : c === 'below' ? 'falls below'
    : 'changes by more than'

  const timeframeLabel = (t: Alert['timeframe']) =>
    t === 'mom' ? 'month-over-month' : 'year-over-year'

  const selectStyle: React.CSSProperties = {
    background: color.bg2, border: `1px solid ${color.bd1}`,
    borderRadius: 8, padding: '8px 12px',
    fontFamily: font.sys, fontSize: 13, color: color.t1,
    width: '100%',
  }

  const inputStyle: React.CSSProperties = {
    ...selectStyle, width: '100%',
  }

  return (
    <div>
      <div style={{ fontFamily: font.sys, fontSize: 15,
        fontWeight: 600, color: color.t1, marginBottom: 16 }}>
        Custom Alerts
      </div>

      {alerts.length === 0 && !showForm && (
        <p style={{ fontFamily: font.sys, fontSize: 13,
          color: color.t4, marginBottom: 16 }}>
          No custom alerts yet. Add one to get notified
          when specific thresholds are crossed.
        </p>
      )}

      {/* Existing alerts */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8,
        marginBottom: 16 }}>
        {alerts.map(a => (
          <div key={a.id} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            background: color.bg2, borderRadius: 8,
            border: `1px solid ${color.bd1}`,
            padding: '10px 14px',
          }}>
            <Bell size={14} color={color.amber} />
            <div style={{ flex: 1, fontFamily: font.sys,
              fontSize: 13, color: color.t2 }}>
              <strong>{a.seriesLabel}</strong>{' '}
              {conditionLabel(a.condition)}{' '}
              <strong>{a.value}%</strong>{' '}
              {timeframeLabel(a.timeframe)}
            </div>
            <button onClick={() => removeAlert(a.id)}
              style={{ background: 'transparent', border: 'none',
                cursor: 'pointer', padding: 4 }}>
              <Trash2 size={14} color={color.t4} />
            </button>
          </div>
        ))}
      </div>

      {/* Add form */}
      {showForm && (
        <div style={{ background: color.bg1, borderRadius: 10,
          border: `1px solid ${color.bd1}`, padding: '20px',
          marginBottom: 16, display: 'flex',
          flexDirection: 'column', gap: 12 }}>

          <select style={selectStyle}
            value={form.series ?? ''}
            onChange={e => setForm(f => ({ ...f, series: e.target.value }))}>
            <option value="">Select a series...</option>
            {SERIES_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          <div style={{ display: 'flex', gap: 8 }}>
            <select style={{ ...selectStyle, flex: 1 }}
              value={form.condition}
              onChange={e => setForm(f => ({
                ...f, condition: e.target.value as Alert['condition']
              }))}>
              <option value="above">rises above</option>
              <option value="below">falls below</option>
              <option value="change">changes by more than</option>
            </select>

            <input type="number" placeholder="5"
              style={{ ...inputStyle, flex: '0 0 80px' }}
              value={form.value ?? ''}
              onChange={e => setForm(f => ({
                ...f, value: parseFloat(e.target.value)
              }))} />

            <span style={{ fontFamily: font.mono, fontSize: 12,
              color: color.t3, alignSelf: 'center' }}>%</span>
          </div>

          <select style={selectStyle}
            value={form.timeframe}
            onChange={e => setForm(f => ({
              ...f, timeframe: e.target.value as Alert['timeframe']
            }))}>
            <option value="mom">month-over-month</option>
            <option value="yoy">year-over-year</option>
          </select>

          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={addAlert}
              style={{ flex: 1, background: color.amber,
                color: '#000', border: 'none', borderRadius: 8,
                padding: '10px', fontFamily: font.sys,
                fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              Save Alert
            </button>
            <button onClick={() => setShowForm(false)}
              style={{ flex: 1, background: 'transparent',
                color: color.t3, border: `1px solid ${color.bd1}`,
                borderRadius: 8, padding: '10px',
                fontFamily: font.sys, fontSize: 14,
                cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {!showForm && (
        <button onClick={() => setShowForm(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 8,
            background: 'transparent', color: color.amber,
            border: `1px solid ${color.amber}44`, borderRadius: 8,
            padding: '8px 16px', fontFamily: font.sys,
            fontSize: 13, cursor: 'pointer' }}>
          <Plus size={14} />
          Add alert
        </button>
      )}
    </div>
  )
}
