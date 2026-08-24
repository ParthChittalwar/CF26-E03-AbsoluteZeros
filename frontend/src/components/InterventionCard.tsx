import type { InterventionConfig } from "../types";
import { Droplets, Sun, Shield, Users, Clock, Check } from "lucide-react";

interface InterventionCardProps {
  intervention: InterventionConfig;
  selected: boolean;
  onToggle: () => void;
}

export default function InterventionCard({
  intervention,
  selected,
  onToggle,
}: InterventionCardProps) {
  return (
    <button
      onClick={onToggle}
      className={`flex flex-col rounded-2xl border p-4 text-left transition-all active:scale-[0.98] ${
        selected
          ? "border-teal bg-teal/10"
          : "border-border bg-surface hover:border-muted"
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="font-display text-sm font-semibold text-ink2">
            {intervention.name}
          </div>
          <div className="mt-1 text-xs text-muted">{intervention.description}</div>
        </div>
        <div
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
            selected ? "border-teal bg-teal text-ink" : "border-border"
          }`}
        >
          {selected && <Check size={12} strokeWidth={3} />}
        </div>
      </div>

      <div className="mt-3 font-mono text-sm text-cyan">
        ₹{intervention.costCr} Cr
      </div>

      <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 font-mono text-[11px] text-muted">
        <span className="flex items-center gap-1">
          <Droplets size={11} className="text-cyan" />
          flood -{Math.round(intervention.floodReduction * 100)}%
        </span>
        <span className="flex items-center gap-1">
          <Sun size={11} className="text-amber" />
          heat -{Math.round(intervention.heatReduction * 100)}%
        </span>
        <span className="flex items-center gap-1">
          <Shield size={11} className="text-teal" />
          infra +{Math.round(intervention.infrastructureProtection * 100)}%
        </span>
        <span className="flex items-center gap-1">
          <Users size={11} className="text-teal" />
          pop +{Math.round(intervention.populationProtection * 100)}%
        </span>
        <span className="flex items-center gap-1 col-span-2">
          <Clock size={11} className="text-muted" />
          {intervention.implementationMonths} mo build ·
          ₹{intervention.maintenanceCostCr} Cr/yr upkeep (informational)
        </span>
      </div>
    </button>
  );
}
