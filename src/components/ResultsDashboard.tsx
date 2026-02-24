"use client";

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

  return (
    <div className="space-y-6">
      {/* Hero callout */}
      <div className="rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 p-5 text-white shadow-lg">
        <p className="text-sm font-medium text-primary-100">
          Seu reembolso estimado de{" "}
          <span className="font-bold text-white">
            {formatBRL(derived.refundAmount)}
          </span>{" "}
          investido por {inputs.horizonYears} anos gera uma vantagem de
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
          contributionAmount={derived.contributionAmount}
        />
      </div>

      {/* Key numbers */}
      <div className="card">
        <KeyNumbers result={result} />
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <button onClick={onSaveScenario} className="btn-secondary flex-1">
          <span className="mr-2">&#128190;</span>
          Salvar cenario
        </button>
        <button onClick={onOpenChat} className="btn-primary flex-1">
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
