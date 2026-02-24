"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Area,
  AreaChart,
  Legend,
} from "recharts";
import { YearlyDataPoint } from "@/lib/types";

// Extracted outside component to avoid re-creation on every render
function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ dataKey: string; value: number }>; label?: number }) {
  if (!active || !payload?.length) return null;
  const a = payload.find((p) => p.dataKey === "wealthA");
  const b = payload.find((p) => p.dataKey === "wealthB");
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
      <p className="mb-1 text-xs font-semibold text-gray-500">
        Ano {label}
      </p>
      {a && (
        <p className="text-sm text-gray-600">
          <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-gray-400" />
          Sem PGBL: {Number(a.value).toFixed(1)}% do investido
        </p>
      )}
      {b && (
        <p className="text-sm text-primary-700">
          <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-primary-500" />
          Com PGBL: {Number(b.value).toFixed(1)}% do investido
        </p>
      )}
      {a && b && (
        <p className="mt-1 text-xs font-medium text-accent-600">
          Diferenca: {(Number(b.value) - Number(a.value)).toFixed(1)} p.p.
        </p>
      )}
    </div>
  );
}

interface Props {
  timeseries: YearlyDataPoint[];
  breakEvenYear: number | null;
  refundDelayYears: number;
  contributionAmount: number;
}

export default function WealthChart({
  timeseries,
  breakEvenYear,
  refundDelayYears,
  contributionAmount,
}: Props) {
  const [animationProgress, setAnimationProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const playTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const maxYear = timeseries.length - 1;

  // Clean up play timer on unmount
  useEffect(() => {
    return () => { if (playTimerRef.current) clearTimeout(playTimerRef.current); };
  }, []);

  // Auto-play animation on first render / data change
  useEffect(() => {
    setAnimationProgress(0);

    const timer = setTimeout(() => {
      setIsPlaying(true);
    }, 300);
    return () => clearTimeout(timer);
  }, [timeseries]);

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setAnimationProgress((prev) => {
        const next = prev + 1;
        if (next >= maxYear) {
          setIsPlaying(false);

          return maxYear;
        }
        return next;
      });
    }, 80);

    return () => clearInterval(interval);
  }, [isPlaying, maxYear]);

  const formattedData = useMemo(() =>
    timeseries.map((d) => ({
      ...d,
      wealthA: Number((d.wealthA * 100).toFixed(2)),
      wealthB: Number((d.wealthB * 100).toFixed(2)),
    })),
    [timeseries]
  );

  const visibleData = useMemo(() =>
    formattedData.slice(0, animationProgress + 1),
    [formattedData, animationProgress]
  );

  function handlePlay() {
    setAnimationProgress(0);
    if (playTimerRef.current) clearTimeout(playTimerRef.current);
    playTimerRef.current = setTimeout(() => setIsPlaying(true), 100);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">
          Patrimonio ao longo do tempo (por R$1 investido)
        </h3>
        <button
          type="button"
          onClick={handlePlay}
          className="flex items-center gap-1.5 rounded-md bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-200"
        >
          <svg aria-hidden="true" className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M6.3 2.841A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
          </svg>
          Replay
        </button>
      </div>

      <div className="h-[300px] sm:h-[380px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={visibleData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gradA" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#9ca3af" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#9ca3af" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradB" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="year"
              tick={{ fontSize: 12, fill: "#9ca3af" }}
              axisLine={{ stroke: "#e5e7eb" }}
              label={{ value: "Anos", position: "insideBottomRight", offset: -5, fontSize: 11, fill: "#9ca3af" }}
            />
            <YAxis
              tick={{ fontSize: 12, fill: "#9ca3af" }}
              axisLine={{ stroke: "#e5e7eb" }}
              tickFormatter={(v) => `${v}%`}
              label={{ value: "% do investido", angle: -90, position: "insideLeft", offset: 10, fontSize: 11, fill: "#9ca3af" }}
            />
            <Tooltip content={<ChartTooltip />} />
            <Legend
              verticalAlign="top"
              height={30}
              formatter={(value: string) =>
                value === "wealthA" ? "Sem PGBL" : "Com PGBL"
              }
            />

            {/* Break-even marker */}
            {breakEvenYear !== null && (
              <ReferenceLine
                x={breakEvenYear}
                stroke="#22c55e"
                strokeDasharray="5 5"
                strokeWidth={2}
                label={{
                  value: `Break-even: Ano ${breakEvenYear}`,
                  position: "top",
                  fontSize: 11,
                  fill: "#16a34a",
                }}
              />
            )}

            {/* Refund arrival marker */}
            {refundDelayYears <= maxYear && (
              <ReferenceLine
                x={Math.ceil(refundDelayYears)}
                stroke="#f59e0b"
                strokeDasharray="3 3"
                strokeWidth={1.5}
                label={{
                  value: "Reembolso",
                  position: "insideTopRight",
                  fontSize: 10,
                  fill: "#d97706",
                }}
              />
            )}

            <Area
              type="monotone"
              dataKey="wealthA"
              stroke="#9ca3af"
              strokeWidth={2}
              fill="url(#gradA)"
              dot={false}
              animationDuration={300}
              name="wealthA"
            />
            <Area
              type="monotone"
              dataKey="wealthB"
              stroke="#0ea5e9"
              strokeWidth={2.5}
              fill="url(#gradB)"
              dot={false}
              animationDuration={300}
              name="wealthB"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Animation progress bar */}
      <div className="flex items-center gap-3">
        <input
          type="range"
          aria-label="Ano da simulacao"
          min={0}
          max={maxYear}
          step={1}
          value={animationProgress}
          onChange={(e) => {
            setIsPlaying(false);
  
            setAnimationProgress(Number(e.target.value));
          }}
          className="w-full"
        />
        <span className="min-w-[3rem] text-right text-xs text-gray-400">
          Ano {animationProgress}
        </span>
      </div>
    </div>
  );
}
