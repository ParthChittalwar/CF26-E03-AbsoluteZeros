import { describe, it, expect } from "vitest";
import { simulateSingleRun } from "./riskModel";
import { createRNG } from "./random";
import { DEFAULT_CITY_PROFILE } from "../data/cityProfiles";
import type { HazardProfile, StrategyEffect } from "./types";

const hazard: HazardProfile = { floodHazard: 0.7, heatHazard: 0.3 };

const noStrategy: StrategyEffect = {
  interventionIds: [],
  totalCostCr: 0,
  totalMaintenanceCostCr: 0,
  withinBudget: true,
  floodReduction: 0,
  heatReduction: 0,
  infrastructureProtection: 0,
  populationProtection: 0,
  recoveryImprovement: 0,
};

const mitigatedStrategy: StrategyEffect = {
  ...noStrategy,
  interventionIds: ["drainage-upgrade", "flood-barrier"],
  totalCostCr: 100,
  floodReduction: 0.8,
  infrastructureProtection: 0.4,
  populationProtection: 0.25,
  recoveryImprovement: 0.35,
};

describe("simulateSingleRun", () => {
  it("produces an identical outcome for two RNGs created from the same seed", () => {
    const rngA = createRNG(2026);
    const rngB = createRNG(2026);
    const a = simulateSingleRun(DEFAULT_CITY_PROFILE, hazard, noStrategy, rngA);
    const b = simulateSingleRun(DEFAULT_CITY_PROFILE, hazard, noStrategy, rngB);
    expect(a).toEqual(b);
  });

  it("produces a different outcome for a different seed", () => {
    const rngA = createRNG(1);
    const rngB = createRNG(2);
    const a = simulateSingleRun(DEFAULT_CITY_PROFILE, hazard, noStrategy, rngA);
    const b = simulateSingleRun(DEFAULT_CITY_PROFILE, hazard, noStrategy, rngB);
    expect(a).not.toEqual(b);
  });

  it("reduces flood risk and damage when a mitigating strategy is applied", () => {
    const rngA = createRNG(42);
    const rngB = createRNG(42);
    const baseline = simulateSingleRun(DEFAULT_CITY_PROFILE, hazard, noStrategy, rngA);
    const mitigated = simulateSingleRun(
      DEFAULT_CITY_PROFILE,
      hazard,
      mitigatedStrategy,
      rngB
    );
    expect(mitigated.floodRisk).toBeLessThan(baseline.floodRisk);
    expect(mitigated.damageCr).toBeLessThan(baseline.damageCr);
    expect(mitigated.populationAffected).toBeLessThan(baseline.populationAffected);
    expect(mitigated.recoveryMonths).toBeLessThan(baseline.recoveryMonths);
  });

  it("keeps risk values within the 0-1 range and non-negative outputs", () => {
    const rng = createRNG(7);
    const outcome = simulateSingleRun(DEFAULT_CITY_PROFILE, hazard, noStrategy, rng);
    expect(outcome.floodRisk).toBeGreaterThanOrEqual(0);
    expect(outcome.floodRisk).toBeLessThanOrEqual(1);
    expect(outcome.heatRisk).toBeGreaterThanOrEqual(0);
    expect(outcome.heatRisk).toBeLessThanOrEqual(1);
    expect(outcome.damageCr).toBeGreaterThanOrEqual(0);
    expect(outcome.populationAffected).toBeGreaterThanOrEqual(0);
    expect(outcome.recoveryMonths).toBeGreaterThanOrEqual(1);
  });
});
