import { Schema, model, Document } from "mongoose";
import type { InterventionConfig } from "../data/interventions";

// Not extending InterventionConfig directly: our domain "id" field collides
// with Mongoose Document's built-in "id" virtual getter type.
export interface InterventionDocument
  extends Document,
    Omit<InterventionConfig, "id"> {
  id: string;
}

const InterventionSchema = new Schema<InterventionDocument>(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    costCr: { type: Number, required: true },
    floodReduction: { type: Number, required: true },
    heatReduction: { type: Number, required: true },
    infrastructureProtection: { type: Number, required: true },
    populationProtection: { type: Number, required: true },
    recoveryImprovement: { type: Number, required: true },
    maintenanceCostCr: { type: Number, required: true },
    implementationMonths: { type: Number, required: true },
  },
  { timestamps: true }
);

export const InterventionModel = model<InterventionDocument>(
  "Intervention",
  InterventionSchema
);
