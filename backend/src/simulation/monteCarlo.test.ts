import { describe, it, expect } from "vitest";
import { runMonteCarlo } from "./monteCarlo";
import { createRNG } from "./random";
import { DEFAULT_CITY_PROFILE } from "../data/cityProfiles";
import type { HazardProfile, StrategyEffect } from "./types";

const hazard: HazardProfile = { floodHazard: 0.7, heatHazard: 0.3 };

const strategy: StrategyEffect = {
  interventionIds: ["drainage-upgrade"],
  totalCostCr: 40,
  totalMaintenanceCostCr: 2,
  withinBudget: true,
  floodReduction: 0.3,
  heatReduction: 0,
  infrastructureProtection: 0.15,
  populationProtection: 0.1,
  recoveryImprovement: 0.15,
};

describe("runMonteCarlo", () => {
  it("produces identical aggregate stats for the same seed and inputs", () => {
    const a = runMonteCarlo(
      DEFAULT_CITY_PROFILE,
      hazard,
      strategy,
      200,
      createRNG(2026)
    );
    const b = runMonteCarlo(
      DEFAULT_CITY_PROFILE,
      hazard,
      strategy,
      200,
      createRNG(2026)
    );
    expect(a).toEqual(b);
  });

  it("produces different aggregate stats for a different seed", () => {
    const a = runMonteCarlo(
      DEFAULT_CITY_PROFILE,
      hazard,
      strategy,
      200,
      createRNG(1)
    );
    const b = runMonteCarlo(
      DEFAULT_CITY_PROFILE,
      hazard,
      strategy,
      200,
      createRNG(2)
    );
    expect(a.uncertainty.mean).not.toBe(b.uncertainty.mean);
  });

  it("clamps an out-of-range simulation count into the allowed band", () => {
    const tooFew = runMonteCarlo(
      DEFAULT_CITY_PROFILE,
      hazard,
      strategy,
      1,
      createRNG(5)
    );
    const tooMany = runMonteCarlo(
      DEFAULT_CITY_PROFILE,
      hazard,
      strategy,
      100000,
      createRNG(5)
    );
    // both should complete without throwing and return valid stats
    expect(tooFew.uncertainty.mean).toBeGreaterThanOrEqual(0);
    expect(tooMany.uncertainty.mean).toBeGreaterThanOrEqual(0);
  });

  it("keeps min <= mean <= max and stdDev non-negative", () => {
    const result = runMonteCarlo(
      DEFAULT_CITY_PROFILE,
      hazard,
      strategy,
      500,
      createRNG(99)
    );
    expect(result.uncertainty.min).toBeLessThanOrEqual(result.uncertainty.mean);
    expect(result.uncertainty.mean).toBeLessThanOrEqual(result.uncertainty.max);
    expect(result.uncertainty.stdDev).toBeGreaterThanOrEqual(0);
    expect(result.uncertainty.successProbability).toBeGreaterThanOrEqual(0);
    expect(result.uncertainty.successProbability).toBeLessThanOrEqual(1);
  });
});
