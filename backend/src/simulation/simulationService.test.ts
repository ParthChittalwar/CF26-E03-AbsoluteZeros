import { describe, it, expect } from "vitest";
import { runSimulation } from "./simulationService";
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
    selectedInterventionIds: [],
    objectiveWeights: baseWeights,
    simulationCount: 300,
    randomSeed: 2026,
    ...overrides,
  };
}

describe("runSimulation - reproducibility", () => {
  it("returns an identical result for the same seed and inputs", () => {
    const request = makeRequest({
      selectedInterventionIds: ["drainage-upgrade", "flood-barrier"],
    });
    const a = runSimulation(request);
    const b = runSimulation(request);
    expect(a).toEqual(b);
  });

  it("returns a different result for a different seed, same inputs otherwise", () => {
    const a = runSimulation(makeRequest({ randomSeed: 1 }));
    const b = runSimulation(makeRequest({ randomSeed: 2 }));
    expect(a.feasible && b.feasible).toBe(true);
    if (a.feasible && b.feasible) {
      expect(a.result.expectedDamageCr).not.toBe(b.result.expectedDamageCr);
    }
  });
});

describe("runSimulation - budget constraint", () => {
  it("marks a strategy infeasible when it exceeds the budget", () => {
    const outcome = runSimulation(
      makeRequest({
        budgetCr: 50,
        selectedInterventionIds: ["flood-barrier", "drainage-upgrade"], // 100 Cr
      })
    );
    expect(outcome.feasible).toBe(false);
    if (!outcome.feasible) {
      expect(outcome.reason).toMatch(/exceeding/i);
    }
  });

  it("accepts a strategy exactly at the budget limit", () => {
    const outcome = runSimulation(
      makeRequest({
        budgetCr: 100,
        selectedInterventionIds: ["flood-barrier", "drainage-upgrade"], // exactly 100 Cr
      })
    );
    expect(outcome.feasible).toBe(true);
  });
});

describe("runSimulation - baseline vs intervention", () => {
  it("shows lower expected damage and higher resilience for a mitigating strategy than the no-intervention baseline", () => {
    const seed = 2026;
    const baselineOutcome = runSimulation(
      makeRequest({ selectedInterventionIds: [], randomSeed: seed })
    );
    const strategyOutcome = runSimulation(
      makeRequest({
        selectedInterventionIds: ["drainage-upgrade", "flood-barrier"],
        randomSeed: seed,
      })
    );

    expect(baselineOutcome.feasible).toBe(true);
    expect(strategyOutcome.feasible).toBe(true);
    if (baselineOutcome.feasible && strategyOutcome.feasible) {
      expect(strategyOutcome.result.expectedDamageCr).toBeLessThan(
        baselineOutcome.result.expectedDamageCr
      );
      expect(strategyOutcome.result.populationAffected).toBeLessThan(
        baselineOutcome.result.populationAffected
      );
      expect(strategyOutcome.result.recoveryTimeMonths).toBeLessThan(
        baselineOutcome.result.recoveryTimeMonths
      );
      expect(strategyOutcome.result.resilienceScore).toBeGreaterThan(
        baselineOutcome.result.resilienceScore
      );
    }
  });
});

describe("runSimulation - objective weight validation", () => {
  it("rejects a negative weight with a clear error", () => {
    expect(() =>
      runSimulation(
        makeRequest({
          objectiveWeights: { ...baseWeights, cost: -0.1 },
        })
      )
    ).toThrow(SimulationInputError);
  });

  it("rejects NaN in a weight", () => {
    expect(() =>
      runSimulation(
        makeRequest({
          objectiveWeights: { ...baseWeights, recovery: NaN },
        })
      )
    ).toThrow(SimulationInputError);
  });

  it("rejects all-zero weights", () => {
    expect(() =>
      runSimulation(
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
    ).toThrow(SimulationInputError);
  });

  it("applies the documented default when objectiveWeights is omitted entirely", () => {
    const request = makeRequest();
    delete request.objectiveWeights;
    const outcome = runSimulation(request);
    expect(outcome.feasible).toBe(true);
  });
});

describe("runSimulation - invalid input", () => {
  it("throws SimulationInputError for an unknown scenario id", () => {
    expect(() => runSimulation(makeRequest({ scenarioId: "not-real" }))).toThrow(
      SimulationInputError
    );
  });

  it("throws SimulationInputError for a missing random seed", () => {
    const request = makeRequest();
    // @ts-expect-error deliberately testing runtime validation of a malformed request
    delete request.randomSeed;
    expect(() => runSimulation(request)).toThrow(SimulationInputError);
  });

  it("throws SimulationInputError for a zero budget", () => {
    expect(() => runSimulation(makeRequest({ budgetCr: 0 }))).toThrow(
      SimulationInputError
    );
  });
});
