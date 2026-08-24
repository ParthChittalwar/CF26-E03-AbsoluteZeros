import { describe, it, expect } from "vitest";
import { runSensitivityAnalysis } from "./sensitivityAnalysis";
import { DEFAULT_CITY_PROFILE } from "../data/cityProfiles";
import { SCENARIOS } from "../data/scenarios";
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
    selectedInterventionIds: ["drainage-upgrade"],
    objectiveWeights: baseWeights,
    simulationCount: 200,
    randomSeed: 2026,
    ...overrides,
  };
}

describe("runSensitivityAnalysis", () => {
  it("returns all four parameters, ranked descending by impact", () => {
    const results = runSensitivityAnalysis(makeRequest());
    expect(results).toHaveLength(4);
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].impactCr).toBeGreaterThanOrEqual(results[i].impactCr);
    }
  });

  it("sweeps -10% to +10% in 5 steps for every parameter", () => {
    const results = runSensitivityAnalysis(makeRequest());
    for (const r of results) {
      expect(r.points.map((p) => p.deltaPct)).toEqual([-10, -5, 0, 5, 10]);
    }
  });

  it("impact shares sum to approximately 100%", () => {
    const results = runSensitivityAnalysis(makeRequest());
    const total = results.reduce((sum, r) => sum + r.impactSharePct, 0);
    expect(total).toBeCloseTo(100, 5);
  });

  it("is reproducible for the same seed and inputs", () => {
    const a = runSensitivityAnalysis(makeRequest());
    const b = runSensitivityAnalysis(makeRequest());
    expect(a).toEqual(b);
  });

  it("never mutates the shared scenario config", () => {
    const before = JSON.stringify(SCENARIOS);
    runSensitivityAnalysis(makeRequest());
    const after = JSON.stringify(SCENARIOS);
    expect(after).toBe(before);
  });

  it("never mutates the shared city profile passed in", () => {
    const before = JSON.stringify(DEFAULT_CITY_PROFILE);
    runSensitivityAnalysis(makeRequest());
    const after = JSON.stringify(DEFAULT_CITY_PROFILE);
    expect(after).toBe(before);
  });
});
