import { describe, it, expect } from "vitest";
import { compareToBaseline } from "./comparisonService";
import { SimulationInputError } from "./errors";
import { DEFAULT_CITY_PROFILE } from "../data/cityProfiles";
import type { SimulationRequest } from "./types";

const baseWeights = {
  cost: 0.2,
  floodProtection: 0.3,
  heatProtection: 0.2,
  populationProtection: 0.2,
  recovery: 0.1,
};

function makeRequest(overrides: Partial<SimulationRequest> = {}): SimulationRequest {
  return {
    cityProfile: DEFAULT_CITY_PROFILE,
    scenarioId: "extreme-flood",
    budgetCr: 100,
    selectedInterventionIds: ["drainage-upgrade", "flood-barrier"],
    objectiveWeights: baseWeights,
    simulationCount: 300,
    randomSeed: 2026,
    ...overrides,
  };
}

describe("compareToBaseline", () => {
  it("shows positive improvement across damage, risk, and population for a mitigating strategy", () => {
    const comparison = compareToBaseline(makeRequest());
    expect(comparison.improvement.damageReductionPct).toBeGreaterThan(0);
    expect(comparison.improvement.floodRiskReductionPct).toBeGreaterThan(0);
    expect(comparison.improvement.populationReductionPct).toBeGreaterThan(0);
    expect(comparison.improvement.resilienceDelta).toBeGreaterThan(0);
  });

  it("is reproducible for the same seed and inputs", () => {
    const a = compareToBaseline(makeRequest());
    const b = compareToBaseline(makeRequest());
    expect(a).toEqual(b);
  });

  it("throws when the strategy itself exceeds the budget", () => {
    expect(() =>
      compareToBaseline(
        makeRequest({
          budgetCr: 50,
          selectedInterventionIds: ["drainage-upgrade", "flood-barrier"],
        })
      )
    ).toThrow(SimulationInputError);
  });

  it("shows zero improvement when comparing baseline against itself", () => {
    const comparison = compareToBaseline(makeRequest({ selectedInterventionIds: [] }));
    expect(comparison.improvement.damageReductionPct).toBe(0);
    expect(comparison.improvement.resilienceDelta).toBe(0);
  });
});
