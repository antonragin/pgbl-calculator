import { SimulationInputs } from "./types";

export const DEFAULT_INPUTS: SimulationInputs = {
  annualIncome: 120000,
  filingMode: "complete",
  contributesToINSS: true,
  wrapper: "PGBL",
  contributionPct: 0.12,
  regime: "regressive",
  expectedReturn: 0.15,
  horizonYears: 10,
  capitalGainsTax: 0.15,
  refundDelayYears: 0.75,
  adminFeePct: 0.01,
  performanceFeePct: 0,
  feesEnabled: false,
};

