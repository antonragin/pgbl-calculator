"use client";

import { useEffect } from "react";
import { SavedScenario } from "@/lib/types";
import { formatBRL, formatPct, formatBps } from "@/lib/engine";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  scenarios: SavedScenario[];
  onDelete: (id: string) => void;
}

export default function CompareDrawer({
  isOpen,
  onClose,
  scenarios,
  onDelete,
}: Props) {
  // Close on Escape key + lock body scroll
  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      <div role="dialog" aria-modal="true" aria-label="Comparar cenarios" className="relative max-h-[85vh] w-full max-w-3xl overflow-auto rounded-t-2xl bg-white p-6 shadow-2xl sm:rounded-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Comparar cenarios ({scenarios.length}/3)
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {scenarios.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400">
            Nenhum cenario salvo. Use &ldquo;Salvar cenario&rdquo; na tela de
            resultados para adicionar cenarios aqui.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs font-medium uppercase text-gray-400">
                  <th className="pb-2 pr-4">Metrica</th>
                  {scenarios.map((s) => (
                    <th key={s.id} className="pb-2 pr-4">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-700">{s.name}</span>
                        <button
                          onClick={() => onDelete(s.id)}
                          className="text-gray-300 hover:text-red-500"
                          title="Remover"
                        >
                          &times;
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(() => {
                  const ids = scenarios.map((s) => s.id);
                  return (<>
                <CompareRow
                  label="Renda anual"
                  scenarioIds={ids}
                  values={scenarios.map((s) => formatBRL(s.result.inputs.annualIncome))}
                />
                <CompareRow
                  label="Contribuicao"
                  scenarioIds={ids}
                  values={scenarios.map(
                    (s) =>
                      `${formatPct(s.result.inputs.contributionPct, 0)} (${formatBRL(s.result.derived.contributionAmount)})`
                  )}
                />
                <CompareRow
                  label="Retorno esperado"
                  scenarioIds={ids}
                  values={scenarios.map((s) => formatPct(s.result.inputs.expectedReturn))}
                />
                <CompareRow
                  label="Horizonte"
                  scenarioIds={ids}
                  values={scenarios.map((s) => `${s.result.inputs.horizonYears} anos`)}
                />
                <CompareRow
                  label="Regime"
                  scenarioIds={ids}
                  values={scenarios.map((s) =>
                    s.result.inputs.regime === "regressive"
                      ? "Regressivo"
                      : s.result.inputs.regime === "progressive"
                      ? "Progressivo"
                      : "Otimista"
                  )}
                />
                <CompareRow
                  label="Aliquota entrada (Xin)"
                  scenarioIds={ids}
                  values={scenarios.map((s) => formatPct(s.result.derived.xin))}
                />
                <CompareRow
                  label="Aliquota saida (Xout)"
                  scenarioIds={ids}
                  values={scenarios.map((s) => formatPct(s.result.derived.xout))}
                />
                <CompareRow
                  label="Reembolso"
                  scenarioIds={ids}
                  values={scenarios.map((s) => formatBRL(s.result.derived.refundAmount))}
                  highlight
                />
                <CompareRow
                  label="Patrimonio sem PGBL"
                  scenarioIds={ids}
                  values={scenarios.map((s) =>
                    formatBRL(s.result.terminalA * s.result.derived.contributionAmount)
                  )}
                />
                <CompareRow
                  label="Patrimonio com PGBL"
                  scenarioIds={ids}
                  values={scenarios.map((s) =>
                    formatBRL(s.result.terminalB * s.result.derived.contributionAmount)
                  )}
                  highlight
                />
                <CompareRow
                  label="Vantagem"
                  scenarioIds={ids}
                  values={scenarios.map((s) =>
                    formatBRL(
                      (s.result.terminalB - s.result.terminalA) *
                        s.result.derived.contributionAmount
                    )
                  )}
                  highlight
                />
                <CompareRow
                  label="Delta anualizado"
                  scenarioIds={ids}
                  values={scenarios.map((s) => formatBps(s.result.annualizedDelta))}
                  highlight
                />
                <CompareRow
                  label="Break-even"
                  scenarioIds={ids}
                  values={scenarios.map((s) =>
                    s.result.breakEvenYear !== null
                      ? `Ano ${s.result.breakEvenYear}`
                      : "N/A"
                  )}
                />
                  </>);
                })()}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function CompareRow({
  label,
  values,
  scenarioIds,
  highlight,
}: {
  label: string;
  values: string[];
  scenarioIds: string[];
  highlight?: boolean;
}) {
  return (
    <tr>
      <td className="py-2 pr-4 text-gray-500">{label}</td>
      {values.map((v, i) => (
        <td
          key={scenarioIds[i]}
          className={`py-2 pr-4 ${
            highlight ? "font-semibold text-primary-700" : "text-gray-700"
          }`}
        >
          {v}
        </td>
      ))}
    </tr>
  );
}
