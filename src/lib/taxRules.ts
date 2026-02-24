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
  if (annualTaxableIncome <= 0) return 0;
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
  if (annualTaxableIncome <= 0) return 0;
  const bracket = IRPF_ANNUAL_BRACKETS.find((b) => annualTaxableIncome <= b.upTo)
    || IRPF_ANNUAL_BRACKETS[IRPF_ANNUAL_BRACKETS.length - 1];
  return bracket.rate;
}

/**
 * Get the regressive regime tax rate for a given holding period.
 */
export function getRegressiveRate(holdingYears: number): number {
  const bracket = REGRESSIVE_SCHEDULE.find(
    (b) => holdingYears >= b.minYears && holdingYears < b.maxYears
  );
  return bracket ? bracket.rate : 0.10;
}

/**
 * Estimate Xout (tax at redemption) based on regime and horizon.
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
