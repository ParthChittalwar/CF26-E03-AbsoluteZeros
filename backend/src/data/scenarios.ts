export interface ScenarioConfig {
  id: string;
  name: string;
  description: string;
  temperatureIncreaseC: number;
  rainfallIntensityMultiplier: number;
  floodProbability: number;
  heatwaveProbability: number;
}

// Prototype simulation assumptions, not real-world climate forecasts.
// Add new scenarios here only — the simulation engine iterates this
// array by id and must never branch on a specific scenario name.
export const SCENARIOS: ScenarioConfig[] = [
  {
    id: "baseline",
    name: "Baseline",
    description: "Normal temperature and rainfall.",
    temperatureIncreaseC: 0,
    rainfallIntensityMultiplier: 1.0,
    floodProbability: 0.10,
    heatwaveProbability: 0.05,
  },
  {
    id: "heavy-rainfall",
    name: "Heavy Rainfall",
    description: "Increased rainfall intensity and flood probability.",
    temperatureIncreaseC: 0.5,
    rainfallIntensityMultiplier: 1.4,
    floodProbability: 0.35,
    heatwaveProbability: 0.08,
  },
  {
    id: "extreme-flood",
    name: "Extreme Flood",
    description: "Extreme rainfall with high flood probability.",
    temperatureIncreaseC: 1.0,
    rainfallIntensityMultiplier: 1.8,
    floodProbability: 0.65,
    heatwaveProbability: 0.10,
  },
  {
    id: "heatwave",
    name: "Heatwave",
    description: "High temperature and heatwave probability, near-normal rainfall.",
    temperatureIncreaseC: 2.5,
    rainfallIntensityMultiplier: 0.9,
    floodProbability: 0.08,
    heatwaveProbability: 0.55,
  },
  {
    id: "compound-extreme",
    name: "Compound Extreme",
    description: "Simultaneous high temperature and high rainfall stress.",
    temperatureIncreaseC: 3.0,
    rainfallIntensityMultiplier: 1.6,
    floodProbability: 0.55,
    heatwaveProbability: 0.45,
  },
];

export function getScenarioById(id: string): ScenarioConfig | undefined {
  return SCENARIOS.find((s) => s.id === id);
}
