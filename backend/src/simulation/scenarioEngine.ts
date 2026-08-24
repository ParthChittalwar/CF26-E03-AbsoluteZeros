import { getScenarioById } from "../data/scenarios";
import type { ScenarioConfig } from "../data/scenarios";
import type { HazardProfile } from "./types";
import { clamp01 } from "./mathUtils";
import { SimulationInputError } from "./errors";

// Prototype assumption: +1C of warming adds ~5% to heat hazard.
const HEAT_TEMPERATURE_COEFFICIENT = 0.05;

export function resolveScenario(scenarioId: string): ScenarioConfig {
  const scenario = getScenarioById(scenarioId);
  if (!scenario) {
    throw new SimulationInputError(`Unknown scenario id: ${scenarioId}`);
  }
  return scenario;
}

export function computeHazardProfile(scenario: ScenarioConfig): HazardProfile {
  const floodHazard = clamp01(
    scenario.floodProbability * scenario.rainfallIntensityMultiplier
  );
  const heatHazard = clamp01(
    scenario.heatwaveProbability +
      scenario.temperatureIncreaseC * HEAT_TEMPERATURE_COEFFICIENT
  );
  return { floodHazard, heatHazard };
}
