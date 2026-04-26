export const font = {
  sys:  "'Aeonik Pro', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif",
  mono: "ui-monospace, 'SF Mono', 'Cascadia Code', Consolas, monospace",
}

export const color = {
  amber:      '#f5a623',
  amberDim:   '#3d2800',
  orange:     '#ff9500',
  green:      '#30d158',
  greenDim:   '#0a2e14',
  greenMuted: '#1a7f37',
  greenLight: '#86efac',
  red:        '#ff453a',
  redDim:     '#2e0a0a',
  blue:       '#0a84ff',
  blueDim:    '#001a3d',
  purple:     '#5e5ce6',
  cyan:       '#64d2ff',
  yellow:     '#ffd60a',
  redLight:   '#ffaaaa',
  federalOrange: '#f97316',
  federalAmber:  '#ff6b35',
  federalGold:   '#fbbf24',
  gradOrange:    '#e06c3a',
  gradGreen:     '#3a9e6e',
  lightBg:       '#f8f8f8',
  lightBgAlt:    '#fafafa',
  lightBgSub:    '#f5f5f5',
  lightBgSkel:   '#f0f0f0',
  lightBd:       '#e5e5e5',
  // Light-surface text tokens (for /trust, /methodology, and other light pages)
  lightT1:       '#111111',  // headings on light surfaces
  lightT2:       '#333333',  // prose body on light surfaces
  lightT3:       '#555555',  // muted labels / notes on light surfaces
  lightT4:       '#888888',  // very muted hints / captions on light surfaces
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

export const signal = {
  expand:   color.green,
  contract: color.red,
  watch:    color.amber,
  federal:  '#0066CC',
  neutral:  color.t3,
}

// Price-change heatmap palette — 5-tier red-to-green scale
export const heatmap = {
  veryHighBg:  '#7f1d1d',
  veryHighTc:  '#fca5a5',
  highBg:      '#dc2626',
  highTc:      '#fecaca',
  neutralBg:   '#3a3a3a',
  lowBg:       '#166534',
  lowTc:       '#86efac',
  veryLowBg:   '#14532d',
  veryLowTc:   '#bbf7d0',
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
  // numeric scale
  1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32, 10: 40, 12: 48, 16: 64, 20: 80, 24: 96,
  // named aliases
  xs:  4,
  sm:  8,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 48,
} as const

export const layout = {
  sidebar:      240,
  contextPanel: 320,
  maxContent:   900,
  sectionGap:   32,
  cardPad:      24,
  cardRadius:   12,
  rowHeight:    52,
}

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
  kpi:     { fontSize: 48,   fontFamily: font.mono, fontWeight: 700, lineHeight: 1.1 },
  kpiSm:   { fontSize: 32,   fontFamily: font.mono, fontWeight: 700, lineHeight: 1.1 },
  h1:      { fontSize: 28,   fontFamily: font.sys,  fontWeight: 700, lineHeight: 1.2 },
  h2:      { fontSize: 22,   fontFamily: font.sys,  fontWeight: 600, lineHeight: 1.3 },
  h3:      { fontSize: 17,   fontFamily: font.sys,  fontWeight: 600, lineHeight: 1.4 },
  body:    { fontSize: 15,   fontFamily: font.sys,  fontWeight: 400, lineHeight: 1.6 },
  label:   { fontSize: 11,   fontFamily: font.mono, fontWeight: 500, lineHeight: 1.2,
             letterSpacing: '0.08em', textTransform: 'uppercase' as const },
  data:    { fontSize: 14,   fontFamily: font.mono, fontWeight: 400, lineHeight: 1.5 },
  caption: { fontSize: 12,   fontFamily: font.sys,  fontWeight: 400, lineHeight: 1.5,
             color: color.t4 },
  // backward-compat aliases
  bodySm:  { fontSize: 13.5, fontFamily: font.sys,  fontWeight: 400, lineHeight: 1.72 },
  hero:    { fontSize: 88,   fontFamily: font.sys,  fontWeight: 700, lineHeight: 1.01 },
} as const
