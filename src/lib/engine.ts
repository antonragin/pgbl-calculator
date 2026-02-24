import {
  SimulationInputs,
  DerivedValues,
  YearlyDataPoint,
  SimulationResult,
} from "./types";
import {
  estimateMarginalRate,
  estimateXout,
  PGBL_DEDUCTIBLE_CAP,
  RULES_VERSION,
} from "./taxRules";

export const ENGINE_VERSION = `1.0.0+rules-${RULES_VERSION}`;

/**
 * Taxable (non-PGBL) terminal wealth per $1 invested.
 * A(N, Y, Z) = (1+Y)^N - Z * ((1+Y)^N - 1)
 *
 * Interpretation: invest $1, it grows at Y per year for N years.
 * At the end, pay capital gains tax Z only on the gains.
 */
function wealthA(N: number, Y: number, Z: number): number {
  const growth = Math.pow(1 + Y, N);
  return growth - Z * (growth - 1);
}

/**
 * PGBL terminal wealth per $1 invested (including refund reinvestment).
 * B(N, Y, Xout, Xin, Z, D) =
 *   (1+Y)^N * (1 - Xout)                          // PGBL growth minus exit tax
 *   + Xin * (1+Y)^(N-D)                            // refund invested outside, gross
 *   - Z * Xin * ((1+Y)^(N-D) - 1)                  // capital gains tax on refund investment
 *
 * If D >= N, the refund has no time to grow, so refund component = Xin (no tax on zero gains).
 */
function wealthB(
  N: number,
  Y: number,
  Xout: number,
  Xin: number,
  Z: number,
  D: number
): number {
  const pgblGrowth = Math.pow(1 + Y, N);
  const pgblNet = pgblGrowth * (1 - Xout);

  const refundHorizon = Math.max(0, N - D);
  let refundComponent: number;
  if (refundHorizon <= 0) {
    refundComponent = Xin; // refund received but no growth time
  } else {
    const refundGrowth = Math.pow(1 + Y, refundHorizon);
    refundComponent = Xin * refundGrowth - Z * Xin * (refundGrowth - 1);
  }

  return pgblNet + refundComponent;
}

/**
 * Compute the annualized advantage in basis points.
 * delta(N) = B(N)^(1/N) - A(N)^(1/N)
 */
function annualizedDelta(a: number, b: number, N: number): number {
  if (N <= 0 || a <= 0 || b <= 0) return 0;
  const deltaRaw = Math.pow(b, 1 / N) - Math.pow(a, 1 / N);
  return deltaRaw * 10000; // basis points
}

/**
 * Derive intermediate values from inputs.
 */
export function deriveValues(inputs: SimulationInputs): DerivedValues {
  const xin = estimateMarginalRate(inputs.annualIncome);

  const xout = estimateXout(
    inputs.regime,
    inputs.horizonYears,
    inputs.annualIncome
  );

  const maxDeductible = inputs.annualIncome * PGBL_DEDUCTIBLE_CAP;
  const contributionAmount = inputs.annualIncome * inputs.contributionPct;
  const deductibleAmount = Math.min(contributionAmount, maxDeductible);
  const refundAmount = deductibleAmount * xin;

  return {
    xin,
    xout,
    deductibleAmount,
    contributionAmount,
    refundAmount,
  };
}

/**
 * Run the full simulation and produce a time series.
 */
export function runSimulation(inputs: SimulationInputs): SimulationResult {
  const derived = deriveValues(inputs);
  const { xin, xout } = derived;
  const Y = inputs.expectedReturn;
  const Z = inputs.capitalGainsTax;
  const D = inputs.refundDelayYears;
  const N = inputs.horizonYears;

  // Apply fees by reducing the effective return
  let effectiveY = Y;
  if (inputs.feesEnabled) {
    effectiveY = Math.max(0, Y - inputs.adminFeePct);
    // Performance fee reduces returns proportionally
    if (inputs.performanceFeePct > 0) {
      effectiveY = effectiveY * (1 - inputs.performanceFeePct);
    }
  }

  const timeseries: YearlyDataPoint[] = [];
  let breakEvenYear: number | null = null;

  for (let year = 0; year <= N; year++) {
    const a = wealthA(year, effectiveY, Z);
    const b = wealthB(year, effectiveY, xout, xin, Z, D);
    const delta = year > 0 ? annualizedDelta(a, b, year) : 0;

    // Break down PGBL components
    const pgblGrowth = Math.pow(1 + effectiveY, year);
    const pgblNet = pgblGrowth * (1 - xout);
    const refundHorizon = Math.max(0, year - D);
    let refundComp: number;
    if (refundHorizon <= 0) {
      refundComp = year >= D ? xin : 0;
    } else {
      const rg = Math.pow(1 + effectiveY, refundHorizon);
      refundComp = xin * rg - Z * xin * (rg - 1);
    }

    timeseries.push({
      year,
      wealthA: a,
      wealthB: b,
      wealthB_pgbl: pgblNet,
      wealthB_refund: refundComp,
      annualizedDelta: delta,
    });

    // Detect break-even (first year where B >= A after year 0)
    if (year > 0 && breakEvenYear === null && b >= a) {
      breakEvenYear = year;
    }
  }

  const terminalA = timeseries[N].wealthA;
  const terminalB = timeseries[N].wealthB;
  const finalDelta = timeseries[N].annualizedDelta;

  return {
    inputs,
    derived,
    timeseries,
    terminalA,
    terminalB,
    annualizedDelta: finalDelta,
    breakEvenYear,
    engineVersion: ENGINE_VERSION,
  };
}

/**
 * Format BRL currency.
 */
export function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format percentage.
 */
export function formatPct(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Format basis points.
 */
export function formatBps(bps: number): string {
  return `${bps >= 0 ? "+" : ""}${bps.toFixed(0)} bps`;
}
