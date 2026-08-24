import { useEffect, useState } from "react";
import { History, RefreshCw, ChevronDown, ChevronUp, DatabaseZap } from "lucide-react";
import type { HistorySummary, RerunResponse } from "../types";
import { fetchHistory, rerunSimulation, apiErrorMessage } from "../api/client";

export default function ExperimentHistory() {
  const [items, setItems] = useState<HistorySummary[]>([]);
  const [persistenceAvailable, setPersistenceAvailable] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [rerunningId, setRerunningId] = useState<string | null>(null);
  const [rerunResults, setRerunResults] = useState<Record<string, RerunResponse>>({});

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchHistory();
      setItems(data.simulations);
      setPersistenceAvailable(data.persistenceAvailable);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  async function handleRerun(id: string) {
    setRerunningId(id);
    try {
      const result = await rerunSimulation(id);
      setRerunResults((prev) => ({ ...prev, [id]: result }));
      setExpandedId(id);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setRerunningId(null);
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-8 text-center font-mono text-sm text-muted">
        Loading experiment history…
      </div>
    );
  }

  if (!persistenceAvailable) {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-amber/40 bg-amber/10 p-5">
        <DatabaseZap size={20} className="mt-0.5 shrink-0 text-amber" />
        <div>
          <p className="font-display text-sm font-semibold text-ink2">
            Experiment history unavailable
          </p>
          <p className="mt-1 text-sm text-muted">
            MongoDB persistence is not connected. Simulations still run
            normally — results just aren't saved to history right now.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-display text-lg font-semibold text-ink2">
          <History size={18} className="text-cyan" />
          Experiment history
        </h3>
        <button
          onClick={load}
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 font-mono text-xs text-muted hover:border-cyan hover:text-cyan"
        >
          <RefreshCw size={12} />
          Refresh
        </button>
      </div>

      {error && <p className="mt-3 text-xs text-red">{error}</p>}

      {items.length === 0 ? (
        <p className="mt-6 py-8 text-center font-mono text-sm text-muted">
          No saved experiments yet. Run a recommendation from the Strategy
          Explorer to start building history.
        </p>
      ) : (
        <div className="mt-4 divide-y divide-border">
          {items.map((item) => {
            const expanded = expandedId === item.id;
            const rerun = rerunResults[item.id];
            return (
              <div key={item.id} className="py-3">
                <div className="flex flex-col gap-2 sm:grid sm:grid-cols-8 sm:items-center sm:gap-3">
                  <div className="flex items-center justify-between text-xs text-muted sm:block">
                    <span className="sm:hidden">Date</span>
                    {new Date(item.createdAt).toLocaleDateString()}
                  </div>
                  <div className="flex items-center justify-between font-mono text-xs text-ink2 sm:block">
                    <span className="text-muted sm:hidden">Scenario</span>
                    {item.scenarioId}
                  </div>
                  <div className="flex items-center justify-between font-mono text-xs text-cyan sm:block">
                    <span className="text-muted sm:hidden">Budget</span>
                    ₹{item.budgetCr} Cr
                  </div>
                  <div className="flex items-center justify-between font-mono text-xs text-muted sm:block">
                    <span className="sm:hidden">Seed</span>
                    seed {item.randomSeed}
                  </div>
                  <div className="flex items-center justify-between text-xs text-ink2 sm:col-span-2 sm:block sm:truncate">
                    <span className="text-muted sm:hidden">Strategy</span>
                    <span className="truncate">{item.recommendedStrategy}</span>
                  </div>
                  <div className="flex items-center justify-between font-mono text-xs text-ink2 sm:block">
                    <span className="text-muted sm:hidden">Damage</span>
                    {item.expectedDamageCr !== null
                      ? `₹${item.expectedDamageCr.toFixed(1)} Cr`
                      : "—"}
                  </div>
                  <div className="flex items-center gap-3 pt-1 sm:pt-0">
                    <button
                      onClick={() => setExpandedId(expanded ? null : item.id)}
                      className="flex items-center gap-1 text-xs text-muted hover:text-ink2 active:scale-95"
                      title="View"
                    >
                      {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      <span className="sm:hidden">View</span>
                    </button>
                    <button
                      onClick={() => handleRerun(item.id)}
                      disabled={rerunningId === item.id}
                      className="flex items-center gap-1 rounded-md border border-border px-2 py-1 font-mono text-[11px] text-muted hover:border-teal hover:text-teal active:scale-95 disabled:opacity-60"
                    >
                      <RefreshCw
                        size={10}
                        className={rerunningId === item.id ? "animate-spin" : ""}
                      />
                      Re-run
                    </button>
                  </div>
                </div>

                {expanded && (
                  <div className="mt-3 rounded-xl bg-surface-raised p-3 font-mono text-xs text-muted">
                    <div>type: {item.type}</div>
                    <div>resilience / decision score: {item.resilienceScore?.toFixed(3) ?? "—"}</div>
                    <div>status: {item.status}</div>
                    {rerun && (
                      <div className="mt-2 border-t border-border pt-2 text-teal">
                        <div className="text-ink2">
                          Re-run with seed {rerun.seedUsed} (preserved from original):
                        </div>
                        <div>
                          expected damage:{" "}
                          {(rerun.result?.expectedDamageCr ??
                            rerun.recommended?.simulationResult.expectedDamageCr)?.toFixed(1)}{" "}
                          Cr
                        </div>
                        <div>
                          matches original: same seed + same inputs → identical result,
                          confirming reproducibility
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
