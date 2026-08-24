import type { ScenarioConfig, ObjectiveWeights, CityProfile } from "../types";
import { Shuffle } from "lucide-react";

interface SetupPanelProps {
  scenarios: ScenarioConfig[];
  scenarioId: string;
  onScenarioChange: (id: string) => void;
  budgetCr: number;
  onBudgetChange: (value: number) => void;
  simulationCount: number;
  onSimulationCountChange: (value: number) => void;
  randomSeed: number;
  onRandomSeedChange: (value: number) => void;
  weights: ObjectiveWeights;
  onWeightsChange: (weights: ObjectiveWeights) => void;
  cityProfile: CityProfile;
}

const RUN_OPTIONS = [100, 500, 1000];

const WEIGHT_FIELDS: Array<{ key: keyof ObjectiveWeights; label: string }> = [
  { key: "cost", label: "Cost sensitivity" },
  { key: "floodProtection", label: "Flood protection" },
  { key: "heatProtection", label: "Heat protection" },
  { key: "populationProtection", label: "Population protection" },
  { key: "recovery", label: "Recovery speed" },
];

export default function SetupPanel({
  scenarios,
  scenarioId,
  onScenarioChange,
  budgetCr,
  onBudgetChange,
  simulationCount,
  onSimulationCountChange,
  randomSeed,
  onRandomSeedChange,
  weights,
  onWeightsChange,
  cityProfile,
}: SetupPanelProps) {
  const weightSum =
    weights.cost +
    weights.floodProtection +
    weights.heatProtection +
    weights.populationProtection +
    weights.recovery;

  function updateWeight(key: keyof ObjectiveWeights, value: number) {
    onWeightsChange({ ...weights, [key]: value });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.3fr,1fr]">
      <div className="space-y-6">
        <section className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="font-display text-lg font-semibold text-ink2">
            Climate scenario
          </h2>
          <p className="mt-1 text-sm text-muted">
            Prototype simulation assumptions — synthetic parameters, not a
            real-world forecast.
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {scenarios.map((s) => (
              <button
                key={s.id}
                onClick={() => onScenarioChange(s.id)}
                className={`rounded-xl border p-3 text-left transition-all active:scale-[0.98] ${
                  scenarioId === s.id
                    ? "border-teal bg-teal/10"
                    : "border-border bg-surface-raised hover:border-muted"
                }`}
              >
                <div className="font-display text-sm font-semibold text-ink2">
                  {s.name}
                </div>
                <div className="mt-1 text-xs text-muted">{s.description}</div>
                <div className="mt-2 font-mono text-[11px] text-cyan">
                  +{s.temperatureIncreaseC}°C · rain ×{s.rainfallIntensityMultiplier}
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="font-display text-lg font-semibold text-ink2">
            Budget &amp; simulation
          </h2>
          <div className="mt-4 space-y-4">
            <div>
              <div className="flex items-center justify-between text-sm text-muted">
                <label htmlFor="budget">Budget</label>
                <span className="font-mono text-cyan">₹{budgetCr} Cr</span>
              </div>
              <input
                id="budget"
                type="range"
                min={10}
                max={200}
                step={5}
                value={budgetCr}
                onChange={(e) => onBudgetChange(Number(e.target.value))}
                className="mt-2 w-full accent-teal"
              />
            </div>

            <div>
              <div className="mb-2 text-sm text-muted">Simulation runs</div>
              <div className="flex gap-2">
                {RUN_OPTIONS.map((n) => (
                  <button
                    key={n}
                    onClick={() => onSimulationCountChange(n)}
                    className={`flex-1 rounded-lg border py-2 font-mono text-sm transition-all active:scale-95 ${
                      simulationCount === n
                        ? "border-teal bg-teal/10 text-teal"
                        : "border-border text-muted hover:border-muted"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="seed" className="mb-2 block text-sm text-muted">
                Random seed
              </label>
              <div className="flex gap-2">
                <input
                  id="seed"
                  type="number"
                  value={randomSeed}
                  onChange={(e) => onRandomSeedChange(Number(e.target.value))}
                  className="w-full rounded-lg border border-border bg-surface-raised px-3 py-2 font-mono text-sm text-ink2 focus:border-teal"
                />
                <button
                  title="Randomize seed"
                  onClick={() => {
                    const buf = new Uint32Array(1);
                    crypto.getRandomValues(buf);
                    onRandomSeedChange(buf[0] % 100000);
                  }}
                  className="rounded-lg border border-border px-3 text-muted hover:border-teal hover:text-teal"
                >
                  <Shuffle size={16} />
                </button>
              </div>
              <p className="mt-1 text-xs text-muted">
                Same seed + same inputs always reproduces the same result.
              </p>
            </div>
          </div>
        </section>
      </div>

      <div className="space-y-6">
        <section className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="font-display text-lg font-semibold text-ink2">
            Objective weights
          </h2>
          <p className="mt-1 text-sm text-muted">
            How much each objective matters. Auto-normalized to 100%.
          </p>
          <div className="mt-4 space-y-3">
            {WEIGHT_FIELDS.map((f) => (
              <div key={f.key}>
                <div className="flex items-center justify-between text-xs text-muted">
                  <span>{f.label}</span>
                  <span className="font-mono text-ink2">
                    {weightSum > 0
                      ? Math.round((weights[f.key] / weightSum) * 100)
                      : 0}
                    %
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={weights[f.key]}
                  onChange={(e) => updateWeight(f.key, Number(e.target.value))}
                  className="mt-1 w-full accent-cyan"
                />
              </div>
            ))}
          </div>
          <div className="mt-4 flex h-2 overflow-hidden rounded-full bg-surface-raised">
            {WEIGHT_FIELDS.map((f, i) => (
              <div
                key={f.key}
                style={{
                  width: `${weightSum > 0 ? (weights[f.key] / weightSum) * 100 : 0}%`,
                  backgroundColor: ["#22C4A0", "#4CC9F0", "#F2A93B", "#8DA0BE", "#F0554D"][i],
                }}
              />
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="font-display text-lg font-semibold text-ink2">
            City profile
          </h2>
          <p className="mt-1 text-sm text-muted">{cityProfile.name}</p>
          <dl className="mt-3 grid grid-cols-2 gap-3 font-mono text-xs">
            <div>
              <dt className="text-muted">Population</dt>
              <dd className="text-ink2">{cityProfile.population.toLocaleString()}</dd>
            </div>
            <div>
              <dt className="text-muted">Drainage capacity</dt>
              <dd className="text-ink2">{cityProfile.drainageCapacity}</dd>
            </div>
            <div>
              <dt className="text-muted">Green coverage</dt>
              <dd className="text-ink2">{cityProfile.greenCoverage}</dd>
            </div>
            <div>
              <dt className="text-muted">Infra. vulnerability</dt>
              <dd className="text-ink2">{cityProfile.infrastructureVulnerability}</dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  );
}
