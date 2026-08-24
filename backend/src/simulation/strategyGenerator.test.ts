import { describe, it, expect } from "vitest";
import {
  generateAllCombinations,
  generateFeasibleStrategies,
} from "./strategyGenerator";
import { INTERVENTIONS } from "../data/interventions";

describe("generateAllCombinations", () => {
  it("generates 2^n - 1 non-empty combinations for n ids", () => {
    const combos = generateAllCombinations(["a", "b", "c"]);
    expect(combos.length).toBe(7); // 2^3 - 1
  });

  it("never generates the empty combination", () => {
    const combos = generateAllCombinations(["a", "b"]);
    expect(combos.some((c) => c.length === 0)).toBe(false);
  });

  it("generates every expected subset exactly once for a known small set", () => {
    const combos = generateAllCombinations(["x", "y"]).map((c) =>
      [...c].sort().join(",")
    );
    expect(new Set(combos)).toEqual(new Set(["x", "y", "x,y"]));
    expect(combos.length).toBe(3);
  });

  it("scales correctly with the currently configured intervention count", () => {
    const ids = INTERVENTIONS.map((i) => i.id);
    const combos = generateAllCombinations(ids);
    expect(combos.length).toBe(2 ** ids.length - 1);
  });
});

describe("generateFeasibleStrategies", () => {
  it("excludes combinations that exceed the budget", () => {
    const { feasible } = generateFeasibleStrategies(25); // only a single cheap intervention fits
    expect(feasible.length).toBeGreaterThan(0);
    for (const s of feasible) {
      expect(s.strategyEffect.totalCostCr).toBeLessThanOrEqual(25);
    }
  });

  it("reports the total generated count even when most are infeasible", () => {
    const allIds = INTERVENTIONS.map((i) => i.id);
    const { totalGenerated, feasible } = generateFeasibleStrategies(25);
    expect(totalGenerated).toBe(2 ** allIds.length - 1);
    expect(feasible.length).toBeLessThan(totalGenerated);
  });

  it("includes every single intervention alone when the budget covers the most expensive one", () => {
    const maxCost = Math.max(...INTERVENTIONS.map((i) => i.costCr));
    const { feasible } = generateFeasibleStrategies(maxCost);
    for (const intervention of INTERVENTIONS) {
      const found = feasible.some(
        (s) =>
          s.strategyEffect.interventionIds.length === 1 &&
          s.strategyEffect.interventionIds[0] === intervention.id
      );
      expect(found).toBe(true);
    }
  });

  it("returns every combination as feasible when the budget covers all interventions combined", () => {
    const totalCost = INTERVENTIONS.reduce((sum, i) => sum + i.costCr, 0);
    const { totalGenerated, feasible } = generateFeasibleStrategies(totalCost);
    expect(feasible.length).toBe(totalGenerated);
  });
});
