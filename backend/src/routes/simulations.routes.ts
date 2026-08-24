import { Router } from "express";
import mongoose from "mongoose";
import { runSimulation } from "../simulation/simulationService";
import { compareToBaseline } from "../simulation/comparisonService";
import { runSensitivityAnalysis } from "../simulation/sensitivityAnalysis";
import { recommendStrategy } from "../simulation/recommendationEngine";
import { SimulationInputError } from "../simulation/errors";
import { SimulationModel } from "../models/Simulation";
import type { SimulationRequest, RecommendationRequest } from "../simulation/types";

const router = Router();

router.post("/run", async (req, res) => {
  try {
    const outcome = runSimulation(req.body);

    if (!outcome.feasible) {
      res.status(200).json({
        feasible: false,
        reason: outcome.reason,
        strategyEffect: outcome.strategyEffect,
      });
      return;
    }

    // Best-effort persistence: the computed result is already returned
    // to the client regardless of whether this succeeds.
    try {
      await SimulationModel.create({
        type: "single",
        cityProfile: req.body.cityProfile,
        scenarioId: req.body.scenarioId,
        budgetCr: req.body.budgetCr,
        selectedInterventionIds: req.body.selectedInterventionIds,
        objectiveWeights: req.body.objectiveWeights,
        simulationCount: req.body.simulationCount,
        randomSeed: req.body.randomSeed,
        result: outcome.result,
      });
    } catch (persistErr) {
      const message =
        persistErr instanceof Error ? persistErr.message : String(persistErr);
      console.warn(`[simulations] failed to persist run: ${message}`);
    }

    res.status(200).json({
      feasible: true,
      strategyEffect: outcome.strategyEffect,
      result: outcome.result,
    });
  } catch (err) {
    if (err instanceof SimulationInputError) {
      res.status(400).json({ error: err.message });
      return;
    }
    console.error("[simulations] unexpected error:", err);
    res.status(500).json({ error: "Internal error running simulation." });
  }
});

router.post("/compare", (req, res) => {
  try {
    const comparison = compareToBaseline(req.body);
    res.status(200).json(comparison);
  } catch (err) {
    if (err instanceof SimulationInputError) {
      res.status(400).json({ error: err.message });
      return;
    }
    console.error("[simulations] unexpected error in /compare:", err);
    res.status(500).json({ error: "Internal error comparing strategy to baseline." });
  }
});

router.post("/sensitivity", (req, res) => {
  try {
    const results = runSensitivityAnalysis(req.body);
    res.status(200).json({ sensitivity: results });
  } catch (err) {
    if (err instanceof SimulationInputError) {
      res.status(400).json({ error: err.message });
      return;
    }
    console.error("[simulations] unexpected error in /sensitivity:", err);
    res.status(500).json({ error: "Internal error running sensitivity analysis." });
  }
});

// Simulation History: list, most recent first. Never throws on a down
// DB — reports persistenceAvailable:false instead, so the frontend can
// show a clear message rather than a broken page.
router.get("/", async (_req, res) => {
  try {
    const docs = await SimulationModel.find().sort({ createdAt: -1 }).limit(50);
    res.status(200).json({
      persistenceAvailable: true,
      simulations: docs.map(toHistorySummary),
    });
  } catch (err) {
    console.warn("[simulations] history unavailable:", (err as Error).message);
    res.status(200).json({ persistenceAvailable: false, simulations: [] });
  }
});

router.get("/:id", async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(400).json({ error: "Invalid simulation id." });
    return;
  }
  try {
    const doc = await SimulationModel.findById(req.params.id);
    if (!doc) {
      res.status(404).json({ error: "Simulation not found." });
      return;
    }
    res.status(200).json({ persistenceAvailable: true, simulation: doc });
  } catch (err) {
    console.warn("[simulations] fetch-by-id unavailable:", (err as Error).message);
    res.status(503).json({
      persistenceAvailable: false,
      error: "Persistence is unavailable; cannot fetch simulation history right now.",
    });
  }
});

