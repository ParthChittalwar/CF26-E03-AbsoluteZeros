import type { InterventionConfig } from "../types";
import InterventionCard from "./InterventionCard";
import { Sparkles, Loader2 } from "lucide-react";

interface StrategyExplorerProps {
  interventions: InterventionConfig[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  budgetCr: number;
  onRecommend: () => void;
  recommending: boolean;
}

export default function StrategyExplorer({
  interventions,
  selectedIds,
  onToggle,
  budgetCr,
  onRecommend,
  recommending,
}: StrategyExplorerProps) {
  const selected = interventions.filter((i) => selectedIds.includes(i.id));
  const totalCost = selected.reduce((sum, i) => sum + i.costCr, 0);
  const remaining = budgetCr - totalCost;
  const overBudget = remaining < 0;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-surface p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-semibold text-ink2">
              Strategy explorer
            </h2>
            <p className="mt-1 text-sm text-muted">
              Select interventions manually, or let the engine generate and rank
              every feasible combination for you.
            </p>
          </div>
          <button
            onClick={onRecommend}
            disabled={recommending}
            className="flex items-center gap-2 rounded-xl bg-teal px-5 py-2.5 font-display text-sm font-semibold text-ink transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60 disabled:active:scale-100"
          >
            {recommending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Sparkles size={16} />
            )}
            {recommending ? "Running Monte Carlo…" : "Generate & Recommend"}
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-6 font-mono text-sm">
          <div>
            <span className="text-muted">Selected cost </span>
            <span className={overBudget ? "text-red" : "text-cyan"}>
              ₹{totalCost} Cr
            </span>
          </div>
          <div>
            <span className="text-muted">Remaining budget </span>
            <span className={overBudget ? "text-red" : "text-ink2"}>
              ₹{remaining} Cr
            </span>
          </div>
          <div>
            <span className="text-muted">Feasibility </span>
            <span className={overBudget ? "text-red" : "text-teal"}>
              {overBudget ? "OVER BUDGET" : "FEASIBLE"}
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {interventions.map((i) => (
          <InterventionCard
            key={i.id}
            intervention={i}
            selected={selectedIds.includes(i.id)}
            onToggle={() => onToggle(i.id)}
          />
        ))}
      </div>
    </div>
  );
}
