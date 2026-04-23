export interface UserPreferences {
  markets: string[]         // city codes: ['PHX', 'DFW', 'AUS']
  role:    string | null    // 'contractor' | 'lender' | 'supplier' | null
  sectors: string[]         // ['residential', 'commercial']
  set_at:  number           // timestamp
}

const PREF_KEY    = 'constructaiq_prefs'
const PREF_EVENT  = 'constructaiq:prefs'
const DEFAULTS: UserPreferences = { markets: [], role: null, sectors: [], set_at: 0 }

export function getPrefs(): UserPreferences {
  if (typeof window === 'undefined') return { ...DEFAULTS }
  try {
    const raw = localStorage.getItem(PREF_KEY)
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS }
  } catch {
    return { ...DEFAULTS }
  }
}

export function setPrefs(prefs: Partial<UserPreferences>): void {
  if (typeof window === 'undefined') return
  const updated = { ...getPrefs(), ...prefs, set_at: Date.now() }
  localStorage.setItem(PREF_KEY, JSON.stringify(updated))
  window.dispatchEvent(new CustomEvent(PREF_EVENT, { detail: updated }))
}

export function addMarket(cityCode: string): void {
  const prefs = getPrefs()
  if (!prefs.markets.includes(cityCode)) {
    setPrefs({ markets: [...prefs.markets.slice(0, 4), cityCode] })
  }
}

export function removeMarket(cityCode: string): void {
  const prefs = getPrefs()
  setPrefs({ markets: prefs.markets.filter(m => m !== cityCode) })
}

export { PREF_EVENT }
