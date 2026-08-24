import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Activity, Loader2 } from "lucide-react";
import type { SensitivityParameterResult } from "../types";

interface SensitivityPanelProps {
  onRun: () => Promise<SensitivityParameterResult[]>;
}

const PARAMETER_LABELS: Record<string, string> = {
  rainfallIntensity: "Rainfall intensity",
  temperatureIncrease: "Temperature increase",
  interventionEffectiveness: "Intervention effectiveness",
  infrastructureVulnerability: "Infrastructure vulnerability",
};

export default function SensitivityPanel({ onRun }: SensitivityPanelProps) {
  const [results, setResults] = useState<SensitivityParameterResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRun() {
    setLoading(true);
    setError(null);
    try {
      const data = await onRun();
      setResults(data);
    } catch {
      setError("Could not run sensitivity analysis.");
    } finally {
      setLoading(false);
    }
  }

  const chartData = results?.map((r) => ({
    name: PARAMETER_LABELS[r.parameter] ?? r.parameter,
    share: Number(r.impactSharePct.toFixed(1)),
  }));

  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 font-display text-base font-semibold text-ink2">
            <Activity size={16} className="text-cyan" />
            Sensitivity analysis
          </h3>
          <p className="mt-1 text-xs text-muted">
            One-variable-at-a-time sweep, -10% to +10%. Which assumptions move the
            result the most?
          </p>
        </div>
        <button
          onClick={handleRun}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 font-mono text-xs text-muted transition-all hover:border-cyan hover:text-cyan active:scale-95 disabled:opacity-60"
        >
          {loading && <Loader2 size={12} className="animate-spin" />}
          {loading ? "Sweeping…" : results ? "Re-run" : "Run analysis"}
        </button>
      </div>

      {error && <p className="mt-3 text-xs text-red">{error}</p>}

      {chartData && (
        <div className="mt-4 h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#24314A" horizontal={false} />
              <XAxis
                type="number"
                unit="%"
                tick={{ fill: "#8DA0BE", fontSize: 11 }}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fill: "#8DA0BE", fontSize: 11 }}
                width={150}
              />
              <Tooltip
                contentStyle={{
                  background: "#17233A",
                  border: "1px solid #24314A",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                labelStyle={{ color: "#E7ECF3" }}
                formatter={(value: number) => [`${value}%`, "Impact share"]}
              />
              <Bar dataKey="share" fill="#F2A93B" radius={[0, 4, 4, 0]} barSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
