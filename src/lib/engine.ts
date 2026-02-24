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

export const ENGINE_VERSION = `1.1.0+rules-${RULES_VERSION}`;

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
 *
 * Yf = fund return (may be fee-reduced for PGBL funds)
 * Yr = refund reinvestment return (base market return, no fund fees)
 *
 * B(N, Yf, Yr, Xout, Xin, Z, D) =
 *   (1+Yf)^N * (1 - Xout)                         // PGBL growth minus exit tax on full balance
 *   + Xin * (1+Yr)^(N-D)                           // refund invested outside, gross
 *   - Z * Xin * ((1+Yr)^(N-D) - 1)                 // capital gains tax on refund gains
 *
 * For VGBL: tax at exit applies only to gains, not full balance:
 *   (1+Yf)^N - Xout * ((1+Yf)^N - 1)
 *   + Xin * (1+Yr)^(N-D) - Z * Xin * ((1+Yr)^(N-D) - 1)
 */
function wealthB(
  N: number,
  Yf: number,
  Yr: number,
  Xout: number,
  Xin: number,
  Z: number,
  D: number,
  isVGBL: boolean
): number {
  const fundGrowth = Math.pow(1 + Yf, N);
  // PGBL: exit tax on full balance. VGBL: exit tax only on gains.
  const fundNet = isVGBL
    ? fundGrowth - Xout * (fundGrowth - 1)
    : fundGrowth * (1 - Xout);

  let refundComponent: number;
  if (N < D) {
    refundComponent = 0; // refund not yet received within this horizon
  } else if (N === D) {
    refundComponent = Xin; // refund arrives exactly at horizon, no growth time
  } else {
    const refundHorizon = N - D;
    const refundGrowth = Math.pow(1 + Yr, refundHorizon);
    refundComponent = Xin * refundGrowth - Z * Xin * (refundGrowth - 1);
  }

  return fundNet + refundComponent;
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
  // PGBL deduction only applies when filing "complete", contributing to INSS,
  // and using a PGBL wrapper. For VGBL or simplified filing, xin = 0.
  const pgblDeductible =
    inputs.filingMode === "complete" &&
    inputs.contributesToINSS &&
    inputs.wrapper === "PGBL";

  const xin = pgblDeductible ? estimateMarginalRate(inputs.annualIncome) : 0;

  const xout = estimateXout(
    inputs.regime,
    inputs.horizonYears,
    inputs.annualIncome
  );

  const maxDeductible = inputs.annualIncome * PGBL_DEDUCTIBLE_CAP;
  const contributionPct = Math.max(0, Math.min(1, inputs.contributionPct));
  const contributionAmount = inputs.annualIncome * contributionPct;
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
  const D = Math.ceil(inputs.refundDelayYears); // discrete model: refund arrives at start of this year
  const N = Math.max(1, Math.round(inputs.horizonYears));
  const isVGBL = inputs.wrapper === "VGBL";

  // Fund fees only reduce the PGBL/VGBL fund's return.
  // The refund is reinvested outside the fund at the base market return Y.
  // The non-PGBL comparator also uses the base return Y.
  let fundY = Y;
  if (inputs.feesEnabled) {
    fundY = Math.max(0, Y - inputs.adminFeePct);
    if (inputs.performanceFeePct > 0) {
      fundY = Math.max(0, fundY * (1 - inputs.performanceFeePct));
    }
  }

  const timeseries: YearlyDataPoint[] = [];
  let breakEvenYear: number | null = null;

  for (let year = 0; year <= N; year++) {
    const a = wealthA(year, Y, Z);
    const b = wealthB(year, fundY, Y, xout, xin, Z, D, isVGBL);
    const delta = year > 0 ? annualizedDelta(a, b, year) : 0;

    // Break down components — must match wealthB() logic exactly.
    const fundGrowth = Math.pow(1 + fundY, year);
    const fundNet = isVGBL
      ? fundGrowth - xout * (fundGrowth - 1)
      : fundGrowth * (1 - xout);
    let refundComp: number;
    if (year < D) {
      refundComp = 0; // refund not yet received
    } else if (year === D || (year - D) === 0) {
      refundComp = xin; // refund just arrived, no growth
    } else {
      const rh = year - D;
      const rg = Math.pow(1 + Y, rh); // refund grows at base Y
      refundComp = xin * rg - Z * xin * (rg - 1);
    }

    timeseries.push({
      year,
      wealthA: a,
      wealthB: b,
      wealthB_pgbl: fundNet,
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
