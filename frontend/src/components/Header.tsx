import { Waves, Sigma, Target, GitCompare } from "lucide-react";

const CONCEPTS = [
  {
    icon: Waves,
    label: "Scenario",
    text: "A synthetic future climate — temperature, rainfall, flood and heat probability.",
  },
  {
    icon: Sigma,
    label: "Simulation",
    text: "500+ seeded Monte Carlo draws quantify uncertainty in the outcome.",
  },
  {
    icon: Target,
    label: "Optimization",
    text: "Every feasible intervention combination is ranked against your objectives.",
  },
  {
    icon: GitCompare,
    label: "Validation",
    text: "Every recommendation is checked against the no-intervention baseline.",
  },
];

export default function Header() {
  return (
    <header className="border-b border-border bg-surface/40">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="font-display text-3xl font-bold text-ink2 sm:text-4xl">
          Climate<span className="text-teal">Shield</span>
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted sm:text-base">
          Test adaptation strategies against uncertain climate futures before
          committing the budget. A prototype decision-support simulator — not a
          real-world climate forecasting system.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {CONCEPTS.map((c) => (
            <div
              key={c.label}
              className="rounded-xl border border-border bg-surface p-3"
            >
              <div className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-wide text-cyan">
                <c.icon size={12} />
                {c.label}
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-muted">{c.text}</p>
            </div>
          ))}
        </div>
      </div>
    </header>
  );
}
