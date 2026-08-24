export interface RandomGenerator {
  next(): number; // uniform [0, 1)
  nextInRange(min: number, max: number): number;
  nextGaussian(mean?: number, stdDev?: number): number;
}

// mulberry32: fast, deterministic, well-known 32-bit PRNG.
// Not cryptographically secure — not needed for a simulation engine.
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function (): number {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createRNG(seed: number): RandomGenerator {
  const rand = mulberry32(seed);
  let spareGaussian: number | null = null;

  function next(): number {
    return rand();
  }

  function nextInRange(min: number, max: number): number {
    return min + next() * (max - min);
  }

  // Box-Muller transform, cached spare value for efficiency.
  function nextGaussian(mean = 0, stdDev = 1): number {
    if (spareGaussian !== null) {
      const value = spareGaussian;
      spareGaussian = null;
      return mean + value * stdDev;
    }
    let u = 0;
    let v = 0;
    while (u === 0) u = next();
    while (v === 0) v = next();
    const mag = Math.sqrt(-2.0 * Math.log(u));
    const z0 = mag * Math.cos(2.0 * Math.PI * v);
    const z1 = mag * Math.sin(2.0 * Math.PI * v);
    spareGaussian = z1;
    return mean + z0 * stdDev;
  }

  return { next, nextInRange, nextGaussian };
}
