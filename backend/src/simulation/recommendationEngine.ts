import { resolveScenario, computeHazardProfile } from "./scenarioEngine";
import { evaluateStrategy } from "./interventionEngine";
import { generateFeasibleStrategies } from "./strategyGenerator";
import { simulateStrategy } from "./simulationService";
import { computeDecisionScore, validateObjectiveWeights, DEFAULT_OBJECTIVE_WEIGHTS } from "./scoring";
import { getInterventionById } from "../data/interventions";
import { SimulationInputError } from "./errors";
import type {
  RecommendationRequest,
  RecommendationResponse,
  StrategyRanking,
  SimulationResult,
} from "./types";

// #1 + this many runners-up, matching the "Top 5 strategies" shape
// from the project brief.
const ALTERNATIVES_COUNT = 4;

export function recommendStrategy(
  request: RecommendationRequest
): RecommendationResponse {
  validateRequest(request);
  const objectiveWeights = request.objectiveWeights ?? DEFAULT_OBJECTIVE_WEIGHTS;
  validateObjectiveWeights(objectiveWeights);

  const scenario = resolveScenario(request.scenarioId);
  const hazardProfile = computeHazardProfile(scenario);

  // Baseline (no intervention) under the identical scenario/seed —
  // every strategy's outcome component is measured relative to this.
  const baselineEffect = evaluateStrategy([], request.budgetCr);
  const baselineResult = simulateStrategy(
    request.cityProfile,
    hazardProfile,
    baselineEffect,
    request.simulationCount,
    request.randomSeed,
    objectiveWeights,
    request.budgetCr
  );

  const { totalGenerated, feasible } = generateFeasibleStrategies(
    request.budgetCr
  );

  if (feasible.length === 0) {
    throw new SimulationInputError(
      "No feasible strategy exists within the given budget."
    );
  }

  const rankings: StrategyRanking[] = feasible.map((generated) => {
    // Same seed for every strategy: common random numbers, so every
    // strategy sees the identical sequence of stochastic draws and
    // differences in outcome are due to the strategy, not sampling luck.
    const simulationResult = simulateStrategy(
      request.cityProfile,
      hazardProfile,
      generated.strategyEffect,
      request.simulationCount,
      request.randomSeed,
      objectiveWeights,
      request.budgetCr
    );

    const breakdown = computeDecisionScore(
      generated.strategyEffect,
      simulationResult,
      baselineResult,
      objectiveWeights,
      request.budgetCr
    );

    return {
      strategyId: generated.id,
      interventionIds: generated.strategyEffect.interventionIds,
      interventionNames: generated.strategyEffect.interventionIds.map(
        (id) => getInterventionById(id)?.name ?? id
      ),
      costCr: generated.strategyEffect.totalCostCr,
      maintenanceCostCr: generated.strategyEffect.totalMaintenanceCostCr,
      simulationResult,
      decisionScore: breakdown.decisionScore,
      decisionScoreBreakdown: breakdown,
    };
  });

  rankings.sort((a, b) => b.decisionScore - a.decisionScore);

  const [recommended, ...rest] = rankings;
  const alternatives = rest.slice(0, ALTERNATIVES_COUNT);

  return {
    scenarioId: request.scenarioId,
    budgetCr: request.budgetCr,
    baseline: { simulationResult: baselineResult },
    totalStrategiesGenerated: totalGenerated,
    feasibleStrategiesEvaluated: rankings.length,
    recommended,
    alternatives,
    reason: buildReason(recommended, baselineResult, request.budgetCr),
  };
}

function buildReason(
  top: StrategyRanking,
  baseline: SimulationResult,
  budgetCr: number
): string {
  const damageReductionPct =
    baseline.expectedDamageCr > 0
      ? Math.round(
          (1 - top.simulationResult.expectedDamageCr / baseline.expectedDamageCr) *
            100
        )
      : 0;
  const budgetPct = budgetCr > 0 ? Math.round((top.costCr / budgetCr) * 100) : 0;
  const names =
    top.interventionNames.length > 0
      ? top.interventionNames.join(" + ")
      : "No intervention";

  return (
    `${names} costs \u20b9${top.costCr} Cr (${budgetPct}% of budget) and reduces ` +
    `expected damage by ${damageReductionPct}% versus no intervention, scoring ` +
    `${top.decisionScore.toFixed(3)} under the current objective weights.`
  );
}

function validateRequest(request: RecommendationRequest): void {
  if (!request || !request.cityProfile) {
    throw new SimulationInputError("cityProfile is required.");
  }
  if (!Number.isFinite(request.budgetCr) || request.budgetCr <= 0) {
    throw new SimulationInputError("budgetCr must be a positive number.");
  }
  if (request.randomSeed === undefined || request.randomSeed === null) {
    throw new SimulationInputError("randomSeed is required for reproducibility.");
  }
}
