import { useEffect, useState, useCallback } from "react";
import type { ScenarioConfig, InterventionConfig, RecommendationResponse } from "./types";
import { DEFAULT_CITY_PROFILE, DEFAULT_WEIGHTS } from "./constants";
import {
  fetchScenarios,
  fetchInterventions,
  fetchHealth,
  recommendStrategy,
  runSensitivityAnalysis,
  apiErrorMessage,
} from "./api/client"; 

import Header from "./components/Header";
import TelemetryBar from "./components/TelemetryBar";
import StepNav from "./components/StepNav";
import SetupPanel from "./components/SetupPanel";
import StrategyExplorer from "./components/StrategyExplorer";
import RecommendationHero from "./components/RecommendationHero";
import BaselineComparison from "./components/BaselineComparison";
import ComparisonTable from "./components/ComparisonTable";
import DamageChart from "./components/DamageChart";
import UncertaintyChart from "./components/UncertaintyChart";
import SensitivityPanel from "./components/SensitivityPanel";
import ExperimentHistory from "./components/ExperimentHistory";
import ErrorBanner from "./components/ErrorBanner";
import MetricCard from "./components/MetricCard";
import { Droplets, Sun, Shield, Users, Clock, TrendingUp } from "lucide-react";
import { riskTone } from "./lib/risk";

type Step = "setup" | "explorer" | "results" | "history";

