import { describe, it, expect } from "vitest";
import { createRNG } from "./random";

describe("createRNG", () => {
  it("produces an identical sequence for the same seed", () => {
    const rngA = createRNG(42);
    const rngB = createRNG(42);
    const seqA = Array.from({ length: 20 }, () => rngA.next());
    const seqB = Array.from({ length: 20 }, () => rngB.next());
    expect(seqA).toEqual(seqB);
  });

  it("produces different sequences for different seeds", () => {
    const rngA = createRNG(1);
    const rngB = createRNG(2);
    const seqA = Array.from({ length: 20 }, () => rngA.next());
    const seqB = Array.from({ length: 20 }, () => rngB.next());
    expect(seqA).not.toEqual(seqB);
  });

  it("nextInRange stays within bounds and is reproducible for the same seed", () => {
    const rngA = createRNG(7);
    const rngB = createRNG(7);
    for (let i = 0; i < 50; i++) {
      const a = rngA.nextInRange(10, 20);
      const b = rngB.nextInRange(10, 20);
      expect(a).toBeGreaterThanOrEqual(10);
      expect(a).toBeLessThan(20);
      expect(a).toBe(b);
    }
  });

  it("nextGaussian is reproducible for the same seed", () => {
    const rngA = createRNG(99);
    const rngB = createRNG(99);
    const seqA = Array.from({ length: 10 }, () => rngA.nextGaussian(50, 5));
    const seqB = Array.from({ length: 10 }, () => rngB.nextGaussian(50, 5));
    expect(seqA).toEqual(seqB);
  });

  it("a simulation-shaped call sequence is identical for the same seed and differs across seeds", () => {
    // Mirrors how the Phase 2 engine will consume the RNG: a mix of
    // next / nextInRange / nextGaussian calls per simulated run.
    function runMockSimulation(seed: number): number[] {
      const rng = createRNG(seed);
      const results: number[] = [];
      for (let i = 0; i < 30; i++) {
        results.push(rng.nextInRange(0, 100) + rng.nextGaussian(0, 1));
      }
      return results;
    }

    const runA1 = runMockSimulation(2026);
    const runA2 = runMockSimulation(2026);
    const runB = runMockSimulation(2027);

    expect(runA1).toEqual(runA2); // same seed + same inputs = same result
    expect(runA1).not.toEqual(runB); // different seed = different stochastic result
  });
});
