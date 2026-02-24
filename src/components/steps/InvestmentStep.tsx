"use client";

import { SimulationInputs } from "@/lib/types";

interface Props {
  inputs: SimulationInputs;
  onChange: (partial: Partial<SimulationInputs>) => void;
}

export default function InvestmentStep({ inputs, onChange }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">
          Investimento e horizonte
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Defina o retorno esperado, o horizonte de investimento e a tributacao
          sobre ganhos do investimento comparativo.
        </p>
      </div>

      {/* Expected return */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          Retorno anual esperado
        </label>
        <input
          type="range"
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
          ampliam a vantagem do PGBL.
        </p>
      </div>

      {/* Horizon */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          Horizonte de investimento (anos)
        </label>
        <input
          type="range"
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

      {/* Capital gains tax on non-PGBL */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          Imposto sobre ganhos do investimento comparativo
        </label>
        <div className="flex gap-2">
          {[
            { value: 0, label: "0% (isento)" },
            { value: 0.15, label: "15% (tipico)" },
            { value: 0.225, label: "22.5% (curto prazo)" },
          ].map((opt) => (
            <button
              key={opt.value}
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
          A aliquota tipica de IR sobre ganhos de capital em renda fixa/variavel
          e 15%. Investimentos isentos (LCI/LCA/poupanca) usam 0%.
        </p>
      </div>

      {/* Refund delay */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          Prazo de recebimento do reembolso do IR
        </label>
        <div className="flex gap-2">
          {[
            { value: 0.5, label: "6 meses (mai/jun)" },
            { value: 0.75, label: "9 meses (set)" },
            { value: 1.0, label: "12 meses (tarde)" },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => onChange({ refundDelayYears: opt.value })}
              className={`flex-1 rounded-lg border-2 p-2.5 text-center text-xs transition-all sm:text-sm ${
                inputs.refundDelayYears === opt.value
                  ? "border-primary-500 bg-primary-50 font-medium"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <p className="mt-1 text-xs text-gray-400">
          O reembolso do IR normalmente chega meses depois da contribuicao.
          Aqui estimamos quando esse dinheiro comeca a render.
        </p>
      </div>
    </div>
  );
}
