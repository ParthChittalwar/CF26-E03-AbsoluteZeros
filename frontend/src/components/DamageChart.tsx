import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { StrategyRanking } from "../types";

interface DamageChartProps {
  recommended: StrategyRanking;
  alternatives: StrategyRanking[];
}

export default function DamageChart({ recommended, alternatives }: DamageChartProps) {
  const data = [recommended, ...alternatives].map((s, i) => ({
    name: s.interventionNames.length > 2
      ? `${s.interventionNames.slice(0, 2).join(" + ")}…`
      : s.interventionNames.join(" + ") || "None",
    damage: Number(s.simulationResult.expectedDamageCr.toFixed(1)),
    isTop: i === 0,
  }));

  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <h3 className="font-display text-base font-semibold text-ink2">
        Expected damage by strategy
      </h3>
      <div className="mt-4 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#24314A" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fill: "#8DA0BE", fontSize: 10 }}
              angle={-25}
              textAnchor="end"
              interval={0}
            />
            <YAxis
              tick={{ fill: "#8DA0BE", fontSize: 11 }}
              label={{
                value: "₹ Cr",
                angle: -90,
                position: "insideLeft",
                fill: "#8DA0BE",
                fontSize: 11,
              }}
            />
            <Tooltip
              contentStyle={{
                background: "#17233A",
                border: "1px solid #24314A",
                borderRadius: 8,
                fontSize: 12,
              }}
              labelStyle={{ color: "#E7ECF3" }}
              formatter={(value: number) => [`₹${value} Cr`, "Expected damage"]}
            />
            <Bar dataKey="damage" radius={[4, 4, 0, 0]}>
              {data.map((d, i) => (
                <Cell key={i} fill={d.isTop ? "#22C4A0" : "#4CC9F0"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
