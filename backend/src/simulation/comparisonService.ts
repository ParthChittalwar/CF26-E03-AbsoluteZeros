import { resolveScenario, computeHazardProfile } from "./scenarioEngine";
import { evaluateStrategy } from "./interventionEngine";
import { simulateStrategy } from "./simulationService";
import { validateObjectiveWeights, DEFAULT_OBJECTIVE_WEIGHTS } from "./scoring";
import { SimulationInputError } from "./errors";
import type { SimulationRequest, SimulationResult, ComparisonResult } from "./types";

// Reuses simulateStrategy for both sides — no simulation logic is
// duplicated here, only the framing (baseline vs. one strategy) is new.
export function compareToBaseline(request: SimulationRequest): ComparisonResult {
  validateRequest(request);
  const objectiveWeights = request.objectiveWeights ?? DEFAULT_OBJECTIVE_WEIGHTS;
  validateObjectiveWeights(objectiveWeights);

  const scenario = resolveScenario(request.scenarioId);
  const hazardProfile = computeHazardProfile(scenario);

  const baselineEffect = evaluateStrategy([], request.budgetCr);
  const baseline = simulateStrategy(
    request.cityProfile,
    hazardProfile,
    baselineEffect,
    request.simulationCount,
    request.randomSeed,
    objectiveWeights,
    request.budgetCr
  );

  const strategyEffect = evaluateStrategy(
    request.selectedInterventionIds,
    request.budgetCr
  );
  if (!strategyEffect.withinBudget) {
    throw new SimulationInputError(
      `Strategy costs \u20b9${strategyEffect.totalCostCr} Cr, exceeding the \u20b9${request.budgetCr} Cr budget.`
    );
  }

  const strategy = simulateStrategy(
    request.cityProfile,
    hazardProfile,
    strategyEffect,
    request.simulationCount,
    request.randomSeed, // same seed as baseline: a fair, like-for-like comparison
    objectiveWeights,
    request.budgetCr
  );

  return {
    baseline,
    strategy,
    strategyEffect,
    improvement: {
      damageReductionPct: pctReduction(baseline.expectedDamageCr, strategy.expectedDamageCr),
      floodRiskReductionPct: pctReduction(baseline.averageFloodRisk, strategy.averageFloodRisk),
      heatRiskReductionPct: pctReduction(baseline.averageHeatRisk, strategy.averageHeatRisk),
      populationReductionPct: pctReduction(baseline.populationAffected, strategy.populationAffected),
      recoveryImprovementPct: pctReduction(baseline.recoveryTimeMonths, strategy.recoveryTimeMonths),
      resilienceDelta: strategy.resilienceScore - baseline.resilienceScore,
      successProbabilityDelta:
        strategy.uncertainty.successProbability - baseline.uncertainty.successProbability,
    },
  };
}

function pctReduction(baselineValue: number, strategyValue: number): number {
  if (baselineValue <= 0) return 0;
  return ((baselineValue - strategyValue) / baselineValue) * 100;
}

function validateRequest(request: SimulationRequest): void {
  if (!request || !request.cityProfile) {
    throw new SimulationInputError("cityProfile is required.");
  }
  if (!Number.isFinite(request.budgetCr) || request.budgetCr <= 0) {
    throw new SimulationInputError("budgetCr must be a positive number.");
  }
  if (!Array.isArray(request.selectedInterventionIds)) {
    throw new SimulationInputError("selectedInterventionIds must be an array.");
  }
  if (request.randomSeed === undefined || request.randomSeed === null) {
    throw new SimulationInputError("randomSeed is required for reproducibility.");
  }
}
