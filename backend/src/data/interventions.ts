export interface InterventionConfig {
  id: string;
  name: string;
  description: string;
  costCr: number;
  floodReduction: number;
  heatReduction: number;
  infrastructureProtection: number;
  populationProtection: number;
  recoveryImprovement: number;
  maintenanceCostCr: number;
  implementationMonths: number;
}

// Synthetic prototype values, not scientific estimates.
// Add new interventions here only — the simulation engine iterates
// this array by id and must never branch on a specific name.
export const INTERVENTIONS: InterventionConfig[] = [
  {
    id: "drainage-upgrade",
    name: "Drainage Upgrade",
    description: "Expands stormwater drainage capacity.",
    costCr: 40,
    floodReduction: 0.30,
    heatReduction: 0.00,
    infrastructureProtection: 0.15,
    populationProtection: 0.10,
    recoveryImprovement: 0.15,
    maintenanceCostCr: 2,
    implementationMonths: 6,
  },
  {
    id: "flood-barrier",
    name: "Flood Barrier",
    description: "Physical barriers along flood-prone zones.",
    costCr: 60,
    floodReduction: 0.50,
    heatReduction: 0.00,
    infrastructureProtection: 0.25,
    populationProtection: 0.15,
    recoveryImprovement: 0.20,
    maintenanceCostCr: 3,
    implementationMonths: 9,
  },
  {
    id: "green-roofs",
    name: "Green Roofs",
    description: "Vegetated roofing to absorb rainfall and heat.",
    costCr: 20,
    floodReduction: 0.05,
    heatReduction: 0.20,
    infrastructureProtection: 0.05,
    populationProtection: 0.05,
    recoveryImprovement: 0.05,
    maintenanceCostCr: 1,
    implementationMonths: 4,
  },
  {
    id: "urban-forest",
    name: "Urban Forest",
    description: "Tree canopy expansion across public land.",
    costCr: 30,
    floodReduction: 0.10,
    heatReduction: 0.25,
    infrastructureProtection: 0.05,
    populationProtection: 0.10,
    recoveryImprovement: 0.10,
    maintenanceCostCr: 1.5,
    implementationMonths: 5,
  },
  {
    id: "cool-roofs",
    name: "Cool Roofs",
    description: "Reflective roofing to reduce urban heat absorption.",
    costCr: 15,
    floodReduction: 0.00,
    heatReduction: 0.20,
    infrastructureProtection: 0.05,
    populationProtection: 0.05,
    recoveryImprovement: 0.05,
    maintenanceCostCr: 0.5,
    implementationMonths: 3,
  },
  {
    id: "heat-shelters",
    name: "Heat Shelters",
    description: "Public cooling centers during heatwave events.",
    costCr: 10,
    floodReduction: 0.00,
    heatReduction: 0.15,
    infrastructureProtection: 0.00,
    populationProtection: 0.25,
    recoveryImprovement: 0.05,
    maintenanceCostCr: 1,
    implementationMonths: 2,
  },
];

export function getInterventionById(id: string): InterventionConfig | undefined {
  return INTERVENTIONS.find((i) => i.id === id);
}

export function getInterventionsByIds(ids: string[]): InterventionConfig[] {
  return ids
    .map(getInterventionById)
    .filter((i): i is InterventionConfig => Boolean(i));
}
