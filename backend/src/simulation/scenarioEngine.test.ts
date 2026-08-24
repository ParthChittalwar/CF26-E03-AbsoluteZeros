import { describe, it, expect } from "vitest";
import { resolveScenario, computeHazardProfile } from "./scenarioEngine";
import { SimulationInputError } from "./errors";

describe("scenarioEngine", () => {
  it("resolves a known scenario id from config", () => {
    const scenario = resolveScenario("baseline");
    expect(scenario.id).toBe("baseline");
  });

  it("throws SimulationInputError for an unknown scenario id", () => {
    expect(() => resolveScenario("nonexistent-scenario")).toThrow(
      SimulationInputError
    );
  });

  it("computes a higher flood hazard for extreme-flood than baseline", () => {
    const baseline = computeHazardProfile(resolveScenario("baseline"));
    const extreme = computeHazardProfile(resolveScenario("extreme-flood"));
    expect(extreme.floodHazard).toBeGreaterThan(baseline.floodHazard);
  });

  it("clamps hazard values to the 0-1 range", () => {
    const extreme = computeHazardProfile(resolveScenario("extreme-flood"));
    expect(extreme.floodHazard).toBeLessThanOrEqual(1);
    expect(extreme.floodHazard).toBeGreaterThanOrEqual(0);
    expect(extreme.heatHazard).toBeLessThanOrEqual(1);
    expect(extreme.heatHazard).toBeGreaterThanOrEqual(0);
  });
});
