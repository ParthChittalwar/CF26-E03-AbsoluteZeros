import type { StrategyRanking } from "../types";
import { riskTone, RISK_TEXT_CLASS } from "../lib/risk";

interface ComparisonTableProps {
  recommended: StrategyRanking;
  alternatives: StrategyRanking[];
}

export default function ComparisonTable({
  recommended,
  alternatives,
}: ComparisonTableProps) {
  const rows = [recommended, ...alternatives];

  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
      <table className="w-full min-w-[820px] text-left text-sm">
        <thead>
          <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
            <th className="px-4 py-3">Rank</th>
            <th className="px-4 py-3">Strategy</th>
            <th className="px-4 py-3">Cost</th>
            <th className="px-4 py-3">Damage</th>
            <th className="px-4 py-3">Flood risk</th>
            <th className="px-4 py-3">Heat risk</th>
            <th className="px-4 py-3">Population</th>
            <th className="px-4 py-3">Recovery</th>
            <th className="px-4 py-3">Success %</th>
            <th className="px-4 py-3">Score</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border font-mono text-xs">
          {rows.map((s, i) => (
            <tr
              key={s.strategyId}
              className={i === 0 ? "bg-teal/5" : undefined}
            >
              <td className="px-4 py-3">
                <span
                  className={`inline-flex h-5 w-5 items-center justify-center rounded-full ${
                    i === 0 ? "bg-teal text-ink" : "bg-surface-raised text-muted"
                  }`}
                >
                  {i + 1}
                </span>
              </td>
              <td className="px-4 py-3 font-sans text-ink2">
                {s.interventionNames.join(" + ") || "No intervention"}
              </td>
              <td className="px-4 py-3 text-cyan">₹{s.costCr} Cr</td>
              <td className="px-4 py-3 text-ink2">
                ₹{s.simulationResult.expectedDamageCr.toFixed(1)} Cr
              </td>
              <td className={`px-4 py-3 ${RISK_TEXT_CLASS[riskTone(s.simulationResult.averageFloodRisk)]}`}>
                {Math.round(s.simulationResult.averageFloodRisk * 100)}%
              </td>
              <td className={`px-4 py-3 ${RISK_TEXT_CLASS[riskTone(s.simulationResult.averageHeatRisk)]}`}>
                {Math.round(s.simulationResult.averageHeatRisk * 100)}%
              </td>
              <td className="px-4 py-3 text-muted">
                {s.simulationResult.populationAffected.toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}
              </td>
              <td className="px-4 py-3 text-muted">
                {s.simulationResult.recoveryTimeMonths.toFixed(1)} mo
              </td>
              <td className="px-4 py-3 text-teal">
                {Math.round(s.simulationResult.uncertainty.successProbability * 100)}%
              </td>
              <td className="px-4 py-3 font-semibold text-ink2">
                {s.decisionScore.toFixed(3)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
