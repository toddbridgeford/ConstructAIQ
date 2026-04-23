export function obsSpark(
  obs: { date: string; value: number }[] | undefined,
  n: number,
  fallback: number | null,
): number[] {
  const vals = (obs ?? []).slice(-n).map(o => o.value).filter(v => Number.isFinite(v))
  if (!vals.length) return fallback != null ? Array(n).fill(fallback) : []
  while (vals.length < n) vals.unshift(vals[0])
  return vals
}
