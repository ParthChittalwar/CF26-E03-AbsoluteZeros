import type { CityProfile } from "../data/cityProfiles";
import type { HazardProfile, StrategyEffect, SingleRunOutcome } from "./types";
import type { RandomGenerator } from "./random";
import { clamp, clamp01 } from "./mathUtils";

// All constants below are prototype simulation assumptions, not
// scientific estimates, and are documented as such in the README.
const JITTER_STD_DEV = 0.1; // +/-10% relative stochastic variation per run
const FLOOD_DAMAGE_WEIGHT = 0.6;
const HEAT_DAMAGE_WEIGHT = 0.4;
const DAMAGE_CR_PER_MILLION_POPULATION = 40; // at full unmitigated risk
const BASE_RECOVERY_MONTHS = 6;
const RECOVERY_RISK_MONTHS = 24;

export function simulateSingleRun(
  cityProfile: CityProfile,
  hazardProfile: HazardProfile,
  strategyEffect: StrategyEffect,
  rng: RandomGenerator
): SingleRunOutcome {
  const floodJitter = 1 + rng.nextGaussian(0, JITTER_STD_DEV);
  const heatJitter = 1 + rng.nextGaussian(0, JITTER_STD_DEV);

  const effectiveFloodHazard =
    hazardProfile.floodHazard * (1 - cityProfile.drainageCapacity * 0.3);
  const effectiveHeatHazard =
    hazardProfile.heatHazard * (1 - cityProfile.greenCoverage * 0.2);

  const floodRisk = clamp01(
    effectiveFloodHazard * (1 - strategyEffect.floodReduction) * floodJitter
  );
  const heatRisk = clamp01(
    effectiveHeatHazard * (1 - strategyEffect.heatReduction) * heatJitter
  );

  const damageScale =
    (cityProfile.population / 1_000_000) * DAMAGE_CR_PER_MILLION_POPULATION;
  const baseDamagePotentialCr =
    (floodRisk * FLOOD_DAMAGE_WEIGHT + heatRisk * HEAT_DAMAGE_WEIGHT) *
    cityProfile.infrastructureVulnerability *
    damageScale;
  const damageCr = Math.max(
    0,
    baseDamagePotentialCr * (1 - strategyEffect.infrastructureProtection)
  );

  const populationAffected = clamp(
    cityProfile.population *
      (floodRisk * 0.5 + heatRisk * 0.3) *
      (1 - strategyEffect.populationProtection),
    0,
    cityProfile.population
  );

  const baseRecoveryMonths =
    BASE_RECOVERY_MONTHS + (floodRisk + heatRisk) * RECOVERY_RISK_MONTHS;
  const recoveryMonths = Math.max(
    1,
    baseRecoveryMonths * (1 - strategyEffect.recoveryImprovement)
  );

  return { floodRisk, heatRisk, damageCr, populationAffected, recoveryMonths };
}
