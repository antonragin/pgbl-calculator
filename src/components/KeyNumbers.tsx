"use client";

import { SimulationResult } from "@/lib/types";
import { formatBRL, formatPct, formatBps } from "@/lib/engine";

interface Props {
  result: SimulationResult;
}

export default function KeyNumbers({ result }: Props) {
  const { derived, terminalA, terminalB, annualizedDelta, breakEvenYear, inputs } = result;
  const investment = derived.contributionAmount;
  const terminalValueA = terminalA * investment;
  const terminalValueB = terminalB * investment;
  const advantage = terminalValueB - terminalValueA;

  const wrapper = inputs.wrapper;

  const cards = [
    {
      label: "Reembolso estimado",
      value: formatBRL(derived.refundAmount),
      sub: `${formatPct(derived.xin)} sobre ${formatBRL(derived.deductibleAmount)}`,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      label: `Patrimonio sem ${wrapper}`,
      value: formatBRL(terminalValueA),
      sub: `Retorno acumulado em ${inputs.horizonYears}a: ${formatPct(terminalA - 1)}`,
      color: "text-gray-600",
      bg: "bg-gray-50",
    },
    {
      label: `Patrimonio com ${wrapper}`,
      value: formatBRL(terminalValueB),
      sub: `Retorno acumulado em ${inputs.horizonYears}a: ${formatPct(terminalB - 1)}`,
      color: "text-primary-600",
      bg: "bg-primary-50",
    },
    {
      label: `Vantagem do ${wrapper}`,
      value: advantage >= 0 ? `+${formatBRL(advantage)}` : formatBRL(advantage),
      sub: `${formatBps(annualizedDelta)} por ano`,
      color: advantage >= 0 ? "text-accent-600" : "text-red-600",
      bg: advantage >= 0 ? "bg-accent-50" : "bg-red-50",
    },
    {
      label: "Ano de break-even",
      value: breakEvenYear !== null ? `Ano ${breakEvenYear}` : "N/A",
      sub: breakEvenYear !== null
        ? `${wrapper} supera a partir do ano ${breakEvenYear}`
        : `${wrapper} nao supera neste horizonte`,
      color: breakEvenYear !== null ? "text-accent-600" : "text-gray-500",
      bg: breakEvenYear !== null ? "bg-accent-50" : "bg-gray-50",
    },
    {
      label: "Retorno extra equivalente",
      value: `${(annualizedDelta / 100).toFixed(2)}% a.a.`,
      sub: `Em ${inputs.horizonYears} anos com retorno de ${formatPct(inputs.expectedReturn)} a.a.`,
      color: annualizedDelta >= 0 ? "text-primary-600" : "text-red-600",
      bg: "bg-primary-50",
    },
  ];

  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-gray-700">
        Numeros-chave
      </h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {cards.map((card) => (
          <div
            key={card.label}
            className={`rounded-lg ${card.bg} p-3 transition-all`}
          >
            <p className="text-xs text-gray-500">{card.label}</p>
            <p className={`mt-1 text-lg font-bold ${card.color}`}>
              {card.value}
            </p>
            <p className="mt-0.5 text-xs text-gray-400">{card.sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
