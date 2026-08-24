import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { UncertaintySummary } from "../types";

interface UncertaintyChartProps {
  uncertainty: UncertaintySummary;
}

export default function UncertaintyChart({ uncertainty }: UncertaintyChartProps) {
  const data = [
    { name: "Best case", value: Number(uncertainty.min.toFixed(1)) },
    { name: "Median", value: Number(uncertainty.median.toFixed(1)) },
    { name: "Mean", value: Number(uncertainty.mean.toFixed(1)) },
    { name: "Worst case", value: Number(uncertainty.max.toFixed(1)) },
  ];

  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <h3 className="font-display text-base font-semibold text-ink2">
        Uncertainty range — expected damage
      </h3>
      <p className="mt-1 text-xs text-muted">
        Across the Monte Carlo runs · σ = ₹{uncertainty.stdDev.toFixed(1)} Cr ·{" "}
        {Math.round(uncertainty.successProbability * 100)}% success probability
      </p>
      <div className="mt-4 h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#24314A" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fill: "#8DA0BE", fontSize: 11 }}
              label={{ value: "₹ Cr", position: "insideBottom", offset: -4, fill: "#8DA0BE", fontSize: 11 }}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fill: "#8DA0BE", fontSize: 11 }}
              width={80}
            />
            <Tooltip
              contentStyle={{
                background: "#17233A",
                border: "1px solid #24314A",
                borderRadius: 8,
                fontSize: 12,
              }}
              labelStyle={{ color: "#E7ECF3" }}
              formatter={(value: number) => [`₹${value} Cr`, "Damage"]}
            />
            <Bar dataKey="value" fill="#4CC9F0" radius={[0, 4, 4, 0]} barSize={22} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
