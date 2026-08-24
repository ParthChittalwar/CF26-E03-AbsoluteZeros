export class SimulationInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SimulationInputError";
  }
}
