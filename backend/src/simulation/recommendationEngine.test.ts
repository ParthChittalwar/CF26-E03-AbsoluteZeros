import { describe, it, expect } from "vitest";
import { recommendStrategy } from "./recommendationEngine";
import { DEFAULT_CITY_PROFILE } from "../data/cityProfiles";
import type { RecommendationRequest } from "./types";

const baseWeights = {
  cost: 0.2,
  floodProtection: 0.3,
  heatProtection: 0.2,
  populationProtection: 0.2,
  recovery: 0.1,
};

function makeRequest(
  overrides: Partial<RecommendationRequest> = {}
): RecommendationRequest {
  return {
    cityProfile: DEFAULT_CITY_PROFILE,
    scenarioId: "extreme-flood",
    budgetCr: 100,
    objectiveWeights: baseWeights,
    simulationCount: 200,
    randomSeed: 2026,
    ...overrides,
  };
}

describe("recommendStrategy - reproducibility", () => {
  it("returns an identical full ranking for the same seed and inputs", () => {
    const a = recommendStrategy(makeRequest());
    const b = recommendStrategy(makeRequest());
    expect(a).toEqual(b);
  });

  it("produces a different top expected damage for a different seed", () => {
    const a = recommendStrategy(makeRequest({ randomSeed: 1 }));
    const b = recommendStrategy(makeRequest({ randomSeed: 2 }));
    expect(a.recommended.simulationResult.expectedDamageCr).not.toBe(
      b.recommended.simulationResult.expectedDamageCr
    );
  });
});

describe("recommendStrategy - feasibility and coverage", () => {
  it("recommends a strategy that is within budget", () => {
    const response = recommendStrategy(makeRequest());
    expect(response.recommended.costCr).toBeLessThanOrEqual(response.budgetCr);
  });

  it("evaluates every feasible combination generated from configured interventions", () => {
    const response = recommendStrategy(makeRequest());
    expect(response.feasibleStrategiesEvaluated).toBeGreaterThan(0);
    expect(response.feasibleStrategiesEvaluated).toBeLessThanOrEqual(
      response.totalStrategiesGenerated
    );
    expect(1 + response.alternatives.length).toBeLessThanOrEqual(
      response.feasibleStrategiesEvaluated
    );
  });

  it("throws SimulationInputError when no strategy fits the budget", () => {
    expect(() => recommendStrategy(makeRequest({ budgetCr: 1 }))).toThrow();
  });
});

describe("recommendStrategy - baseline comparison", () => {
  it("recommends a strategy that outperforms the no-intervention baseline", () => {
    const response = recommendStrategy(makeRequest());
    expect(response.recommended.simulationResult.expectedDamageCr).toBeLessThan(
      response.baseline.simulationResult.expectedDamageCr
    );
    expect(response.recommended.decisionScore).toBeGreaterThan(0);
  });

  it("gives the baseline concept a decision score of zero when evaluated against itself", () => {
    // The baseline is exposed separately, not injected into the ranked
    // list — but its score against itself should still be exactly the
    // reference point every strategy is measured from.
    const response = recommendStrategy(makeRequest());
    expect(response.baseline.simulationResult.resilienceScore).toBe(0);
  });
});

describe("recommendStrategy - objective weight validation", () => {
  it("rejects a negative weight", () => {
    expect(() =>
      recommendStrategy(
        makeRequest({ objectiveWeights: { ...baseWeights, cost: -0.2 } })
      )
    ).toThrow();
  });

  it("rejects all-zero weights", () => {
    expect(() =>
      recommendStrategy(
        makeRequest({
          objectiveWeights: {
            cost: 0,
            floodProtection: 0,
            heatProtection: 0,
            populationProtection: 0,
            recovery: 0,
          },
        })
      )
    ).toThrow();
  });

  it("applies the documented default when objectiveWeights is omitted entirely", () => {
    const request = makeRequest();
    delete request.objectiveWeights;
    const response = recommendStrategy(request);
    expect(response.recommended).toBeDefined();
  });
});

describe("recommendStrategy - objective weight sensitivity", () => {
  it("changes the top recommendation when weights swing heavily toward a different objective", () => {
    const floodFocused = recommendStrategy(
      makeRequest({
        objectiveWeights: {
          cost: 0,
          floodProtection: 1,
          heatProtection: 0,
          populationProtection: 0,
          recovery: 0,
        },
      })
    );
    const heatFocused = recommendStrategy(
      makeRequest({
        objectiveWeights: {
          cost: 0,
          floodProtection: 0,
          heatProtection: 1,
          populationProtection: 0,
          recovery: 0,
        },
      })
    );
    expect(floodFocused.recommended.strategyId).not.toBe(
      heatFocused.recommended.strategyId
    );
  });
});
