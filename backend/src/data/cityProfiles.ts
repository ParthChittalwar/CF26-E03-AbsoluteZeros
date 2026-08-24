export interface CityProfile {
  name: string;
  population: number;
  drainageCapacity: number;
  greenCoverage: number;
  infrastructureVulnerability: number;
  hospitalCapacityBeds: number;
  baselineResilience: number;
}

// Synthetic demo profile, not real municipal data.
export const DEFAULT_CITY_PROFILE: CityProfile = {
  name: "Nagpur-like synthetic city",
  population: 2500000,
  drainageCapacity: 0.4,
  greenCoverage: 0.25,
  infrastructureVulnerability: 0.55,
  hospitalCapacityBeds: 4200,
  baselineResilience: 0.45,
};
