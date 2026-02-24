"use client";

import { SimulationInputs } from "@/lib/types";
import { deriveValues, formatBRL, formatPct } from "@/lib/engine";
import { RULES_VERSION, TAX_YEAR } from "@/lib/taxRules";

interface Props {
  inputs: SimulationInputs;
  onChange: (partial: Partial<SimulationInputs>) => void;
}

export default function AdvancedStep({ inputs, onChange }: Props) {
  const derived = deriveValues(inputs);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">
          Taxas e premissas avancadas
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Opcional: ajuste taxas de administracao e performance. Veja tambem um
          resumo das premissas antes de simular.
        </p>
      </div>

      {/* Fees toggle */}
      <div>
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">
            Modelar taxas do fundo
          </label>
          <button
            type="button"
            role="switch"
            aria-checked={inputs.feesEnabled}
            aria-label="Modelar taxas do fundo"
            onClick={() => onChange({ feesEnabled: !inputs.feesEnabled })}
            className={`relative h-6 w-11 rounded-full transition-colors ${
              inputs.feesEnabled ? "bg-primary-600" : "bg-gray-300"
            }`}
          >
            <span
              className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                inputs.feesEnabled ? "translate-x-5" : ""
              }`}
            />
          </button>
        </div>

        {inputs.feesEnabled && (
          <div className="mt-4 space-y-4 rounded-lg border border-gray-200 p-4">
            <div>
              <label className="mb-1 block text-sm text-gray-600">
                Taxa adicional do fundo previdenciario (% a.a.)
              </label>
              <p className="mb-2 text-xs text-gray-400">
                Diferenca entre a taxa do fundo previdenciario e a alternativa sem wrapper (ex: ETF de baixo custo).
              </p>
              <input
                type="range"
                aria-label="Taxa adicional do fundo previdenciario"
                min={0}
                max={0.03}
                step={0.001}
                value={inputs.adminFeePct}
                onChange={(e) =>
                  onChange({ adminFeePct: Number(e.target.value) })
                }
                className="w-full"
              />
              <div className="mt-0.5 text-right text-sm font-medium text-gray-700">
                {(inputs.adminFeePct * 100).toFixed(1)}%
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm text-gray-600 opacity-50">
                Taxa de performance (% sobre rendimento)
              </label>
              <input
                type="range"
                aria-label="Taxa de performance"
                min={0}
                max={0.25}
                step={0.01}
                value={0}
                disabled
                className="w-full opacity-40"
              />
              <div className="mt-0.5 text-right text-sm font-medium text-gray-400">
                0%
              </div>
              <p className="mt-1 text-xs text-gray-400">
                Recomendamos investir em fundos sem taxa de performance para maximizar o retorno na aposentadoria.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Summary of assumptions */}
      <div className="rounded-lg bg-gray-50 p-4">
        <h3 className="mb-3 text-sm font-semibold text-gray-700">
          Resumo das premissas
        </h3>
        <div className="space-y-2 text-sm">
          <Row label="Renda anual" value={formatBRL(inputs.annualIncome)} />
          <Row label="Declaracao" value={inputs.filingMode === "complete" ? "Completa" : "Simplificada"} />
          <Row label="Plano" value={inputs.wrapper} />
          <Row label="Contribuicao" value={`${formatPct(inputs.contributionPct, 0)} = ${formatBRL(derived.contributionAmount)}/ano`} />
          <Row label="Regime resgate" value="Melhor entre Prog. e Reg." />
          <Row label="Aliquota entrada (Xin)" value={formatPct(derived.xin)} />
          <Row label="Aliquota saida (Xout)" value={formatPct(derived.xout)} />
          <Row label="Retorno esperado" value={formatPct(inputs.expectedReturn)} />
          <Row label="Horizonte" value={`${inputs.horizonYears} anos`} />
          <Row label="IR ganhos comparativo" value={formatPct(inputs.capitalGainsTax)} />
          <Row label="Prazo reembolso" value={`${inputs.refundDelayYears} anos`} />
          {inputs.feesEnabled && (
            <>
              <Row label="Taxa admin" value={formatPct(inputs.adminFeePct)} />
              <Row label="Taxa performance" value={formatPct(inputs.performanceFeePct, 0)} />
            </>
          )}
          <div className="mt-2 border-t border-gray-200 pt-2">
            <Row label="Reembolso estimado" value={formatBRL(derived.refundAmount)} highlight />
            <Row label="Valor dedutivel" value={formatBRL(derived.deductibleAmount)} highlight />
          </div>
          <p className="mt-2 text-xs text-gray-400">
            Regras: ano-base {TAX_YEAR}, versao {RULES_VERSION}
          </p>
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-500">{label}</span>
      <span className={highlight ? "font-semibold text-primary-700" : "text-gray-700"}>
        {value}
      </span>
    </div>
  );
}
