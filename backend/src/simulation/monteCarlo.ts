import type { CityProfile } from "../data/cityProfiles";
import type {
  HazardProfile,
  StrategyEffect,
  MonteCarloAggregate,
  UncertaintySummary,
} from "./types";
import type { RandomGenerator } from "./random";
import { simulateSingleRun } from "./riskModel";
import { clamp } from "./mathUtils";

const MIN_RUNS = 10;
const MAX_RUNS = 2000;

// A run "succeeds" if both flood and heat risk stayed under the
// mid-risk threshold. Simple, transparent, no extra user input needed.
const SUCCESS_RISK_THRESHOLD = 0.5;

export function runMonteCarlo(
  cityProfile: CityProfile,
  hazardProfile: HazardProfile,
  strategyEffect: StrategyEffect,
  simulationCount: number,
  rng: RandomGenerator
): MonteCarloAggregate {
  const count = clamp(Math.floor(simulationCount) || MIN_RUNS, MIN_RUNS, MAX_RUNS);

  const damages: number[] = [];
  let floodSum = 0;
  let heatSum = 0;
  let popSum = 0;
  let recoverySum = 0;
  let successCount = 0;

  for (let i = 0; i < count; i++) {
    const outcome = simulateSingleRun(cityProfile, hazardProfile, strategyEffect, rng);
    damages.push(outcome.damageCr);
    floodSum += outcome.floodRisk;
    heatSum += outcome.heatRisk;
    popSum += outcome.populationAffected;
    recoverySum += outcome.recoveryMonths;
    if (
      outcome.floodRisk < SUCCESS_RISK_THRESHOLD &&
      outcome.heatRisk < SUCCESS_RISK_THRESHOLD
    ) {
      successCount++;
    }
  }

  return {
    averageFloodRisk: floodSum / count,
    averageHeatRisk: heatSum / count,
    averagePopulationAffected: popSum / count,
    averageRecoveryMonths: recoverySum / count,
    uncertainty: computeUncertaintyStats(damages, successCount / count),
  };
}

function computeUncertaintyStats(
  values: number[],
  successProbability: number
): UncertaintySummary {
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const median =
    n % 2 === 0 ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2 : sorted[(n - 1) / 2];
  const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / n;

  return {
    mean,
    median,
    min: sorted[0],
    max: sorted[n - 1],
    stdDev: Math.sqrt(variance),
    successProbability,
  };
}
