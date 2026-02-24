"use client";

import { SimulationInputs } from "@/lib/types";
import { SELIC_RATE } from "@/lib/taxRules";

interface Props {
  inputs: SimulationInputs;
  onChange: (partial: Partial<SimulationInputs>) => void;
}

export default function InvestmentStep({ inputs, onChange }: Props) {
  const aboveSelic = inputs.expectedReturn > SELIC_RATE;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">
          Investimento e horizonte
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Defina o retorno esperado e o horizonte de investimento.
        </p>
      </div>

      {/* Expected return */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          Retorno anual esperado
        </label>
        <input
          type="range"
          aria-label="Retorno anual esperado"
          min={0.05}
          max={0.25}
          step={0.005}
          value={inputs.expectedReturn}
          onChange={(e) => onChange({ expectedReturn: Number(e.target.value) })}
          className="w-full"
        />
        <div className="mt-1 flex items-center justify-between text-sm">
          <span className="text-gray-400">5%</span>
          <span className="font-semibold text-primary-700">
            {(inputs.expectedReturn * 100).toFixed(1)}% a.a.
          </span>
          <span className="text-gray-400">25%</span>
        </div>
        <p className="mt-1 text-xs text-gray-400">
          Esta e uma premissa. O retorno real pode variar. Valores mais altos
          ampliam a vantagem do {inputs.wrapper}.
        </p>
        {aboveSelic && (
          <p className="mt-2 rounded-md bg-amber-50 p-2 text-xs text-amber-700">
            O retorno selecionado ({(inputs.expectedReturn * 100).toFixed(1)}%) esta acima da taxa SELIC atual ({(SELIC_RATE * 100).toFixed(0)}% a.a.). Tenha cuidado com premissas de retorno muito otimistas — retornos acima da SELIC implicam risco de mercado.
          </p>
        )}
      </div>

      {/* Horizon */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          Horizonte de investimento (anos)
        </label>
        <input
          type="range"
          aria-label="Horizonte de investimento em anos"
          min={1}
          max={30}
          step={1}
          value={inputs.horizonYears}
          onChange={(e) => onChange({ horizonYears: Number(e.target.value) })}
          className="w-full"
        />
        <div className="mt-1 flex items-center justify-between text-sm">
          <span className="text-gray-400">1 ano</span>
          <span className="font-semibold text-primary-700">
            {inputs.horizonYears} anos
          </span>
          <span className="text-gray-400">30 anos</span>
        </div>
        <div className="mt-2 flex gap-2">
          {[5, 10, 15, 20].map((y) => (
            <button
              type="button"
              key={y}
              onClick={() => onChange({ horizonYears: y })}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                inputs.horizonYears === y
                  ? "bg-primary-100 text-primary-700"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {y} anos
            </button>
          ))}
        </div>
      </div>

      {/* Capital gains tax on the COMPARISON investment (non-PGBL/VGBL) */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          IR sobre ganhos da alternativa sem {inputs.wrapper}
        </label>
        <p className="mb-2 text-xs text-gray-500">
          Este imposto se aplica <strong>somente</strong> ao investimento alternativo (sem {inputs.wrapper}) usado como comparacao. Nao afeta o calculo do {inputs.wrapper} em si.
        </p>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="IR sobre ganhos da alternativa de comparacao">
          {[
            { value: 0, label: "0% (isento)" },
            { value: 0.15, label: "15% (tipico)" },
            { value: 0.225, label: "22.5% (curto prazo)" },
          ].map((opt) => (
            <button
              type="button"
              key={opt.label}
              role="radio"
              aria-checked={inputs.capitalGainsTax === opt.value}
              onClick={() => onChange({ capitalGainsTax: opt.value })}
              className={`flex-1 rounded-lg border-2 p-3 text-center text-sm transition-all ${
                inputs.capitalGainsTax === opt.value
                  ? "border-primary-500 bg-primary-50 font-medium"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <p className="mt-1 text-xs text-gray-400">
          Exemplo: se voce compararia o {inputs.wrapper} com um fundo de renda fixa, use 15%.
          Para LCI/LCA/poupanca (isentos), use 0%.
        </p>
      </div>
    </div>
  );
}
