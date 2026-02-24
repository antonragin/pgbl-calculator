"use client";

import { SimulationInputs, FilingMode } from "@/lib/types";
import { formatBRL } from "@/lib/engine";
import { estimateMarginalRate } from "@/lib/taxRules";

interface Props {
  inputs: SimulationInputs;
  onChange: (partial: Partial<SimulationInputs>) => void;
}

export default function IncomeStep({ inputs, onChange }: Props) {
  const marginalRate = estimateMarginalRate(inputs.annualIncome);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Sua renda</h2>
        <p className="mt-1 text-sm text-gray-500">
          Informe sua renda anual bruta tributavel. Usamos para estimar sua
          aliquota marginal do IR.
        </p>
      </div>

      {/* Annual income */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          Renda anual bruta tributavel
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
            R$
          </span>
          <input
            type="number"
            value={inputs.annualIncome}
            onChange={(e) =>
              onChange({ annualIncome: Math.max(0, Number(e.target.value)) })
            }
            className="input-field pl-10"
            step={1000}
            min={0}
          />
        </div>
        <div className="mt-2 flex gap-2">
          {[60000, 120000, 240000, 500000].map((v) => (
            <button
              key={v}
              onClick={() => onChange({ annualIncome: v })}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                inputs.annualIncome === v
                  ? "bg-primary-100 text-primary-700"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {formatBRL(v)}
            </button>
          ))}
        </div>
        {inputs.annualIncome === 0 && (
          <p className="mt-2 rounded-md bg-red-50 p-2 text-xs text-red-700">
            Informe uma renda maior que zero para que a simulacao produza
            resultados significativos.
          </p>
        )}
      </div>

      {/* Filing mode */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          Modelo de declaracao do IR
        </label>
        <div className="flex gap-3">
          {(["complete", "simplified"] as FilingMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => onChange({ filingMode: mode })}
              className={`flex-1 rounded-lg border-2 p-3 text-left text-sm transition-all ${
                inputs.filingMode === mode
                  ? "border-primary-500 bg-primary-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <span className="font-medium">
                {mode === "complete" ? "Completa" : "Simplificada"}
              </span>
              <p className="mt-0.5 text-xs text-gray-500">
                {mode === "complete"
                  ? "Permite deduzir PGBL"
                  : "Desconto padrao de 20%"}
              </p>
            </button>
          ))}
        </div>
        {inputs.filingMode === "simplified" && (
          <p className="mt-2 rounded-md bg-amber-50 p-2 text-xs text-amber-700">
            A deducao do PGBL so e possivel na declaracao completa. Na
            simplificada, o beneficio fiscal do PGBL nao se aplica.
          </p>
        )}
      </div>

      {/* INSS contribution */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          Contribui para INSS/previdencia oficial?
        </label>
        <div className="flex gap-3">
          {[true, false].map((v) => (
            <button
              key={String(v)}
              onClick={() => onChange({ contributesToINSS: v })}
              className={`flex-1 rounded-lg border-2 p-3 text-center text-sm font-medium transition-all ${
                inputs.contributesToINSS === v
                  ? "border-primary-500 bg-primary-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              {v ? "Sim" : "Nao"}
            </button>
          ))}
        </div>
        {!inputs.contributesToINSS && (
          <p className="mt-2 rounded-md bg-amber-50 p-2 text-xs text-amber-700">
            A dedutibilidade do PGBL exige contribuicao para o INSS ou regime
            oficial de previdencia. Verifique sua elegibilidade.
          </p>
        )}
      </div>

      {/* Marginal rate indicator */}
      <div className="rounded-lg bg-gray-50 p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">
            Aliquota marginal estimada
          </span>
          <span className="text-lg font-bold text-primary-700">
            {(marginalRate * 100).toFixed(1)}%
          </span>
        </div>
        <p className="mt-1 text-xs text-gray-400">
          Esta e a taxa aplicada a ultima faixa da sua renda. Cada R$1 deduzido
          do PGBL gera um reembolso de R${(marginalRate).toFixed(2)}.
        </p>
      </div>
    </div>
  );
}