// Re-run a stored simulation with its original parameters (optionally
// a new seed). This is the "Re-run Experiment" feature: it reconstructs
// the exact request from what was persisted and pushes it back through
// the same engine, then saves the fresh run as a new history entry.
router.post("/:id/rerun", async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(400).json({ error: "Invalid simulation id." });
    return;
  }

  let record;
  try {
    record = await SimulationModel.findById(req.params.id);
  } catch (err) {
    console.warn("[simulations] rerun lookup unavailable:", (err as Error).message);
    res.status(503).json({
      persistenceAvailable: false,
      error: "Persistence is unavailable; cannot re-run from history right now.",
    });
    return;
  }
  if (!record) {
    res.status(404).json({ error: "Simulation not found." });
    return;
  }

  const seedUsed =
    typeof req.body?.randomSeed === "number" ? req.body.randomSeed : record.randomSeed;

  try {
    if (record.type === "recommendation") {
      const request: RecommendationRequest = {
        cityProfile: record.cityProfile as unknown as RecommendationRequest["cityProfile"],
        scenarioId: record.scenarioId,
        budgetCr: record.budgetCr,
        objectiveWeights: record.objectiveWeights,
        simulationCount: record.simulationCount,
        randomSeed: seedUsed,
      };
      const response = recommendStrategy(request);

      try {
        await SimulationModel.create({
          type: "recommendation",
          cityProfile: record.cityProfile,
          scenarioId: record.scenarioId,
          budgetCr: record.budgetCr,
          selectedInterventionIds: [],
          objectiveWeights: record.objectiveWeights,
          simulationCount: record.simulationCount,
          randomSeed: seedUsed,
          result: response.baseline.simulationResult,
          recommendationSummary: {
            strategyId: response.recommended.strategyId,
            interventionIds: response.recommended.interventionIds,
            costCr: response.recommended.costCr,
            decisionScore: response.recommended.decisionScore,
            expectedDamageCr: response.recommended.simulationResult.expectedDamageCr,
          },
        });
      } catch (persistErr) {
        console.warn(
          `[simulations] failed to persist rerun: ${(persistErr as Error).message}`
        );
      }

      res.status(200).json({ rerunOf: req.params.id, seedUsed, ...response });
      return;
    }

    const request: SimulationRequest = {
      cityProfile: record.cityProfile as unknown as SimulationRequest["cityProfile"],
      scenarioId: record.scenarioId,
      budgetCr: record.budgetCr,
      selectedInterventionIds: record.selectedInterventionIds,
      objectiveWeights: record.objectiveWeights,
      simulationCount: record.simulationCount,
      randomSeed: seedUsed,
    };
    const outcome = runSimulation(request);

    if (outcome.feasible) {
      try {
        await SimulationModel.create({
          type: "single",
          cityProfile: record.cityProfile,
          scenarioId: record.scenarioId,
          budgetCr: record.budgetCr,
          selectedInterventionIds: record.selectedInterventionIds,
          objectiveWeights: record.objectiveWeights,
          simulationCount: record.simulationCount,
          randomSeed: seedUsed,
          result: outcome.result,
        });
      } catch (persistErr) {
        console.warn(
          `[simulations] failed to persist rerun: ${(persistErr as Error).message}`
        );
      }
    }

    res.status(200).json({ rerunOf: req.params.id, seedUsed, ...outcome });
  } catch (err) {
    if (err instanceof SimulationInputError) {
      res.status(400).json({ error: err.message });
      return;
    }
    console.error("[simulations] unexpected error in /rerun:", err);
    res.status(500).json({ error: "Internal error re-running simulation." });
  }
});

function toHistorySummary(doc: InstanceType<typeof SimulationModel>) {
  return {
    id: doc._id.toString(),
    type: doc.type,
    scenarioId: doc.scenarioId,
    budgetCr: doc.budgetCr,
    randomSeed: doc.randomSeed,
    createdAt: doc.createdAt,
    expectedDamageCr: doc.result?.expectedDamageCr ?? null,
    resilienceScore: doc.result?.resilienceScore ?? null,
    recommendedStrategy:
      doc.recommendationSummary?.strategyId ??
      (doc.selectedInterventionIds.length > 0
        ? doc.selectedInterventionIds.join("+")
        : "baseline / no intervention"),
    status: "completed",
  };
}

export default router;
