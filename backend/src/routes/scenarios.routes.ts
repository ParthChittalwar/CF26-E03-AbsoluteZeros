import { Router } from "express";
import { SCENARIOS } from "../data/scenarios";

const router = Router();

router.get("/", (_req, res) => {
  res.json({ scenarios: SCENARIOS });
});

export default router;
