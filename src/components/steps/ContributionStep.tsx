"use client";

import { SimulationInputs, Wrapper } from "@/lib/types";
import { formatBRL } from "@/lib/engine";
import { PGBL_DEDUCTIBLE_CAP, IOF_VGBL_THRESHOLD, IOF_VGBL_RATE } from "@/lib/taxRules";

interface Props {
  inputs: SimulationInputs;
  onChange: (partial: Partial<SimulationInputs>) => void;
}

export default function ContributionStep({ inputs, onChange }: Props) {
  const maxDeductible = inputs.annualIncome * PGBL_DEDUCTIBLE_CAP;
  const contribution = inputs.annualIncome * inputs.contributionPct;
  const isPGBL = inputs.wrapper === "PGBL";
  const isOverCap = isPGBL && inputs.contributionPct > PGBL_DEDUCTIBLE_CAP;
  const pgblEligible = inputs.filingMode === "complete" && inputs.contributesToINSS;
  const pgblIneligible = isPGBL && !pgblEligible;
  const iofApplies = !isPGBL && contribution > IOF_VGBL_THRESHOLD;

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
        <div className="flex gap-3" role="radiogroup" aria-label="Tipo de plano">
          {(["PGBL", "VGBL"] as Wrapper[]).map((w) => (
            <button
              type="button"
              key={w}
              role="radio"
              aria-checked={inputs.wrapper === w}
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
        {inputs.wrapper === "VGBL" && pgblEligible && (
          <p className="mt-2 rounded-md bg-amber-50 p-2 text-xs text-amber-700">
            PGBL oferece maior vantagem fiscal que VGBL para seu perfil. Use VGBL apenas quando PGBL nao esta disponivel ou ja atingiu o limite de 12%.
          </p>
        )}
        {inputs.wrapper === "VGBL" && !pgblEligible && (
          <p className="mt-2 rounded-md bg-blue-50 p-2 text-xs text-blue-700">
            No VGBL, nao ha deducao do IR (beneficio fiscal = 0). O imposto no
            resgate incide apenas sobre os rendimentos, nao sobre o valor total.
          </p>
        )}
        {pgblIneligible && (
          <p className="mt-2 rounded-md bg-red-50 p-2 text-xs text-red-700">
            PGBL nao oferece beneficio fiscal com declaracao simplificada ou sem contribuicao ao INSS. Escolha VGBL ou ajuste seu perfil na etapa anterior.
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
                type="button"
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
          <div className="mt-2 rounded-md bg-red-50 p-2.5 text-xs text-red-700 space-y-1">
            <p className="font-semibold">
              O limite dedutivel do PGBL e 12% da renda tributavel ({formatBRL(maxDeductible)}/ano).
            </p>
            <p>
              Reduza a contribuicao para 12% ou escolha VGBL para simular. Dica: voce pode ter dois certificados — PGBL ate 12% e VGBL para o excedente.
            </p>
          </div>
        )}
        {iofApplies && (
          <p className="mt-2 rounded-md bg-amber-50 p-2 text-xs text-amber-700">
            Contribuicoes VGBL acima de {formatBRL(IOF_VGBL_THRESHOLD)}/ano estao sujeitas a IOF de {(IOF_VGBL_RATE * 100).toFixed(0)}% sobre o excedente (Decreto 12.499/2025). IOF estimado: {formatBRL((contribution - IOF_VGBL_THRESHOLD) * IOF_VGBL_RATE)}.
          </p>
        )}
      </div>

      {/* Regime — always "Best of Progressive and Regressive" */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          Regime de tributacao no resgate
        </label>
        <div className="rounded-lg border-2 border-primary-500 bg-primary-50 p-3">
          <span className="text-sm font-semibold text-primary-700">
            Melhor entre Progressivo e Regressivo
          </span>
          <p className="mt-1 text-xs text-gray-600">
            Para cada ano, a simulacao usa a menor aliquota entre o regime
            progressivo e o regressivo. Desde a Lei 14.803/2024, o investidor
            pode escolher o regime antes do primeiro resgate e pode ter multiplos
            certificados — efetivamente estruturando a opcionalidade tributaria
            no momento do resgate.
          </p>
        </div>
      </div>
    </div>
  );
}
