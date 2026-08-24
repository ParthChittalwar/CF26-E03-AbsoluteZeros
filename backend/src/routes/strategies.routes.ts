import { Router } from "express";
import { recommendStrategy } from "../simulation/recommendationEngine";
import { SimulationInputError } from "../simulation/errors";
import { SimulationModel } from "../models/Simulation";

const router = Router();

router.post("/recommend", async (req, res) => {
  try {
    const response = recommendStrategy(req.body);

    // Best-effort persistence, same pattern as /simulations/run.
    try {
      await SimulationModel.create({
        type: "recommendation",
        cityProfile: req.body.cityProfile,
        scenarioId: req.body.scenarioId,
        budgetCr: req.body.budgetCr,
        selectedInterventionIds: [],
        objectiveWeights: req.body.objectiveWeights,
        simulationCount: req.body.simulationCount,
        randomSeed: req.body.randomSeed,
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
      const message =
        persistErr instanceof Error ? persistErr.message : String(persistErr);
      console.warn(`[strategies] failed to persist recommendation: ${message}`);
    }

    res.status(200).json(response);
  } catch (err) {
    if (err instanceof SimulationInputError) {
      res.status(400).json({ error: err.message });
      return;
    }
    console.error("[strategies] unexpected error:", err);
    res.status(500).json({ error: "Internal error generating recommendation." });
  }
});

export default router;
