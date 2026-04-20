export const font = {
  sys:  "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif",
  mono: "ui-monospace, 'SF Mono', 'Cascadia Code', Consolas, monospace",
}

export const color = {
  amber:    '#f5a623',
  amberDim: '#3d2800',
  green:    '#30d158',
  greenDim: '#0a2e14',
  red:      '#ff453a',
  redDim:   '#2e0a0a',
  blue:     '#0a84ff',
  blueDim:  '#001a3d',
  bg0: '#000',
  bg1: '#0d0d0d',
  bg2: '#1a1a1a',
  bg3: '#222',
  bg4: '#2a2a2a',
  bd1: '#2a2a2a',
  bd2: '#383838',
  bd3: '#484848',
  t1:  '#fff',
  t2:  '#ebebf0',
  t3:  '#a0a0ab',
  t4:  '#6e6e73',
}

export const TAP = 44

export function sentColor(s: string): string {
  switch (s) {
    case 'BULLISH': case 'BUY':  return color.green
    case 'BEARISH': case 'SELL': return color.red
    case 'WARNING':              return color.amber
    default:                     return color.blue
  }
}

export function sentBg(s: string): string {
  switch (s) {
    case 'BULLISH': case 'BUY':  return color.greenDim
    case 'BEARISH': case 'SELL': return color.redDim
    case 'WARNING':              return color.amberDim
    default:                     return color.blueDim
  }
}

export function fmtB(v: number): string {
  return v >= 1000 ? `$${(v / 1000).toFixed(1)}B` : `$${Number(v).toFixed(0)}M`
}

export function fmtN(v: number | null | undefined, d = 2): string {
  return v != null ? Number(v).toFixed(d) : '—'
}

export function fmtPct(v: number | null | undefined): string {
  if (v == null) return '—'
  return `${v > 0 ? '+' : ''}${Number(v).toFixed(2)}%`
}

export function fmtK(v: number): string {
  return v >= 1000 ? `${(v / 1000).toFixed(1)}K` : String(v)
}
