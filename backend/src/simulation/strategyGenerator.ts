import { INTERVENTIONS } from "../data/interventions";
import { evaluateStrategy } from "./interventionEngine";
import { SimulationInputError } from "./errors";
import type { GeneratedStrategy } from "./types";

// 2^20 combinations is already over a million; past this point
// exhaustive generation stops making sense for a hackathon prototype.
const MAX_INTERVENTIONS_FOR_EXHAUSTIVE = 20;

// Generates the power set of the given ids, minus the empty set.
// Purely combinatorial: knows nothing about what the ids mean, so it
// stays correct as the intervention catalog grows or shrinks.
export function generateAllCombinations(ids: string[]): string[][] {
  const n = ids.length;
  const combinations: string[][] = [];
  for (let mask = 1; mask < (1 << n); mask++) {
    const combo: string[] = [];
    for (let i = 0; i < n; i++) {
      if (mask & (1 << i)) combo.push(ids[i]);
    }
    combinations.push(combo);
  }
  return combinations;
}

export interface FeasibleStrategySet {
  totalGenerated: number;
  feasible: GeneratedStrategy[];
}

export function generateFeasibleStrategies(budgetCr: number): FeasibleStrategySet {
  const ids = INTERVENTIONS.map((i) => i.id); // config-driven, never hardcoded

  if (ids.length > MAX_INTERVENTIONS_FOR_EXHAUSTIVE) {
    throw new SimulationInputError(
      `Too many configured interventions (${ids.length}) for exhaustive ` +
        "combination generation; a sampling-based generator would be needed."
    );
  }

  const combinations = generateAllCombinations(ids);
  const feasible: GeneratedStrategy[] = [];

  for (const combo of combinations) {
    const strategyEffect = evaluateStrategy(combo, budgetCr);
    if (strategyEffect.withinBudget) {
      feasible.push({
        id: [...combo].sort().join("+"),
        strategyEffect,
      });
    }
  }

  return { totalGenerated: combinations.length, feasible };
}
