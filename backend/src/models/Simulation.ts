import { Schema, model, Document } from "mongoose";
import type {
  ObjectiveWeights,
  SimulationResult,
  UncertaintySummary,
} from "../simulation/types";

export interface RecommendationSummary {
  strategyId: string;
  interventionIds: string[];
  costCr: number;
  decisionScore: number;
  expectedDamageCr: number;
}

export interface SimulationDocument extends Document {
  type: "single" | "recommendation";
  cityProfile: Record<string, unknown>;
  scenarioId: string;
  budgetCr: number;
  selectedInterventionIds: string[];
  objectiveWeights: ObjectiveWeights;
  simulationCount: number;
  randomSeed: number;
  result: SimulationResult | null;
  recommendationSummary: RecommendationSummary | null;
  createdAt: Date;
}

const ObjectiveWeightsSchema = new Schema<ObjectiveWeights>(
  {
    cost: { type: Number, required: true },
    floodProtection: { type: Number, required: true },
    heatProtection: { type: Number, required: true },
    populationProtection: { type: Number, required: true },
    recovery: { type: Number, required: true },
  },
  { _id: false }
);

const UncertaintySchema = new Schema<UncertaintySummary>(
  {
    mean: { type: Number, required: true },
    median: { type: Number, required: true },
    min: { type: Number, required: true },
    max: { type: Number, required: true },
    stdDev: { type: Number, required: true },
    successProbability: { type: Number, required: true },
  },
  { _id: false }
);

const SimulationResultSchema = new Schema<SimulationResult>(
  {
    expectedDamageCr: { type: Number, required: true },
    averageFloodRisk: { type: Number, required: true },
    averageHeatRisk: { type: Number, required: true },
    populationAffected: { type: Number, required: true },
    recoveryTimeMonths: { type: Number, required: true },
    resilienceScore: { type: Number, required: true },
    uncertainty: { type: UncertaintySchema, required: true },
  },
  { _id: false }
);

const RecommendationSummarySchema = new Schema<RecommendationSummary>(
  {
    strategyId: { type: String, required: true },
    interventionIds: { type: [String], required: true },
    costCr: { type: Number, required: true },
    decisionScore: { type: Number, required: true },
    expectedDamageCr: { type: Number, required: true },
  },
  { _id: false }
);

const SimulationSchema = new Schema<SimulationDocument>(
  {
    type: { type: String, enum: ["single", "recommendation"], default: "single" },
    // Mixed on purpose: CityProfile has no separate strict schema yet,
    // and this needs to round-trip exactly for /rerun to reconstruct
    // the original request. Prototype-scope tradeoff, not enforced shape.
    cityProfile: { type: Schema.Types.Mixed, required: true },
    scenarioId: { type: String, required: true },
    budgetCr: { type: Number, required: true },
    selectedInterventionIds: { type: [String], required: true },
    objectiveWeights: { type: ObjectiveWeightsSchema, required: true },
    simulationCount: { type: Number, required: true },
    randomSeed: { type: Number, required: true },
    result: { type: SimulationResultSchema, default: null },
    recommendationSummary: { type: RecommendationSummarySchema, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const SimulationModel = model<SimulationDocument>(
  "Simulation",
  SimulationSchema
);
