import type { CityProfile, ObjectiveWeights } from "./types";

export const DEFAULT_CITY_PROFILE: CityProfile = {
  name: "Nagpur-like synthetic city",
  population: 2500000,
  drainageCapacity: 0.4,
  greenCoverage: 0.25,
  infrastructureVulnerability: 0.55,
  hospitalCapacityBeds: 4200,
  baselineResilience: 0.45,
};

export const DEFAULT_WEIGHTS: ObjectiveWeights = {
  cost: 0.2,
  floodProtection: 0.3,
  heatProtection: 0.2,
  populationProtection: 0.2,
  recovery: 0.1,
};
