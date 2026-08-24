import type { CityProfile } from "../data/cityProfiles";

export interface ObjectiveWeights {
  cost: number;
  floodProtection: number;
  heatProtection: number;
  populationProtection: number;
  recovery: number;
}

export interface SimulationRequest {
  cityProfile: CityProfile;
  scenarioId: string;
  budgetCr: number;
  selectedInterventionIds: string[];
  objectiveWeights?: ObjectiveWeights; // omitted -> DEFAULT_OBJECTIVE_WEIGHTS
  simulationCount: number;
  randomSeed: number;
}

export interface StrategyCostSummary {
  interventionIds: string[];
  totalCostCr: number;
  withinBudget: boolean;
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

export interface SimulationRecord {
  request: SimulationRequest;
  result: SimulationResult | null;
  createdAt: Date;
}

// --- Phase 2: simulation engine types ---

export interface HazardProfile {
  floodHazard: number; // 0-1, scenario-level flood hazard before city/strategy mitigation
  heatHazard: number; // 0-1, scenario-level heat hazard before city/strategy mitigation
}

export interface StrategyEffect extends StrategyCostSummary {
  totalMaintenanceCostCr: number;
  floodReduction: number; // 0-1 fractional mitigation, capped
  heatReduction: number;
  infrastructureProtection: number;
  populationProtection: number;
  recoveryImprovement: number;
}

export interface SingleRunOutcome {
  floodRisk: number;
  heatRisk: number;
  damageCr: number;
  populationAffected: number;
  recoveryMonths: number;
}

export interface MonteCarloAggregate {
  averageFloodRisk: number;
  averageHeatRisk: number;
  averagePopulationAffected: number;
  averageRecoveryMonths: number;
  uncertainty: UncertaintySummary;
}

// --- Phase 3: multi-strategy decision engine types ---

export interface GeneratedStrategy {
  id: string;
  strategyEffect: StrategyEffect;
}

// Breakdown of the ranking score used by the recommendation engine.
// Deliberately separate from SimulationResult: SimulationResult is
// pure simulation output, this is the objective/decision layer built
// on top of it.
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
  maintenanceCostCr: number; // informational only, not part of budget feasibility
  simulationResult: SimulationResult;
  decisionScore: number;
  decisionScoreBreakdown: DecisionScoreBreakdown;
}

export interface RecommendationRequest {
  cityProfile: CityProfile;
  scenarioId: string;
  budgetCr: number;
  objectiveWeights?: ObjectiveWeights; // omitted -> DEFAULT_OBJECTIVE_WEIGHTS
  simulationCount: number;
  randomSeed: number;
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

// --- Final pass: baseline validation / comparison endpoint ---

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

// --- Final pass: sensitivity analysis ---

export type SensitivityParameterName =
  | "rainfallIntensity"
  | "temperatureIncrease"
  | "interventionEffectiveness"
  | "infrastructureVulnerability";

export interface SensitivityPoint {
  deltaPct: number;
  expectedDamageCr: number;
}

export interface SensitivityParameterResult {
  parameter: SensitivityParameterName;
  points: SensitivityPoint[];
  impactCr: number;
  impactSharePct: number;
}
