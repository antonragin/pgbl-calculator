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
    description: "Retorno moderado, horizonte longo",
    inputs: {
      ...DEFAULT_INPUTS,
      expectedReturn: 0.10,
      horizonYears: 15,
      contributionPct: 0.06,
    },
  },
  typical: {
    label: "Tipico",
    description: "Perfil medio de investidor CLT",
    inputs: { ...DEFAULT_INPUTS },
  },
  aggressive: {
    label: "Agressivo",
    description: "Retorno alto, contribuicao maxima",
    inputs: {
      ...DEFAULT_INPUTS,
      expectedReturn: 0.20,
      horizonYears: 20,
      contributionPct: 0.12,
    },
  },
} as const;
