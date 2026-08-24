import { Schema, model, Document } from "mongoose";
import type { ScenarioConfig } from "../data/scenarios";

// Not extending ScenarioConfig directly: our domain "id" field collides
// with Mongoose Document's built-in "id" virtual getter type.
export interface ScenarioDocument extends Document, Omit<ScenarioConfig, "id"> {
  id: string;
}

const ScenarioSchema = new Schema<ScenarioDocument>(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    temperatureIncreaseC: { type: Number, required: true },
    rainfallIntensityMultiplier: { type: Number, required: true },
    floodProbability: { type: Number, required: true },
    heatwaveProbability: { type: Number, required: true },
  },
  { timestamps: true }
);

export const ScenarioModel = model<ScenarioDocument>("Scenario", ScenarioSchema);
