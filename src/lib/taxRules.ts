/**
 * Brazilian tax rules configuration - 2025/2026 reference year.
 * These should be updated annually when Receita Federal publishes new brackets.
 */

export const TAX_YEAR = 2025;
export const RULES_VERSION = "2025.1";

// IRPF annual progressive brackets (base year 2024, declaration 2025)
// Values in BRL per year
export interface TaxBracket {
  upTo: number;     // upper limit (Infinity for last bracket)
  rate: number;     // marginal rate 0-1
  deduction: number; // deduction for this bracket
}

export const IRPF_ANNUAL_BRACKETS: TaxBracket[] = [
  { upTo: 26963.20,  rate: 0.000, deduction: 0 },
  { upTo: 33919.80,  rate: 0.075, deduction: 2022.24 },
  { upTo: 45012.60,  rate: 0.150, deduction: 4566.23 },
  { upTo: 55976.16,  rate: 0.225, deduction: 7942.17 },
  { upTo: Infinity,  rate: 0.275, deduction: 10740.98 },
];

// PGBL deductibility cap: 12% of taxable income
export const PGBL_DEDUCTIBLE_CAP = 0.12;

// Current SELIC rate (% p.a.) — update when Copom changes the target rate
// Last updated: Feb 2026 (Copom decision Jan 2026 — 5th consecutive hold at 15%)
export const SELIC_RATE = 0.15;

// IOF on VGBL contributions exceeding R$600k/year (Decreto 12.499/2025, effective 2026)
export const IOF_VGBL_THRESHOLD = 600_000;
export const IOF_VGBL_RATE = 0.05;

/**
 * Compute IOF tax on VGBL annual contributions above the threshold.
 * Only applies to VGBL — PGBL is exempt.
 */
export function computeVGBLIOF(annualContribution: number): number {
  if (annualContribution <= IOF_VGBL_THRESHOLD) return 0;
  return (annualContribution - IOF_VGBL_THRESHOLD) * IOF_VGBL_RATE;
}

// Regressive regime schedule (tabela regressiva de previdencia)
export interface RegressiveBracket {
  minYears: number;
  maxYears: number;
  rate: number;
}

export const REGRESSIVE_SCHEDULE: RegressiveBracket[] = [
  { minYears: 0,  maxYears: 2,  rate: 0.35 },
  { minYears: 2,  maxYears: 4,  rate: 0.30 },
  { minYears: 4,  maxYears: 6,  rate: 0.25 },
  { minYears: 6,  maxYears: 8,  rate: 0.20 },
  { minYears: 8,  maxYears: 10, rate: 0.15 },
  { minYears: 10, maxYears: Infinity, rate: 0.10 },
];

/**
 * Compute total IRPF on a given annual taxable income.
 */
export function computeIRPF(annualTaxableIncome: number): number {
  if (!annualTaxableIncome || annualTaxableIncome <= 0) return 0;
  const bracket = IRPF_ANNUAL_BRACKETS.find((b) => annualTaxableIncome <= b.upTo)
    || IRPF_ANNUAL_BRACKETS[IRPF_ANNUAL_BRACKETS.length - 1];
  return Math.max(0, annualTaxableIncome * bracket.rate - bracket.deduction);
}

/**
 * Estimate the marginal IRPF rate for a given annual income.
 * This is the rate applied to the last R$ of income — i.e., the tax saving
 * from deducting R$1 of PGBL contribution.
 */
export function estimateMarginalRate(annualTaxableIncome: number): number {
  if (!annualTaxableIncome || annualTaxableIncome <= 0) return 0;
  const bracket = IRPF_ANNUAL_BRACKETS.find((b) => annualTaxableIncome <= b.upTo)
    || IRPF_ANNUAL_BRACKETS[IRPF_ANNUAL_BRACKETS.length - 1];
  return bracket.rate;
}

/**
 * Get the regressive regime tax rate for a given holding period.
 *
 * Lei 11.053/2004 uses "igual ou inferior" (≤) boundaries:
 *   ≤2yr → 35%, >2 and ≤4yr → 30%, etc.
 * Matches proj002's regressive_rate() which uses `current_date <= boundary`.
 */
export function getRegressiveRate(holdingYears: number): number {
  for (const b of REGRESSIVE_SCHEDULE) {
    if (holdingYears <= b.maxYears) return b.rate;
  }
  return 0.10;
}

/**
 * Estimate Xout (tax at redemption) based on regime and horizon.
 * @deprecated Use computeBestXout() instead — engine now always uses "best of" logic.
 */
export function estimateXout(
  regime: "progressive" | "regressive" | "optimistic",
  horizonYears: number,
  annualIncome: number
): number {
  switch (regime) {
    case "regressive":
      return getRegressiveRate(horizonYears);
    case "progressive":
      // Progressive: full amount taxed as income at marginal rate
      return estimateMarginalRate(annualIncome);
    case "optimistic":
      // Best case: regressive minimum (10% after 10 years)
      return 0.10;
  }
}

/**
 * Compute the "best of" tax rate for a given year.
 * Returns min(regressive_rate(year), progressive_marginal_rate(income)).
 * Models investor tax optionality: can choose regime at redemption (Lei 14.803/2024)
 * and can hold multiple certificates to optimize per-certificate.
 */
export function computeBestXout(year: number, annualIncome: number): number {
  return Math.min(getRegressiveRate(year), estimateMarginalRate(annualIncome));
}
