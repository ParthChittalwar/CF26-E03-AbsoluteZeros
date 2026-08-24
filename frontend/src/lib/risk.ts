export type RiskTone = "teal" | "amber" | "red";

// Consistent thresholds used everywhere a risk fraction (0-1) is shown.
// Below 30% reads as under control, 30-60% as elevated, above 60% as
// critical — matches the brief's rule that amber/red are reserved for
// actual warnings, not decorative color-coding by field name.
export function riskTone(fraction: number): RiskTone {
  if (fraction >= 0.6) return "red";
  if (fraction >= 0.3) return "amber";
  return "teal";
}

export const RISK_TEXT_CLASS: Record<RiskTone, string> = {
  teal: "text-teal",
  amber: "text-amber",
  red: "text-red",
};