export default function App() {
  const [scenarios, setScenarios] = useState<ScenarioConfig[]>([]);
  const [interventions, setInterventions] = useState<InterventionConfig[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [dbConnected, setDbConnected] = useState<boolean | null>(null);

  const [step, setStep] = useState<Step>("setup");
  const [scenarioId, setScenarioId] = useState("extreme-flood");
  const [budgetCr, setBudgetCr] = useState(100);
  const [simulationCount, setSimulationCount] = useState(500);
  const [randomSeed, setRandomSeed] = useState(2026);
  const [weights, setWeights] = useState(DEFAULT_WEIGHTS);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [recommendation, setRecommendation] = useState<RecommendationResponse | null>(
    null
  );
  const [recommending, setRecommending] = useState(false);
  const [rerunning, setRerunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCatalog() {
      try {
        const [s, i] = await Promise.all([fetchScenarios(), fetchInterventions()]);
        setScenarios(s);
        setInterventions(i);
      } catch (err) {
        setError(apiErrorMessage(err));
      } finally {
        setCatalogLoading(false);
      }
    }
    loadCatalog();

    fetchHealth()
      .then((h) => setDbConnected(h.dbConnected))
      .catch(() => setDbConnected(false));
  }, []);

  function toggleIntervention(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  const runRecommendation = useCallback(
    async (seedOverride?: number) => {
      setError(null);
      try {
        const response = await recommendStrategy({
          cityProfile: DEFAULT_CITY_PROFILE,
          scenarioId,
          budgetCr,
          objectiveWeights: weights,
          simulationCount,
          randomSeed: seedOverride ?? randomSeed,
        });
        setRecommendation(response);
        return response;
      } catch (err) {
        setError(apiErrorMessage(err));
        throw err;
      }
    },
    [scenarioId, budgetCr, weights, simulationCount, randomSeed]
  );

  async function handleRecommend() {
    setRecommending(true);
    try {
      await runRecommendation();
      setStep("results");
    } catch {
      // error already surfaced via state
    } finally {
      setRecommending(false);
    }
  }

  async function handleRerun() {
    setRerunning(true);
    try {
      await runRecommendation(randomSeed); // same seed, on purpose: proves reproducibility
    } catch {
      // error already surfaced via state
    } finally {
      setRerunning(false);
    }
  }

  async function handleSensitivityRun() {
    const strategyIds = recommendation?.recommended.interventionIds ?? selectedIds;
    return runSensitivityAnalysis({
      cityProfile: DEFAULT_CITY_PROFILE,
      scenarioId,
      budgetCr,
      selectedInterventionIds: strategyIds,
      objectiveWeights: weights,
      simulationCount,
      randomSeed,
    });
  }

  const currentScenario = scenarios.find((s) => s.id === scenarioId);

  return (
    <div className="min-h-screen bg-ink">
      <TelemetryBar
        scenarioName={currentScenario?.name ?? scenarioId}
        budgetCr={budgetCr}
        simulationCount={simulationCount}
        randomSeed={randomSeed}
        dbConnected={dbConnected}
      />
      <Header />

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <StepNav step={step} onChange={setStep} resultsReady={!!recommendation} />
        </div>

        {error && (
          <div className="mb-6">
            <ErrorBanner message={error} onDismiss={() => setError(null)} />
          </div>
        )}

        {catalogLoading ? (
          <div className="py-24 text-center font-mono text-sm text-muted">
            Loading scenario and intervention catalog…
          </div>
        ) : (
          <>
            {step === "setup" && (
              <SetupPanel
                scenarios={scenarios}
                scenarioId={scenarioId}
                onScenarioChange={setScenarioId}
                budgetCr={budgetCr}
                onBudgetChange={setBudgetCr}
                simulationCount={simulationCount}
                onSimulationCountChange={setSimulationCount}
                randomSeed={randomSeed}
                onRandomSeedChange={setRandomSeed}
                weights={weights}
                onWeightsChange={setWeights}
                cityProfile={DEFAULT_CITY_PROFILE}
              />
            )}

            {step === "explorer" && (
              <StrategyExplorer
                interventions={interventions}
                selectedIds={selectedIds}
                onToggle={toggleIntervention}
                budgetCr={budgetCr}
                onRecommend={handleRecommend}
                recommending={recommending}
              />
            )}

            {step === "results" && recommendation && (
              <div className="space-y-6">
                <RecommendationHero
                  recommended={recommendation.recommended}
                  reason={recommendation.reason}
                  randomSeed={randomSeed}
                  onRerun={handleRerun}
                  rerunning={rerunning}
                />

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <MetricCard
                    label="Flood risk"
                    value={`${Math.round(
                      recommendation.recommended.simulationResult.averageFloodRisk * 100
                    )}%`}
                    icon={Droplets}
                    tone={riskTone(recommendation.recommended.simulationResult.averageFloodRisk)}
                  />
                  <MetricCard
                    label="Heat risk"
                    value={`${Math.round(
                      recommendation.recommended.simulationResult.averageHeatRisk * 100
                    )}%`}
                    icon={Sun}
                    tone={riskTone(recommendation.recommended.simulationResult.averageHeatRisk)}
                  />
                  <MetricCard
                    label="Population affected"
                    value={recommendation.recommended.simulationResult.populationAffected.toLocaleString(
                      undefined,
                      { maximumFractionDigits: 0 }
                    )}
                    icon={Users}
                  />
                  <MetricCard
                    label="Recovery time"
                    value={`${recommendation.recommended.simulationResult.recoveryTimeMonths.toFixed(
                      1
                    )} mo`}
                    icon={Clock}
                  />
                  <MetricCard
                    label="Resilience score"
                    value={recommendation.recommended.simulationResult.resilienceScore.toFixed(
                      3
                    )}
                    icon={Shield}
                    tone="teal"
                  />
                  <MetricCard
                    label="Strategies evaluated"
                    value={`${recommendation.feasibleStrategiesEvaluated} / ${recommendation.totalStrategiesGenerated}`}
                    icon={TrendingUp}
                  />
                </div>

                <BaselineComparison
                  baseline={recommendation.baseline.simulationResult}
                  recommended={recommendation.recommended}
                />

                <div className="grid gap-6 lg:grid-cols-2">
                  <DamageChart
                    recommended={recommendation.recommended}
                    alternatives={recommendation.alternatives}
                  />
                  <UncertaintyChart
                    uncertainty={recommendation.recommended.simulationResult.uncertainty}
                  />
                </div>

                <div>
                  <h3 className="mb-3 font-display text-lg font-semibold text-ink2">
                    Top strategies compared
                  </h3>
                  <ComparisonTable
                    recommended={recommendation.recommended}
                    alternatives={recommendation.alternatives}
                  />
                </div>

                <SensitivityPanel onRun={handleSensitivityRun} />
              </div>
            )}

            {step === "results" && !recommendation && (
              <div className="py-24 text-center">
                <p className="font-mono text-sm text-muted">
                  No recommendation yet — run one from the Strategy Explorer.
                </p>
              </div>
            )}

            {step === "history" && <ExperimentHistory />}
          </>
        )}
      </main>

      <footer className="border-t border-border py-6 text-center font-mono text-xs text-muted">
        ClimateShield · Prototype decision-support simulator · Not a real-world
        climate forecasting system
      </footer>
    </div>
  );
}
