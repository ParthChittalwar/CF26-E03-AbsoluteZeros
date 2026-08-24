import { resolveScenario, computeHazardProfile } from "./scenarioEngine";
import { evaluateStrategy } from "./interventionEngine";
import { runMonteCarlo } from "./monteCarlo";
import { computeResilienceScore, validateObjectiveWeights, DEFAULT_OBJECTIVE_WEIGHTS } from "./scoring";
import { createRNG } from "./random";
import { SimulationInputError } from "./errors";
import type {
  HazardProfile,
  ObjectiveWeights,
  SimulationRequest,
  SimulationResult,
  StrategyEffect,
} from "./types";
import type { CityProfile } from "../data/cityProfiles";

export type SimulationOutcome =
  | { feasible: true; strategyEffect: StrategyEffect; result: SimulationResult }
  | { feasible: false; strategyEffect: StrategyEffect; reason: string };

// Shared by the single-strategy endpoint and the Phase 3 multi-strategy
// recommendation engine, so both run the exact same Monte Carlo +
// scoring path instead of two copies of it.
export function simulateStrategy(
  cityProfile: CityProfile,
  hazardProfile: HazardProfile,
  strategyEffect: StrategyEffect,
  simulationCount: number,
  randomSeed: number,
  objectiveWeights: ObjectiveWeights,
  budgetCr: number
): SimulationResult {
  const rng = createRNG(randomSeed);
  const monteCarlo = runMonteCarlo(
    cityProfile,
    hazardProfile,
    strategyEffect,
    simulationCount,
    rng
  );
  const resilienceScore = computeResilienceScore(
    strategyEffect,
    objectiveWeights,
    budgetCr
  );

  return {
    expectedDamageCr: monteCarlo.uncertainty.mean,
    averageFloodRisk: monteCarlo.averageFloodRisk,
    averageHeatRisk: monteCarlo.averageHeatRisk,
    populationAffected: monteCarlo.averagePopulationAffected,
    recoveryTimeMonths: monteCarlo.averageRecoveryMonths,
    resilienceScore,
    uncertainty: monteCarlo.uncertainty,
  };
}

export function runSimulation(request: SimulationRequest): SimulationOutcome {
  validateRequest(request);
  const objectiveWeights = request.objectiveWeights ?? DEFAULT_OBJECTIVE_WEIGHTS;
  validateObjectiveWeights(objectiveWeights);

  const scenario = resolveScenario(request.scenarioId);
  const hazardProfile = computeHazardProfile(scenario);
  const strategyEffect = evaluateStrategy(
    request.selectedInterventionIds,
    request.budgetCr
  );

  if (!strategyEffect.withinBudget) {
    return {
      feasible: false,
      strategyEffect,
      reason: `Strategy costs \u20b9${strategyEffect.totalCostCr} Cr, exceeding the \u20b9${request.budgetCr} Cr budget.`,
    };
  }

  const result = simulateStrategy(
    request.cityProfile,
    hazardProfile,
    strategyEffect,
    request.simulationCount,
    request.randomSeed,
    objectiveWeights,
    request.budgetCr
  );

  return { feasible: true, strategyEffect, result };
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
