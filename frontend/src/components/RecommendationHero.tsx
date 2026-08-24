import type { StrategyRanking } from "../types";
import { Trophy, RefreshCw } from "lucide-react";

interface RecommendationHeroProps {
  recommended: StrategyRanking;
  reason: string;
  randomSeed: number;
  onRerun: () => void;
  rerunning: boolean;
}

export default function RecommendationHero({
  recommended,
  reason,
  randomSeed,
  onRerun,
  rerunning,
}: RecommendationHeroProps) {
  return (
    <div className="rounded-2xl border border-teal/40 bg-gradient-to-br from-teal/10 to-surface p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-teal">
          <Trophy size={14} />
          Recommended strategy
        </div>
        <button
          onClick={onRerun}
          disabled={rerunning}
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 font-mono text-xs text-muted transition-all hover:border-teal hover:text-teal active:scale-95 disabled:opacity-60"
        >
          <RefreshCw size={12} className={rerunning ? "animate-spin" : ""} />
          Re-run seed {randomSeed}
        </button>
      </div>

      <h2 className="mt-3 font-display text-2xl font-bold text-ink2">
        {recommended.interventionNames.join(" + ") || "No intervention"}
      </h2>

      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{reason}</p>

      <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div>
          <div className="text-xs text-muted">Cost</div>
          <div className="font-mono text-lg text-cyan">
            ₹{recommended.costCr} Cr
          </div>
        </div>
        <div>
          <div className="text-xs text-muted">Expected damage</div>
          <div className="font-mono text-lg text-ink2">
            ₹{recommended.simulationResult.expectedDamageCr.toFixed(1)} Cr
          </div>
        </div>
        <div>
          <div className="text-xs text-muted">Success probability</div>
          <div className="font-mono text-lg text-teal">
            {Math.round(recommended.simulationResult.uncertainty.successProbability * 100)}%
          </div>
        </div>
        <div>
          <div className="text-xs text-muted">Decision score</div>
          <div className="font-mono text-lg text-ink2">
            {recommended.decisionScore.toFixed(3)}
          </div>
        </div>
      </div>
    </div>
  );
}
