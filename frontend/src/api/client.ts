import axios from "axios";
import type {
  ScenarioConfig,
  InterventionConfig,
  RecommendationResponse,
  ComparisonResult,
  SensitivityParameterResult,
  SimulationRunRequest,
  HistorySummary,
  RerunResponse,
} from "../types";

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  "http://localhost:5000";

export const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 30000,
});

export async function fetchScenarios(): Promise<ScenarioConfig[]> {
  const res = await api.get<{ scenarios: ScenarioConfig[] }>("/scenarios");
  return res.data.scenarios;
}

export async function fetchInterventions(): Promise<InterventionConfig[]> {
  const res = await api.get<{ interventions: InterventionConfig[] }>(
    "/interventions"
  );
  return res.data.interventions;
}

export async function fetchHealth(): Promise<{
  status: string;
  dbConnected: boolean;
}> {
  const res = await api.get("/health");
  return res.data;
}

export async function recommendStrategy(
  request: Omit<SimulationRunRequest, "selectedInterventionIds">
): Promise<RecommendationResponse> {
  const res = await api.post<RecommendationResponse>(
    "/strategies/recommend",
    request
  );
  return res.data;
}

export async function compareToBaseline(
  request: SimulationRunRequest
): Promise<ComparisonResult> {
  const res = await api.post<ComparisonResult>("/simulations/compare", request);
  return res.data;
}

export async function runSensitivityAnalysis(
  request: SimulationRunRequest
): Promise<SensitivityParameterResult[]> {
  const res = await api.post<{ sensitivity: SensitivityParameterResult[] }>(
    "/simulations/sensitivity",
    request
  );
  return res.data.sensitivity;
}

export async function fetchHistory(): Promise<{
  persistenceAvailable: boolean;
  simulations: HistorySummary[];
}> {
  const res = await api.get("/simulations");
  return res.data;
}

export async function rerunSimulation(id: string): Promise<RerunResponse> {
  // No body: the backend re-uses the originally stored random seed,
  // which is the entire point — proving the same seed reproduces.
  const res = await api.post<RerunResponse>(`/simulations/${id}/rerun`);
  return res.data;
}

// Extracts a human-readable message from a failed API call, whether it
// came from our own SimulationInputError responses or a network failure.
export function apiErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const serverMessage = err.response?.data?.error;
    if (typeof serverMessage === "string") return serverMessage;
    if (err.code === "ECONNABORTED") return "The request timed out.";
    if (!err.response) return "Could not reach the backend. Is it running?";
    return `Request failed (${err.response.status}).`;
  }
  return "Something went wrong.";
}
