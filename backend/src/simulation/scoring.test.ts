import { describe, it, expect } from "vitest";
import {
  computeResilienceScore,
  normalizeWeights,
  computeDecisionScore,
  validateObjectiveWeights,
} from "./scoring";
import { SimulationInputError } from "./errors";
import type { StrategyEffect, ObjectiveWeights, SimulationResult } from "./types";

const weights: ObjectiveWeights = {
  cost: 0.2,
  floodProtection: 0.3,
  heatProtection: 0.2,
  populationProtection: 0.2,
  recovery: 0.1,
};

const baseline: StrategyEffect = {
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

const strategy: StrategyEffect = {
  ...baseline,
  interventionIds: ["drainage-upgrade", "flood-barrier"],
  totalCostCr: 100,
  floodReduction: 0.8,
  populationProtection: 0.25,
  recoveryImprovement: 0.35,
};

describe("computeResilienceScore", () => {
  it("scores an untouched baseline (no cost, no mitigation) as exactly zero", () => {
    expect(computeResilienceScore(baseline, weights, 100)).toBe(0);
  });

  it("matches the documented weighted formula for a known strategy", () => {
    const score = computeResilienceScore(strategy, weights, 100);
    // normalizedCost = 100/100 = 1
    const expected = 0.3 * 0.8 + 0.2 * 0 + 0.2 * 0.25 + 0.1 * 0.35 - 0.2 * 1;
    expect(score).toBeCloseTo(expected, 10);
  });

  it("gives a strategy that stays under budget a higher score than one that spends it all, all else equal", () => {
    const cheap = { ...strategy, totalCostCr: 40 };
    const cheapScore = computeResilienceScore(cheap, weights, 100);
    const fullSpendScore = computeResilienceScore(strategy, weights, 100);
    expect(cheapScore).toBeGreaterThan(fullSpendScore);
  });
});

describe("normalizeWeights", () => {
  it("rescales weights that do not sum to 1", () => {
    const raw: ObjectiveWeights = {
      cost: 1,
      floodProtection: 1,
      heatProtection: 1,
      populationProtection: 1,
      recovery: 1,
    };
    const normalized = normalizeWeights(raw);
    const sum =
      normalized.cost +
      normalized.floodProtection +
      normalized.heatProtection +
      normalized.populationProtection +
      normalized.recovery;
    expect(sum).toBeCloseTo(1, 10);
    expect(normalized.cost).toBeCloseTo(0.2, 10);
  });

  it("rejects weights where every value is zero (Phase 3's silent fallback is now an error)", () => {
    const zero: ObjectiveWeights = {
      cost: 0,
      floodProtection: 0,
      heatProtection: 0,
      populationProtection: 0,
      recovery: 0,
    };
    expect(() => normalizeWeights(zero)).toThrow(SimulationInputError);
  });
});

describe("validateObjectiveWeights", () => {
  const valid: ObjectiveWeights = {
    cost: 0.2,
    floodProtection: 0.3,
    heatProtection: 0.2,
    populationProtection: 0.2,
    recovery: 0.1,
  };

  it("accepts valid weights", () => {
    expect(() => validateObjectiveWeights(valid)).not.toThrow();
  });

  it("rejects a negative weight", () => {
    expect(() =>
      validateObjectiveWeights({ ...valid, cost: -0.1 })
    ).toThrow(SimulationInputError);
  });

  it("rejects NaN", () => {
    expect(() =>
      validateObjectiveWeights({ ...valid, floodProtection: NaN })
    ).toThrow(SimulationInputError);
  });

  it("rejects Infinity", () => {
    expect(() =>
      validateObjectiveWeights({ ...valid, recovery: Infinity })
    ).toThrow(SimulationInputError);
  });

  it("rejects all-zero weights", () => {
    expect(() =>
      validateObjectiveWeights({
        cost: 0,
        floodProtection: 0,
        heatProtection: 0,
        populationProtection: 0,
        recovery: 0,
      })
    ).toThrow(SimulationInputError);
  });

  it("accepts weights that do not sum to 1, since normalizeWeights rescales them", () => {
    const unnormalized: ObjectiveWeights = {
      cost: 1,
      floodProtection: 1,
      heatProtection: 1,
      populationProtection: 1,
      recovery: 1,
    };
    expect(() => validateObjectiveWeights(unnormalized)).not.toThrow();
    const normalized = normalizeWeights(unnormalized);
    expect(normalized.cost).toBeCloseTo(0.2, 10);
  });
});

describe("computeDecisionScore", () => {
  const baselineResult: SimulationResult = {
    expectedDamageCr: 32,
    averageFloodRisk: 0.88,
    averageHeatRisk: 0.144,
    populationAffected: 1206000,
    recoveryTimeMonths: 30.5,
    resilienceScore: 0,
    uncertainty: {
      mean: 32,
      median: 32,
      min: 24,
      max: 37,
      stdDev: 3,
      successProbability: 0,
    },
  };

  const doNothingEffect: StrategyEffect = { ...baseline };

  const mitigatedEffect: StrategyEffect = {
    ...baseline,
    interventionIds: ["drainage-upgrade", "flood-barrier"],
    totalCostCr: 100,
    floodReduction: 0.8,
    populationProtection: 0.25,
    recoveryImprovement: 0.35,
  };

  const mitigatedResult: SimulationResult = {
    expectedDamageCr: 5.4,
    averageFloodRisk: 0.176,
    averageHeatRisk: 0.144,
    populationAffected: 246000,
    recoveryTimeMonths: 8.9,
    resilienceScore: 0.125,
    uncertainty: {
      mean: 5.4,
      median: 5.4,
      min: 4.3,
      max: 6.5,
      stdDev: 0.4,
      successProbability: 1,
    },
  };

  it("scores the baseline against itself as exactly zero", () => {
    const score = computeDecisionScore(
      doNothingEffect,
      baselineResult,
      baselineResult,
      weights,
      100
    );
    expect(score.decisionScore).toBe(0);
  });

  it("gives an effective mitigating strategy a higher decision score than doing nothing", () => {
    const doNothingScore = computeDecisionScore(
      doNothingEffect,
      baselineResult,
      baselineResult,
      weights,
      100
    );
    const mitigatedScore = computeDecisionScore(
      mitigatedEffect,
      mitigatedResult,
      baselineResult,
      weights,
      100
    );
    expect(mitigatedScore.decisionScore).toBeGreaterThan(
      doNothingScore.decisionScore
    );
  });

  it("keeps every blended component within 0 and 1", () => {
    const score = computeDecisionScore(
      mitigatedEffect,
      mitigatedResult,
      baselineResult,
      weights,
      100
    );
    for (const value of [
      score.floodComponent,
      score.heatComponent,
      score.populationComponent,
      score.recoveryComponent,
    ]) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(1);
    }
  });
});
