import type { StrategyRanking, SimulationResult } from "../types";
import { ArrowDown, ArrowUp } from "lucide-react";

interface BaselineComparisonProps {
  baseline: SimulationResult;
  recommended: StrategyRanking;
}

function pctReduction(baselineValue: number, strategyValue: number): number {
  if (baselineValue <= 0) return 0;
  return ((baselineValue - strategyValue) / baselineValue) * 100;
}

export default function BaselineComparison({
  baseline,
  recommended,
}: BaselineComparisonProps) {
  const strategy = recommended.simulationResult;
  const rows = [
    {
      label: "Expected damage",
      baseline: `₹${baseline.expectedDamageCr.toFixed(1)} Cr`,
      strategy: `₹${strategy.expectedDamageCr.toFixed(1)} Cr`,
      changePct: pctReduction(baseline.expectedDamageCr, strategy.expectedDamageCr),
    },
    {
      label: "Flood risk",
      baseline: `${Math.round(baseline.averageFloodRisk * 100)}%`,
      strategy: `${Math.round(strategy.averageFloodRisk * 100)}%`,
      changePct: pctReduction(baseline.averageFloodRisk, strategy.averageFloodRisk),
    },
    {
      label: "Heat risk",
      baseline: `${Math.round(baseline.averageHeatRisk * 100)}%`,
      strategy: `${Math.round(strategy.averageHeatRisk * 100)}%`,
      changePct: pctReduction(baseline.averageHeatRisk, strategy.averageHeatRisk),
    },
    {
      label: "Population affected",
      baseline: baseline.populationAffected.toLocaleString(undefined, {
        maximumFractionDigits: 0,
      }),
      strategy: strategy.populationAffected.toLocaleString(undefined, {
        maximumFractionDigits: 0,
      }),
      changePct: pctReduction(baseline.populationAffected, strategy.populationAffected),
    },
    {
      label: "Recovery time",
      baseline: `${baseline.recoveryTimeMonths.toFixed(1)} mo`,
      strategy: `${strategy.recoveryTimeMonths.toFixed(1)} mo`,
      changePct: pctReduction(baseline.recoveryTimeMonths, strategy.recoveryTimeMonths),
    },
    {
      label: "Success probability",
      baseline: `${Math.round(baseline.uncertainty.successProbability * 100)}%`,
      strategy: `${Math.round(strategy.uncertainty.successProbability * 100)}%`,
      changePct:
        (strategy.uncertainty.successProbability - baseline.uncertainty.successProbability) *
        100,
    },
  ];

  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <h3 className="font-display text-lg font-semibold text-ink2">
        Baseline validation
      </h3>
      <p className="mt-1 text-sm text-muted">
        No-intervention baseline vs. the recommended strategy — same scenario,
        same seed, same Monte Carlo run count.
      </p>

      <div className="mt-4 grid grid-cols-4 gap-2 text-xs text-muted">
        <div />
        <div className="font-mono">Baseline</div>
        <div className="font-mono text-teal">Recommended</div>
        <div className="font-mono">Change</div>
      </div>

      <div className="mt-1 divide-y divide-border">
        {rows.map((r) => {
          const improved = r.changePct > 0;
          return (
            <div key={r.label} className="grid grid-cols-4 items-center gap-2 py-2.5">
              <div className="text-sm text-ink2">{r.label}</div>
              <div className="font-mono text-sm text-muted">{r.baseline}</div>
              <div className="font-mono text-sm text-ink2">{r.strategy}</div>
              <div
                className={`flex items-center gap-1 font-mono text-sm ${
                  improved ? "text-teal" : r.changePct < 0 ? "text-red" : "text-muted"
                }`}
              >
                {r.changePct !== 0 &&
                  (improved ? <ArrowDown size={12} /> : <ArrowUp size={12} />)}
                {Math.abs(r.changePct).toFixed(0)}%
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
