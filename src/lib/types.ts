export type FilingMode = "complete" | "simplified";
export type Wrapper = "PGBL" | "VGBL";
export type RedemptionRegime = "progressive" | "regressive" | "optimistic";
export type ViewMode = "beginner" | "advanced";

export interface SimulationInputs {
  annualIncome: number;
  filingMode: FilingMode;
  contributesToINSS: boolean;
  wrapper: Wrapper;
  contributionPct: number;   // 0-1 (e.g. 0.12 for 12%)
  regime: RedemptionRegime;
  expectedReturn: number;    // annual, 0-1 (e.g. 0.15 for 15%)
  horizonYears: number;      // integer 1-30
  capitalGainsTax: number;   // 0-1 (e.g. 0.15)
  refundDelayYears: number;  // 0-1.5
  adminFeePct: number;       // 0-1 (annual)
  performanceFeePct: number; // 0-1
  feesEnabled: boolean;
}

export interface DerivedValues {
  xin: number;               // estimated marginal IR rate (deduction benefit)
  xout: number;              // tax rate at redemption
  deductibleAmount: number;  // R$ amount deductible
  contributionAmount: number;// R$ actual contribution
  refundAmount: number;      // R$ estimated refund
}

export interface YearlyDataPoint {
  year: number;
  wealthA: number;           // non-PGBL (taxable)
  wealthB: number;           // PGBL total
  wealthB_pgbl: number;      // PGBL internal component
  wealthB_refund: number;    // refund invested outside
  annualizedDelta: number;   // bps
}

export interface SimulationResult {
  inputs: SimulationInputs;
  derived: DerivedValues;
  timeseries: YearlyDataPoint[];
  terminalA: number;
  terminalB: number;
  annualizedDelta: number;   // final year delta in bps
  breakEvenYear: number | null;
  engineVersion: string;
}

export interface SavedScenario {
  id: string;
  name: string;
  createdAt: string;
  result: SimulationResult;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
}
