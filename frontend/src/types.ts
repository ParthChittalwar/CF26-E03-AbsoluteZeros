export interface ScenarioConfig {
  id: string;
  name: string;
  description: string;
  temperatureIncreaseC: number;
  rainfallIntensityMultiplier: number;
  floodProbability: number;
  heatwaveProbability: number;
}

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

export interface CityProfile {
  name: string;
  population: number;
  drainageCapacity: number;
  greenCoverage: number;
  infrastructureVulnerability: number;
  hospitalCapacityBeds: number;
  baselineResilience: number;
}

export interface ObjectiveWeights {
  cost: number;
  floodProtection: number;
  heatProtection: number;
  populationProtection: number;
  recovery: number;
}

export interface UncertaintySummary {
  mean: number;
  median: number;
  min: number;
  max: number;
  stdDev: number;
  successProbability: number;
}

export interface SimulationResult {
  expectedDamageCr: number;
  averageFloodRisk: number;
  averageHeatRisk: number;
  populationAffected: number;
  recoveryTimeMonths: number;
  resilienceScore: number;
  uncertainty: UncertaintySummary;
}

export interface StrategyEffect {
  interventionIds: string[];
  totalCostCr: number;
  totalMaintenanceCostCr: number;
  withinBudget: boolean;
  floodReduction: number;
  heatReduction: number;
  infrastructureProtection: number;
  populationProtection: number;
  recoveryImprovement: number;
}

export interface DecisionScoreBreakdown {
  floodComponent: number;
  heatComponent: number;
  populationComponent: number;
  recoveryComponent: number;
  costPenalty: number;
  decisionScore: number;
}

export interface StrategyRanking {
  strategyId: string;
  interventionIds: string[];
  interventionNames: string[];
  costCr: number;
  maintenanceCostCr: number;
  simulationResult: SimulationResult;
  decisionScore: number;
  decisionScoreBreakdown: DecisionScoreBreakdown;
}

export interface RecommendationResponse {
  scenarioId: string;
  budgetCr: number;
  baseline: { simulationResult: SimulationResult };
  totalStrategiesGenerated: number;
  feasibleStrategiesEvaluated: number;
  recommended: StrategyRanking;
  alternatives: StrategyRanking[];
  reason: string;
}

export interface ComparisonImprovement {
  damageReductionPct: number;
  floodRiskReductionPct: number;
  heatRiskReductionPct: number;
  populationReductionPct: number;
  recoveryImprovementPct: number;
  resilienceDelta: number;
  successProbabilityDelta: number;
}

export interface ComparisonResult {
  baseline: SimulationResult;
  strategy: SimulationResult;
  strategyEffect: StrategyEffect;
  improvement: ComparisonImprovement;
}

export interface SensitivityPoint {
  deltaPct: number;
  expectedDamageCr: number;
}

export interface SensitivityParameterResult {
  parameter: string;
  points: SensitivityPoint[];
  impactCr: number;
  impactSharePct: number;
}

export interface SimulationRunRequest {
  cityProfile: CityProfile;
  scenarioId: string;
  budgetCr: number;
  selectedInterventionIds: string[];
  objectiveWeights: ObjectiveWeights;
  simulationCount: number;
  randomSeed: number;
}

export interface HistorySummary {
  id: string;
  type: "single" | "recommendation";
  scenarioId: string;
  budgetCr: number;
  randomSeed: number;
  createdAt: string;
  expectedDamageCr: number | null;
  resilienceScore: number | null;
  recommendedStrategy: string;
  status: string;
}

// The rerun endpoint returns different shapes for "single" vs
// "recommendation" records, both merged with rerunOf/seedUsed. Typed
// loosely on purpose — the History panel only reads the few fields it
// displays, via optional chaining, rather than a large union type.
export interface RerunResponse {
  rerunOf: string;
  seedUsed: number;
  feasible?: boolean;
  result?: SimulationResult;
  recommended?: StrategyRanking;
  reason?: string;
}
