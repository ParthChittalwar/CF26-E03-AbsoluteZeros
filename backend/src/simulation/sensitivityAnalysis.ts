import { resolveScenario, computeHazardProfile } from "./scenarioEngine";
import { evaluateStrategy } from "./interventionEngine";
import { simulateStrategy } from "./simulationService";
import { validateObjectiveWeights, DEFAULT_OBJECTIVE_WEIGHTS } from "./scoring";
import { SimulationInputError } from "./errors";
import { clamp01 } from "./mathUtils";
import type { CityProfile } from "../data/cityProfiles";
import type { ScenarioConfig } from "../data/scenarios";
import type {
  SimulationRequest,
  StrategyEffect,
  SensitivityParameterName,
  SensitivityParameterResult,
} from "./types";

const DELTA_PERCENTAGES = [-10, -5, 0, 5, 10];

const PARAMETERS: SensitivityParameterName[] = [
  "rainfallIntensity",
  "temperatureIncrease",
  "interventionEffectiveness",
  "infrastructureVulnerability",
];

interface PerturbedInputs {
  scenario: ScenarioConfig;
  cityProfile: CityProfile;
  strategyEffect: StrategyEffect;
}

// Never mutates the shared config singletons — always returns shallow
// copies with exactly one field scaled by (1 + deltaPct/100).
function applyPerturbation(
  parameter: SensitivityParameterName,
  deltaPct: number,
  scenario: ScenarioConfig,
  cityProfile: CityProfile,
  strategyEffect: StrategyEffect
): PerturbedInputs {
  const factor = 1 + deltaPct / 100;

  if (parameter === "rainfallIntensity") {
    return {
      scenario: { ...scenario, rainfallIntensityMultiplier: scenario.rainfallIntensityMultiplier * factor },
      cityProfile,
      strategyEffect,
    };
  }
  if (parameter === "temperatureIncrease") {
    return {
      scenario: { ...scenario, temperatureIncreaseC: scenario.temperatureIncreaseC * factor },
      cityProfile,
      strategyEffect,
    };
  }
  if (parameter === "infrastructureVulnerability") {
    return {
      scenario,
      cityProfile: {
        ...cityProfile,
        infrastructureVulnerability: clamp01(cityProfile.infrastructureVulnerability * factor),
      },
      strategyEffect,
    };
  }
  // interventionEffectiveness: scales every declared mitigation fraction together
  return {
    scenario,
    cityProfile,
    strategyEffect: {
      ...strategyEffect,
      floodReduction: clamp01(strategyEffect.floodReduction * factor),
      heatReduction: clamp01(strategyEffect.heatReduction * factor),
      infrastructureProtection: clamp01(strategyEffect.infrastructureProtection * factor),
      populationProtection: clamp01(strategyEffect.populationProtection * factor),
      recoveryImprovement: clamp01(strategyEffect.recoveryImprovement * factor),
    },
  };
}

// Answers "which assumptions most affect the result": for each
// parameter, holds everything else fixed, sweeps -10%..+10%, and
// measures the resulting swing in expected damage. Ranked descending
// by impact. Reuses the existing engine end to end — no new risk math.
export function runSensitivityAnalysis(
  request: SimulationRequest
): SensitivityParameterResult[] {
  validateRequest(request);
  const objectiveWeights = request.objectiveWeights ?? DEFAULT_OBJECTIVE_WEIGHTS;
  validateObjectiveWeights(objectiveWeights);

  const baseScenario = resolveScenario(request.scenarioId);
  const baseStrategyEffect = evaluateStrategy(
    request.selectedInterventionIds,
    request.budgetCr
  );
  if (!baseStrategyEffect.withinBudget) {
    throw new SimulationInputError(
      `Strategy costs \u20b9${baseStrategyEffect.totalCostCr} Cr, exceeding the \u20b9${request.budgetCr} Cr budget.`
    );
  }

  const withoutShare = PARAMETERS.map((parameter) => {
    const points = DELTA_PERCENTAGES.map((deltaPct) => {
      const perturbed = applyPerturbation(
        parameter,
        deltaPct,
        baseScenario,
        request.cityProfile,
        baseStrategyEffect
      );
      const hazardProfile = computeHazardProfile(perturbed.scenario);
      const result = simulateStrategy(
        perturbed.cityProfile,
        hazardProfile,
        perturbed.strategyEffect,
        request.simulationCount,
        request.randomSeed, // same seed at every step: isolates the parameter, not sampling noise
        objectiveWeights,
        request.budgetCr
      );
      return { deltaPct, expectedDamageCr: result.expectedDamageCr };
    });

    const damages = points.map((p) => p.expectedDamageCr);
    const impactCr = Math.max(...damages) - Math.min(...damages);

    return { parameter, points, impactCr };
  });

  const totalImpact = withoutShare.reduce((sum, r) => sum + r.impactCr, 0);
  const results: SensitivityParameterResult[] = withoutShare.map((r) => ({
    ...r,
    impactSharePct: totalImpact > 0 ? (r.impactCr / totalImpact) * 100 : 0,
  }));

  results.sort((a, b) => b.impactCr - a.impactCr);
  return results;
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
