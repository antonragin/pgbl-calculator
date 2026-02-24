"use client";

import { SimulationInputs, Wrapper, RedemptionRegime } from "@/lib/types";
import { formatBRL } from "@/lib/engine";
import { PGBL_DEDUCTIBLE_CAP } from "@/lib/taxRules";

interface Props {
  inputs: SimulationInputs;
  onChange: (partial: Partial<SimulationInputs>) => void;
}

export default function ContributionStep({ inputs, onChange }: Props) {
  const maxDeductible = inputs.annualIncome * PGBL_DEDUCTIBLE_CAP;
  const contribution = inputs.annualIncome * inputs.contributionPct;
  const isOverCap = contribution > maxDeductible;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Contribuicao</h2>
        <p className="mt-1 text-sm text-gray-500">
          Defina o tipo de plano, quanto contribuir e o regime de tributacao no
          resgate.
        </p>
      </div>

      {/* Wrapper */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          Tipo de plano
        </label>
        <div className="flex gap-3">
          {(["PGBL", "VGBL"] as Wrapper[]).map((w) => (
            <button
              key={w}
              onClick={() => onChange({ wrapper: w })}
              className={`flex-1 rounded-lg border-2 p-3 text-center transition-all ${
                inputs.wrapper === w
                  ? "border-primary-500 bg-primary-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <span className="text-sm font-semibold">{w}</span>
              <p className="mt-0.5 text-xs text-gray-500">
                {w === "PGBL"
                  ? "Deducao no IR, tributado no resgate"
                  : "Sem deducao, tributado so nos rendimentos"}
              </p>
            </button>
          ))}
        </div>
        {inputs.wrapper === "VGBL" && (
          <p className="mt-2 rounded-md bg-blue-50 p-2 text-xs text-blue-700">
            O VGBL e tributado apenas sobre os rendimentos. A modelagem
            completa do VGBL esta prevista para v2. Por ora, o simulador foca
            no PGBL.
          </p>
        )}
      </div>

      {/* Contribution % */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          Percentual da renda para contribuicao
        </label>
        <input
          type="range"
          aria-label="Percentual da renda para contribuicao"
          min={0.01}
          max={0.20}
          step={0.01}
          value={inputs.contributionPct}
          onChange={(e) => onChange({ contributionPct: Number(e.target.value) })}
          className="w-full"
        />
        <div className="mt-2 flex items-center justify-between">
          <div className="flex gap-2">
            {[0.03, 0.06, 0.12].map((p) => (
              <button
                key={p}
                onClick={() => onChange({ contributionPct: p })}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                  inputs.contributionPct === p
                    ? "bg-primary-100 text-primary-700"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {(p * 100).toFixed(0)}%
              </button>
            ))}
          </div>
          <span className="text-sm font-semibold text-gray-700">
            {(inputs.contributionPct * 100).toFixed(0)}% ={" "}
            {formatBRL(contribution)}/ano
          </span>
        </div>
        {isOverCap && (
          <p className="mt-2 rounded-md bg-amber-50 p-2 text-xs text-amber-700">
            O limite dedutivel do PGBL e 12% da renda tributavel (
            {formatBRL(maxDeductible)}). O excedente nao gera beneficio fiscal.
          </p>
        )}
      </div>

      {/* Regime */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          Regime de tributacao no resgate
        </label>
        <div className="space-y-2">
          {(
            [
              {
                value: "regressive" as RedemptionRegime,
                label: "Regressivo",
                desc: "Aliquota diminui com o tempo (35% a 10%)",
              },
              {
                value: "progressive" as RedemptionRegime,
                label: "Progressivo",
                desc: "Tabela do IR (0% a 27.5%)",
              },
              {
                value: "optimistic" as RedemptionRegime,
                label: "Otimista (minimo)",
                desc: "Assume a menor aliquota possivel (10%)",
              },
            ]
          ).map((opt) => (
            <button
              key={opt.value}
              onClick={() => onChange({ regime: opt.value })}
              className={`w-full rounded-lg border-2 p-3 text-left text-sm transition-all ${
                inputs.regime === opt.value
                  ? "border-primary-500 bg-primary-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <span className="font-medium">{opt.label}</span>
              <p className="text-xs text-gray-500">{opt.desc}</p>
            </button>
          ))}
        </div>
        <p className="mt-2 rounded-md bg-blue-50 p-2 text-xs text-blue-700">
          Desde a Lei 14.803/2024, a escolha do regime pode ser feita ate o
          momento do primeiro resgate, e nao mais na adesao ao plano.
        </p>
      </div>
    </div>
  );
}
