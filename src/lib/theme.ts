export const font = {
  sys:  "'Aeonik Pro', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif",
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

export const space = {
  1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32, 10: 40, 12: 48, 16: 64, 20: 80, 24: 96,
} as const

export const radius = {
  xs: 4, sm: 6, md: 8, lg: 12, xl: 16, xl2: 20, xl3: 24, full: 9999,
} as const

export const shadow = {
  sm:     '0 1px 4px rgba(0,0,0,0.32)',
  md:     '0 4px 16px rgba(0,0,0,0.40)',
  lg:     '0 8px 32px rgba(0,0,0,0.48)',
  xl:     '0 16px 56px rgba(0,0,0,0.56)',
  blue:   '0 4px 20px rgba(10,132,255,0.36)',
  blueLg: '0 8px 32px rgba(10,132,255,0.50)',
} as const

export const type = {
  hero:    { fontSize: 88,   fontWeight: 700, letterSpacing: '-0.045em', lineHeight: 1.01 },
  h1:      { fontSize: 72,   fontWeight: 700, letterSpacing: '-0.04em',  lineHeight: 1.03 },
  h2:      { fontSize: 52,   fontWeight: 700, letterSpacing: '-0.035em', lineHeight: 1.07 },
  h3:      { fontSize: 27,   fontWeight: 700, letterSpacing: '-0.03em',  lineHeight: 1.2  },
  h4:      { fontSize: 19,   fontWeight: 700, letterSpacing: '-0.02em',  lineHeight: 1.3  },
  body:    { fontSize: 16,   fontWeight: 400, letterSpacing: '-0.01em',  lineHeight: 1.6  },
  bodySm:  { fontSize: 13.5, fontWeight: 400, letterSpacing: '-0.005em', lineHeight: 1.72 },
  label:   { fontSize: 15,   fontWeight: 600, letterSpacing: '-0.01em',  lineHeight: 1.4  },
  caption: { fontSize: 10.5, fontWeight: 600, letterSpacing: '0.1em',    lineHeight: 1.4, textTransform: 'uppercase' as const },
  kpi:     { fontSize: 54,   fontWeight: 700, letterSpacing: '-0.045em', lineHeight: 1    },
} as const
