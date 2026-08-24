import type { LucideIcon } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: string;
  sublabel?: string;
  icon: LucideIcon;
  tone?: "default" | "teal" | "amber" | "red" | "cyan";
}

const TONE_CLASSES: Record<string, string> = {
  default: "text-ink2",
  teal: "text-teal",
  amber: "text-amber",
  red: "text-red",
  cyan: "text-cyan",
};

export default function MetricCard({
  label,
  value,
  sublabel,
  icon: Icon,
  tone = "default",
}: MetricCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-center gap-2 text-xs text-muted">
        <Icon size={13} />
        {label}
      </div>
      <div className={`mt-2 font-display text-2xl font-semibold ${TONE_CLASSES[tone]}`}>
        {value}
      </div>
      {sublabel && <div className="mt-1 text-xs text-muted">{sublabel}</div>}
    </div>
  );
}
