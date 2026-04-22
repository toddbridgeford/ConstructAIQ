/**
 * Deterministic pseudo-random number in [0, 1).
 * Replaces Math.random() in all render paths to avoid hydration mismatches.
 * Same seed always yields the same value.
 */
export function seeded(seed: number): number {
  const x = Math.sin(seed + 1.0) * 10000
  return x - Math.floor(x)
}
