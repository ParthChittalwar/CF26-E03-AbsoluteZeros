interface StepNavProps {
  step: "setup" | "explorer" | "results" | "history";
  onChange: (step: "setup" | "explorer" | "results" | "history") => void;
  resultsReady: boolean;
}

const STEPS: Array<{ id: "setup" | "explorer" | "results" | "history"; label: string }> = [
  { id: "setup", label: "Setup" },
  { id: "explorer", label: "Strategy Explorer" },
  { id: "results", label: "Results" },
  { id: "history", label: "History" },
];

export default function StepNav({ step, onChange, resultsReady }: StepNavProps) {
  return (
    <nav className="flex flex-wrap items-center gap-2 font-display text-sm">
      {STEPS.map((s, i) => {
        const disabled = s.id === "results" && !resultsReady;
        const active = step === s.id;
        return (
          <div key={s.id} className="flex items-center gap-2">
            {i > 0 && <span className="hidden text-border sm:inline">→</span>}
            <button
              disabled={disabled}
              onClick={() => onChange(s.id)}
              className={`rounded-full px-3 py-1.5 transition-all active:scale-95 ${
                active
                  ? "bg-teal text-ink font-semibold"
                  : disabled
                  ? "cursor-not-allowed text-muted/40"
                  : "text-muted hover:text-ink2"
              }`}
            >
              {s.label}
            </button>
          </div>
        );
      })}
    </nav>
  );
}
