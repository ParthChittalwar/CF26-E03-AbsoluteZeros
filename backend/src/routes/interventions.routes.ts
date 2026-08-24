import { Router } from "express";
import { INTERVENTIONS } from "../data/interventions";

const router = Router();

router.get("/", (_req, res) => {
  res.json({ interventions: INTERVENTIONS });
});

export default router;
