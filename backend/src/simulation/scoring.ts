import type {
  StrategyEffect,
  ObjectiveWeights,
  SimulationResult,
  DecisionScoreBreakdown,
} from "./types";
import { clamp01 } from "./mathUtils";

import { SimulationInputError } from "./errors";

// Used only when objectiveWeights is entirely omitted from a request.
// Invalid (present but malformed) weights are rejected, not defaulted.
export const DEFAULT_OBJECTIVE_WEIGHTS: ObjectiveWeights = {
  cost: 0.2,
  floodProtection: 0.2,
  heatProtection: 0.2,
  populationProtection: 0.2,
  recovery: 0.2,
};

// Phase 3 silently fell back to equal weights on invalid input, which
// hid negative weights, NaN, and Infinity instead of surfacing them.
// Fixed: invalid weights are now rejected with a clear error.
export function validateObjectiveWeights(weights: ObjectiveWeights): void {
  if (!weights) {
    throw new SimulationInputError("objectiveWeights is required.");
  }
  const entries: Array<[string, number]> = [
    ["cost", weights.cost],
    ["floodProtection", weights.floodProtection],
    ["heatProtection", weights.heatProtection],
    ["populationProtection", weights.populationProtection],
    ["recovery", weights.recovery],
  ];
  for (const [key, value] of entries) {
    if (typeof value !== "number" || !Number.isFinite(value)) {
      throw new SimulationInputError(
        `objectiveWeights.${key} must be a finite number.`
      );
    }
    if (value < 0) {
      throw new SimulationInputError(
        `objectiveWeights.${key} must not be negative.`
      );
    }
  }
  if (entries.every(([, value]) => value === 0)) {
    throw new SimulationInputError(
      "At least one objective weight must be greater than zero."
    );
  }
}

export function normalizeWeights(weights: ObjectiveWeights): ObjectiveWeights {
  validateObjectiveWeights(weights);
  const sum =
    weights.cost +
    weights.floodProtection +
    weights.heatProtection +
    weights.populationProtection +
    weights.recovery;

  return {
    cost: weights.cost / sum,
    floodProtection: weights.floodProtection / sum,
    heatProtection: weights.heatProtection / sum,
    populationProtection: weights.populationProtection / sum,
    recovery: weights.recovery / sum,
  };
}

// resilienceScore = w1*floodReduction + w2*heatReduction
//                  + w3*populationProtection + w4*recoveryImprovement
//                  - w5*normalizedCost
// normalizedCost = totalCost / budget, capped at 1 (0 if budget spent is 0)
export function computeResilienceScore(
  strategyEffect: StrategyEffect,
  weights: ObjectiveWeights,
  budgetCr: number
): number {
  const w = normalizeWeights(weights);
  const normalizedCost =
    budgetCr > 0 ? Math.min(strategyEffect.totalCostCr / budgetCr, 1) : 0;

  return (
    w.floodProtection * strategyEffect.floodReduction +
    w.heatProtection * strategyEffect.heatReduction +
    w.populationProtection * strategyEffect.populationProtection +
    w.recovery * strategyEffect.recoveryImprovement -
    w.cost * normalizedCost
  );
}

// --- Phase 3: decision score for ranking strategies ---
//
// Each objective's component blends two things equally:
//   - the DESIGN fraction (strategyEffect's declared mitigation, e.g.
//     floodReduction) — what the intervention catalog claims it does
//   - the OUTCOME fraction (this strategy's simulated result vs. the
//     no-intervention baseline, same scenario/seed) — what actually
//     happened when it ran through Monte Carlo
// This is the requested improvement over computeResilienceScore
// above: that formula only looks at declared effects. This one also
// grounds the ranking in what the simulation actually produced.
//
// decisionScore = w1*floodComponent + w2*heatComponent
//               + w3*populationComponent + w4*recoveryComponent
//               - w5*normalizedCost
// componentX = clamp01(0.5*designFractionX + 0.5*outcomeFractionX)
// outcomeFractionX = clamp01(1 - strategyValueX / baselineValueX)

function outcomeFraction(baselineValue: number, strategyValue: number): number {
  if (baselineValue <= 0) return 0;
  return clamp01(1 - strategyValue / baselineValue);
}

function blendedComponent(designFraction: number, outcomeFractionValue: number): number {
  return clamp01(0.5 * designFraction + 0.5 * outcomeFractionValue);
}

export function computeDecisionScore(
  strategyEffect: StrategyEffect,
  simulationResult: SimulationResult,
  baselineResult: SimulationResult,
  weights: ObjectiveWeights,
  budgetCr: number
): DecisionScoreBreakdown {
  const w = normalizeWeights(weights);

  const floodComponent = blendedComponent(
    strategyEffect.floodReduction,
    outcomeFraction(baselineResult.averageFloodRisk, simulationResult.averageFloodRisk)
  );
  const heatComponent = blendedComponent(
    strategyEffect.heatReduction,
    outcomeFraction(baselineResult.averageHeatRisk, simulationResult.averageHeatRisk)
  );
  const populationComponent = blendedComponent(
    strategyEffect.populationProtection,
    outcomeFraction(baselineResult.populationAffected, simulationResult.populationAffected)
  );
  const recoveryComponent = blendedComponent(
    strategyEffect.recoveryImprovement,
    outcomeFraction(baselineResult.recoveryTimeMonths, simulationResult.recoveryTimeMonths)
  );

  const normalizedCost =
    budgetCr > 0 ? Math.min(strategyEffect.totalCostCr / budgetCr, 1) : 0;
  const costPenalty = w.cost * normalizedCost;

  const decisionScore =
    w.floodProtection * floodComponent +
    w.heatProtection * heatComponent +
    w.populationProtection * populationComponent +
    w.recovery * recoveryComponent -
    costPenalty;

  return {
    floodComponent,
    heatComponent,
    populationComponent,
    recoveryComponent,
    costPenalty,
    decisionScore,
  };
}
