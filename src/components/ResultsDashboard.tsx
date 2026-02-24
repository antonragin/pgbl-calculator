"use client";

import { useState } from "react";
import { SimulationResult } from "@/lib/types";
import WealthChart from "./WealthChart";
import KeyNumbers from "./KeyNumbers";
import { formatBRL, formatPct } from "@/lib/engine";

interface Props {
  result: SimulationResult;
  onSaveScenario: () => void;
  onOpenChat: () => void;
}

export default function ResultsDashboard({
  result,
  onSaveScenario,
  onOpenChat,
}: Props) {
  const { derived, inputs, terminalA, terminalB } = result;
  const advantage = (terminalB - terminalA) * derived.contributionAmount;
  const [formulasOpen, setFormulasOpen] = useState(false);
  const isVGBL = inputs.wrapper === "VGBL";

  return (
    <div className="space-y-6">
      {/* Hero callout */}
      <div className="rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 p-5 text-white shadow-lg">
        <p className="text-sm font-medium text-primary-100">
          Ao usar {inputs.wrapper} por {inputs.horizonYears} anos, a combinacao de
          beneficio fiscal{derived.refundAmount > 0 ? ` (reembolso de ${formatBRL(derived.refundAmount)})` : ""} e
          tributacao no resgate gera uma vantagem total de
        </p>
        <p className="mt-2 text-3xl font-bold">
          {advantage >= 0 ? "+" : ""}
          {formatBRL(advantage)}
        </p>
        <p className="mt-1 text-xs text-primary-200">
          Retorno extra equivalente: {(result.annualizedDelta / 100).toFixed(2)}%
          a.a. | Premissa: {formatPct(inputs.expectedReturn)} a.a. de retorno
        </p>
      </div>

      {/* Chart */}
      <div className="card">
        <WealthChart
          timeseries={result.timeseries}
          breakEvenYear={result.breakEvenYear}
          refundDelayYears={inputs.refundDelayYears}
          wrapper={inputs.wrapper}
          terminalAdvantagePositive={terminalB >= terminalA}
        />
      </div>

      {/* Key numbers */}
      <div className="card">
        <KeyNumbers result={result} />
      </div>

      {/* IOF notice */}
      {isVGBL && derived.iofAmount > 0 && (
        <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
          IOF sobre VGBL: {formatBRL(derived.iofAmount)} (5% sobre contribuicoes acima de {formatBRL(600000)}/ano)
        </div>
      )}

      {/* Formulas */}
      <div className="card">
        <button
          type="button"
          onClick={() => setFormulasOpen((v) => !v)}
          className="flex w-full items-center justify-between text-sm font-semibold text-gray-700"
        >
          <span>Formulas utilizadas</span>
          <svg
            aria-hidden="true"
            className={`h-4 w-4 text-gray-400 transition-transform ${formulasOpen ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </button>
        {formulasOpen && (
          <div className="mt-4 space-y-4 text-xs text-gray-600">
            <div>
              <p className="font-semibold text-gray-700">Patrimonio sem {inputs.wrapper} (investimento tributavel):</p>
              <pre className="mt-1 overflow-x-auto rounded bg-gray-100 p-2 font-mono">
{`A(N, Y, Z) = (1+Y)^N - Z * ((1+Y)^N - 1)

Valores: N=${inputs.horizonYears}, Y=${(inputs.expectedReturn * 100).toFixed(1)}%, Z=${(inputs.capitalGainsTax * 100).toFixed(1)}%
A = ${terminalA.toFixed(4)}`}
              </pre>
            </div>
            <div>
              <p className="font-semibold text-gray-700">Patrimonio com {inputs.wrapper}:</p>
              <pre className="mt-1 overflow-x-auto rounded bg-gray-100 p-2 font-mono">
{isVGBL
  ? `B(N) = (1+Yf)^N - Xout(N) * ((1+Yf)^N - 1)${derived.iofAmount > 0 ? ` * iofDrag` : ''}

VGBL: imposto no resgate incide apenas sobre ganhos.
Xout(N) = min(regressivo(N), progressivo) = melhor taxa.${derived.iofAmount > 0 ? `
iofDrag = 1 - IOF/contribuicao = ${(1 - derived.iofAmount / derived.contributionAmount).toFixed(4)}
IOF = ${formatBRL(derived.iofAmount)} (5% sobre excedente de ${formatBRL(600000)}/ano)` : ''}`
  : `B(N) = (1+Yf)^N * (1 - Xout(N))
       + Xin * (1+Yr)^(N-D) - Z * Xin * ((1+Yr)^(N-D) - 1)

PGBL: imposto no resgate incide sobre o saldo total.
Xout(N) = min(regressivo(N), progressivo) = melhor taxa.`}
{isVGBL
  ? `
Valores: Xout(${inputs.horizonYears})=${(derived.xout * 100).toFixed(1)}%
B = ${terminalB.toFixed(4)}`
  : `
Valores: Xin=${(derived.xin * 100).toFixed(1)}%, Xout(${inputs.horizonYears})=${(derived.xout * 100).toFixed(1)}%, D=${inputs.refundDelayYears}a
B = ${terminalB.toFixed(4)}`}
              </pre>
            </div>
            <div>
              <p className="font-semibold text-gray-700">Regime de tributacao:</p>
              <pre className="mt-1 overflow-x-auto rounded bg-gray-100 p-2 font-mono">
{`Xout(N) = min(regressivo(N), progressivo(renda))
Para cada ano, usa a menor aliquota entre os regimes.
Grafico mostra "como se resgatasse no ano N".`}
              </pre>
            </div>
            <div>
              <p className="font-semibold text-gray-700">Delta anualizado (pontos-base):</p>
              <pre className="mt-1 overflow-x-auto rounded bg-gray-100 p-2 font-mono">
{`delta = B^(1/N) - A^(1/N) em bps
     = ${result.annualizedDelta.toFixed(1)} bps`}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <button type="button" onClick={onSaveScenario} className="btn-secondary flex-1">
          <span className="mr-2">&#128190;</span>
          Salvar cenario
        </button>
        <button type="button" onClick={onOpenChat} className="btn-primary flex-1">
          <span className="mr-2">&#128172;</span>
          Perguntar ao assistente
        </button>
      </div>

      {/* Disclaimer */}
      <p className="text-center text-xs text-gray-400">
        Esta ferramenta e educacional e nao constitui aconselhamento fiscal,
        juridico ou de investimentos. Consulte um profissional antes de tomar
        decisoes. Motor v{result.engineVersion}.
      </p>
    </div>
  );
}
