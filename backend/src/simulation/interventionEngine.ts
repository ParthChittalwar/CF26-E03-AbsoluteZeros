import { getInterventionsByIds } from "../data/interventions";
import type { StrategyEffect } from "./types";
import { clamp01 } from "./mathUtils";
import { SimulationInputError } from "./errors";

// Diminishing-returns ceiling: stacking interventions can't mitigate
// more than 90% of a hazard. Prototype assumption.
const MAX_EFFECT_CAP = 0.9;

function capEffect(value: number): number {
  return Math.min(value, MAX_EFFECT_CAP);
}

export function evaluateStrategy(
  interventionIds: string[],
  budgetCr: number
): StrategyEffect {
  if (!Number.isFinite(budgetCr) || budgetCr <= 0) {
    throw new SimulationInputError("Budget must be a positive number.");
  }

  // Dedupe first: a client (or a malformed request) sending the same
  // intervention id twice must not double-count its cost or effects.
  const uniqueIds = Array.from(new Set(interventionIds));

  const interventions = getInterventionsByIds(uniqueIds);
  if (uniqueIds.length > 0 && interventions.length !== uniqueIds.length) {
    throw new SimulationInputError(
      "One or more selected intervention ids are unknown."
    );
  }

  const totalCostCr = interventions.reduce((sum, i) => sum + i.costCr, 0);
  // Informational only for now — not subtracted from budget and not
  // part of the feasibility check. See README "Phase 3 assumptions".
  const totalMaintenanceCostCr = interventions.reduce(
    (sum, i) => sum + i.maintenanceCostCr,
    0
  );

  return {
    interventionIds: uniqueIds,
    totalCostCr,
    totalMaintenanceCostCr,
    withinBudget: totalCostCr <= budgetCr,
    floodReduction: capEffect(
      clamp01(interventions.reduce((s, i) => s + i.floodReduction, 0))
    ),
    heatReduction: capEffect(
      clamp01(interventions.reduce((s, i) => s + i.heatReduction, 0))
    ),
    infrastructureProtection: capEffect(
      clamp01(interventions.reduce((s, i) => s + i.infrastructureProtection, 0))
    ),
    populationProtection: capEffect(
      clamp01(interventions.reduce((s, i) => s + i.populationProtection, 0))
    ),
    recoveryImprovement: capEffect(
      clamp01(interventions.reduce((s, i) => s + i.recoveryImprovement, 0))
    ),
  };
}
