import { Radio, Database, DatabaseZap } from "lucide-react";

interface TelemetryBarProps {
  scenarioName: string;
  budgetCr: number;
  simulationCount: number;
  randomSeed: number;
  dbConnected: boolean | null;
}

export default function TelemetryBar({
  scenarioName,
  budgetCr,
  simulationCount,
  randomSeed,
  dbConnected,
}: TelemetryBarProps) {
  return (
    <div className="sticky top-0 z-30 border-b border-border bg-ink/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-4 overflow-x-auto px-4 py-2 text-xs font-mono text-muted scrollbar-thin">
        <span className="flex items-center gap-1.5 text-teal">
          <Radio size={12} className="animate-pulse" />
          LIVE
        </span>
        <span className="text-border">|</span>
        <span>
          SCENARIO <span className="text-ink2">{scenarioName.toUpperCase()}</span>
        </span>
        <span>
          BUDGET <span className="text-cyan">₹{budgetCr} Cr</span>
        </span>
        <span>
          RUNS <span className="text-ink2">{simulationCount}</span>
        </span>
        <span>
          SEED <span className="text-teal">{randomSeed}</span>
        </span>
        <span className="ml-auto flex items-center gap-1.5 whitespace-nowrap">
          {dbConnected === null ? (
            <span className="text-muted">CHECKING DB…</span>
          ) : dbConnected ? (
            <>
              <Database size={12} className="text-teal" />
              <span className="text-teal">PERSISTENCE OK</span>
            </>
          ) : (
            <>
              <DatabaseZap size={12} className="text-amber" />
              <span className="text-amber">NO PERSISTENCE</span>
            </>
          )}
        </span>
      </div>
    </div>
  );
}
