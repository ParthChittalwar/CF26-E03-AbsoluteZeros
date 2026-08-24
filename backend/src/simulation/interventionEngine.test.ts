import { describe, it, expect } from "vitest";
import { evaluateStrategy } from "./interventionEngine";
import { SimulationInputError } from "./errors";

describe("interventionEngine.evaluateStrategy", () => {
  it("sums cost and effects across selected interventions", () => {
    const effect = evaluateStrategy(["drainage-upgrade", "green-roofs"], 100);
    expect(effect.totalCostCr).toBe(60); // 40 + 20
    expect(effect.withinBudget).toBe(true);
    expect(effect.floodReduction).toBeCloseTo(0.35); // 0.30 + 0.05
    expect(effect.heatReduction).toBeCloseTo(0.2); // 0 + 0.20
  });

  it("marks a strategy infeasible when total cost exceeds budget", () => {
    const effect = evaluateStrategy(["flood-barrier", "drainage-upgrade"], 50);
    expect(effect.totalCostCr).toBe(100); // 60 + 40
    expect(effect.withinBudget).toBe(false);
  });

  it("returns a zero-effect baseline when no interventions are selected", () => {
    const effect = evaluateStrategy([], 100);
    expect(effect.totalCostCr).toBe(0);
    expect(effect.withinBudget).toBe(true);
    expect(effect.floodReduction).toBe(0);
    expect(effect.recoveryImprovement).toBe(0);
  });

  it("caps stacked effects at the diminishing-returns ceiling", () => {
    const effect = evaluateStrategy(
      ["drainage-upgrade", "flood-barrier"],
      200
    );
    // raw sum would be 0.30 + 0.50 = 0.80, still under the 0.9 cap
    expect(effect.floodReduction).toBeCloseTo(0.8);
    expect(effect.floodReduction).toBeLessThanOrEqual(0.9);
  });

  it("throws SimulationInputError for an unknown intervention id", () => {
    expect(() => evaluateStrategy(["not-a-real-intervention"], 100)).toThrow(
      SimulationInputError
    );
  });

  it("throws SimulationInputError for a non-positive budget", () => {
    expect(() => evaluateStrategy(["green-roofs"], 0)).toThrow(
      SimulationInputError
    );
  });

  it("does not double-count a duplicate intervention id", () => {
    const withDuplicate = evaluateStrategy(
      ["drainage-upgrade", "drainage-upgrade"],
      100
    );
    const withoutDuplicate = evaluateStrategy(["drainage-upgrade"], 100);
    expect(withDuplicate.totalCostCr).toBe(withoutDuplicate.totalCostCr);
    expect(withDuplicate.floodReduction).toBeCloseTo(
      withoutDuplicate.floodReduction
    );
    expect(withDuplicate.interventionIds).toEqual(["drainage-upgrade"]);
  });
});
