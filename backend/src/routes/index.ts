import { Router } from "express";
import healthRoutes from "./health.routes";
import scenariosRoutes from "./scenarios.routes";
import interventionsRoutes from "./interventions.routes";
import simulationsRoutes from "./simulations.routes";
import strategiesRoutes from "./strategies.routes";

const router = Router();

router.use("/health", healthRoutes);
router.use("/scenarios", scenariosRoutes);
router.use("/interventions", interventionsRoutes);
router.use("/simulations", simulationsRoutes);
router.use("/strategies", strategiesRoutes);

export default router;
