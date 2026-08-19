// ============================================================================
// F1 Owner — Seeded RNG (spec §68). Same seed + same decisions => same season.
// ============================================================================

export type Rng = () => number;

export function hashSeed(str: string): number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^ (h >>> 16)) >>> 0;
}

export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Deterministic RNG object so sub-systems can be streamed in order. */
export function createRng(seed: string): Rng {
  return mulberry32(hashSeed(seed));
}

export function rand(rng: Rng, min = 0, max = 1): number {
  return min + (max - min) * rng();
}
export function randInt(rng: Rng, min: number, max: number): number {
  return Math.floor(rand(rng, min, max + 1));
}
export const chance = (rng: Rng, p: number): boolean => rng() < Math.max(0, Math.min(1, p));

/** Approximate gaussian noise, roughly -1.5..1.5 with center mass at 0. */
export function noise(rng: Rng): number {
  return rng() + rng() + rng() - 1.5;
}

export function pick<T>(rng: Rng, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

/** Weighted pick: weights are parallel arrays. */
export function pickWeighted<T>(rng: Rng, items: readonly T[], weights: readonly number[]): T {
  const total = weights.reduce((a, b) => a + Math.max(0, b), 0);
  if (total <= 0) return items[randInt(rng, 0, items.length - 1)];
  let roll = rng() * total;
  for (let i = 0; i < items.length; i++) {
    roll -= Math.max(0, weights[i]);
    if (roll <= 0) return items[i];
  }
  return items[items.length - 1];
}

/** Format a seed like F1-2025-849231 (spec §68). */
export function makeSeed(season: number): string {
  const n = Math.floor(Math.random() * 1_000_000);
  return `F1-${season}-${String(n).padStart(6, "0")}`;
}