export interface FreshnessInfo {
  label:   string  // e.g. "Updated 2 hours ago"
  isStale: boolean // true if > 48 hours old
  isoDate: string  // the actual source timestamp
}

export function formatFreshness(
  isoDate: string | null | undefined
): FreshnessInfo {
  if (!isoDate) return {
    label:   'Freshness unknown',
    isStale: true,
    isoDate: '',
  }

  const now  = Date.now()
  const then = new Date(isoDate).getTime()
  const ms   = now - then
  const mins = Math.floor(ms / 60000)
  const hrs  = Math.floor(ms / 3600000)
  const days = Math.floor(ms / 86400000)

  let label: string
  if (mins < 2)        label = 'Updated just now'
  else if (mins < 60)  label = `Updated ${mins}m ago`
  else if (hrs < 24)   label = `Updated ${hrs}h ago`
  else if (days === 1) label = 'Updated yesterday'
  else                 label = `Updated ${days} days ago`

  return {
    label,
    isStale: ms > 48 * 3600000,
    isoDate,
  }
}
