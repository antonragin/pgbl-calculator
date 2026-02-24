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

export const PRESETS = {
  conservative: {
    label: "Conservador",
    description: "R$80k, 10% a.a., 15 anos, 6%",
    inputs: {
      ...DEFAULT_INPUTS,
      annualIncome: 80000,
      expectedReturn: 0.10,
      horizonYears: 15,
      contributionPct: 0.06,
    },
  },
  typical: {
    label: "Tipico",
    description: "R$120k, 12% a.a., 10 anos, 12%",
    inputs: {
      ...DEFAULT_INPUTS,
      expectedReturn: 0.12,
    },
  },
  aggressive: {
    label: "Agressivo",
    description: "R$300k, 18% a.a., 20 anos, otimista",
    inputs: {
      ...DEFAULT_INPUTS,
      annualIncome: 300000,
      expectedReturn: 0.18,
      horizonYears: 20,
      contributionPct: 0.12,
      regime: "optimistic" as const,
    },
  },
} as const;
