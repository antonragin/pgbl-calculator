"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { SimulationInputs, SimulationResult, SavedScenario, ViewMode } from "@/lib/types";
import { runSimulation } from "@/lib/engine";
import { DEFAULT_INPUTS, PRESETS } from "@/lib/defaults";
import Stepper from "@/components/Stepper";
import IncomeStep from "@/components/steps/IncomeStep";
import ContributionStep from "@/components/steps/ContributionStep";
import InvestmentStep from "@/components/steps/InvestmentStep";
import AdvancedStep from "@/components/steps/AdvancedStep";
import ResultsDashboard from "@/components/ResultsDashboard";
import ChatPanel from "@/components/ChatPanel";
import CompareDrawer from "@/components/CompareDrawer";

const STEPS = [
  { label: "Renda", icon: <span>&#128176;</span> },
  { label: "Plano", icon: <span>&#128196;</span> },
  { label: "Investimento", icon: <span>&#128200;</span> },
  { label: "Avancado", icon: <span>&#9881;</span> },
];

type AppView = "inputs" | "results";

export default function HomePage() {
  const [inputs, setInputs] = useState<SimulationInputs>(DEFAULT_INPUTS);
  const [currentStep, setCurrentStep] = useState(0);
  const [appView, setAppView] = useState<AppView>("inputs");
  const [viewMode, setViewMode] = useState<ViewMode>("beginner");
  const [chatOpen, setChatOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const [savedScenarios, setSavedScenarios] = useState<SavedScenario[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem("pgbl_scenarios");
      if (!stored) return [];
      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) return [];
      // Validate each scenario has required shape
      return parsed.filter(
        (s: unknown): s is SavedScenario =>
          typeof s === "object" && s !== null &&
          "id" in s && "name" in s && "result" in s &&
          typeof (s as SavedScenario).result?.derived?.contributionAmount === "number"
      );
    } catch { return []; }
  });
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Persist scenarios to localStorage
  useEffect(() => {
    try { localStorage.setItem("pgbl_scenarios", JSON.stringify(savedScenarios)); }
    catch { /* storage full or unavailable */ }
  }, [savedScenarios]);

  // Clean up toast timer on unmount
  useEffect(() => {
    return () => { if (toastTimer.current) clearTimeout(toastTimer.current); };
  }, []);

  const handleInputChange = useCallback(
    (partial: Partial<SimulationInputs>) => {
      setInputs((prev) => ({ ...prev, ...partial }));
    },
    []
  );

  const result: SimulationResult = useMemo(
    () => runSimulation(inputs),
    [inputs]
  );

  function handleSimulate() {
    setAppView("results");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleBack() {
    setAppView("inputs");
  }

  function showToast(msg: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToastMsg(msg);
    toastTimer.current = setTimeout(() => setToastMsg(null), 3000);
  }

  function handleSaveScenario() {
    if (savedScenarios.length >= 3) {
      showToast("Maximo de 3 cenarios. Remova um antes de salvar outro.");
      setCompareOpen(true);
      return;
    }
    const name = `Cenario ${savedScenarios.length + 1}`;
    const scenario: SavedScenario = {
      id: crypto.randomUUID(),
      name,
      createdAt: new Date().toISOString(),
      result,
    };
    setSavedScenarios((prev) => [...prev, scenario]);
    setCompareOpen(true);
    showToast("Cenario salvo!");
  }

  function handleDeleteScenario(id: string) {
    setSavedScenarios((prev) => prev.filter((s) => s.id !== id));
  }

  function handlePreset(key: keyof typeof PRESETS) {
    setInputs(PRESETS[key].inputs);
  }

  const isBeginnerMode = viewMode === "beginner";
  const totalSteps = isBeginnerMode ? 3 : 4;
  const visibleSteps = isBeginnerMode ? STEPS.slice(0, 3) : STEPS;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="border-b border-gray-100 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-sm font-bold text-white">
              P
            </div>
            <span className="text-sm font-semibold text-gray-800">
              Calculadora PGBL
            </span>
          </div>
          <div className="flex items-center gap-3">
            {savedScenarios.length > 0 && (
              <button
                onClick={() => setCompareOpen(true)}
                className="btn-secondary px-3 py-1.5 text-xs"
              >
                Comparar ({savedScenarios.length})
              </button>
            )}
            <button
              onClick={() => {
                setViewMode((v) => {
                  const next = v === "beginner" ? "advanced" : "beginner";
                  // Clamp step when switching to beginner (max step index = 2)
                  if (next === "beginner") {
                    setCurrentStep((s) => Math.min(s, 2));
                  }
                  return next;
                });
              }}
              className="rounded-md bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-200"
            >
              {isBeginnerMode ? "Modo avancado" : "Modo simples"}
            </button>
            <button
              onClick={async () => {
                await fetch("/api/auth", { method: "DELETE" });
                window.location.href = "/login";
              }}
              className="rounded-md bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
              title="Sair"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6">
        {appView === "inputs" ? (
          <div className="space-y-6">
            {/* Hero */}
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                Descubra quanto o PGBL pode aumentar seu investimento
              </h1>
              <p className="mt-2 text-sm text-gray-500">
                Simule em 30 segundos e entenda o impacto do reembolso e da
                tributacao no resgate.
              </p>
            </div>

            {/* Presets */}
            <div className="flex flex-wrap justify-center gap-3">
              {(Object.entries(PRESETS) as [keyof typeof PRESETS, typeof PRESETS[keyof typeof PRESETS]][]).map(
                ([key, preset]) => (
                  <button
                    key={key}
                    onClick={() => handlePreset(key)}
                    className="rounded-lg border border-gray-200 px-4 py-2 text-center transition-all hover:border-primary-300 hover:bg-primary-50"
                  >
                    <span className="block text-sm font-medium text-gray-700">
                      {preset.label}
                    </span>
                    <span className="block text-xs text-gray-400">
                      {preset.description}
                    </span>
                  </button>
                )
              )}
            </div>

            {/* Stepper */}
            <Stepper
              steps={visibleSteps}
              currentStep={currentStep}
              onStepClick={setCurrentStep}
            />

            {/* Step content */}
            <div className="card mx-auto max-w-xl">
              {currentStep === 0 && (
                <IncomeStep inputs={inputs} onChange={handleInputChange} />
              )}
              {currentStep === 1 && (
                <ContributionStep inputs={inputs} onChange={handleInputChange} />
              )}
              {currentStep === 2 && (
                <InvestmentStep inputs={inputs} onChange={handleInputChange} />
              )}
              {currentStep === 3 && !isBeginnerMode && (
                <AdvancedStep inputs={inputs} onChange={handleInputChange} />
              )}

              {/* Navigation */}
              <div className="mt-6 flex items-center justify-between">
                <button
                  onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
                  disabled={currentStep === 0}
                  className="btn-secondary px-4 py-2 text-sm disabled:invisible"
                >
                  Voltar
                </button>

                {currentStep < totalSteps - 1 ? (
                  <button
                    onClick={() =>
                      setCurrentStep((s) => Math.min(totalSteps - 1, s + 1))
                    }
                    className="btn-primary px-6 py-2 text-sm"
                  >
                    Proximo
                  </button>
                ) : (
                  <button
                    onClick={handleSimulate}
                    className="btn-primary px-8 py-2.5 text-sm"
                  >
                    Simular agora
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Back to inputs */}
            <button
              onClick={handleBack}
              className="flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-700"
            >
              <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
              Ajustar premissas
            </button>

            <ResultsDashboard
              result={result}
              onSaveScenario={handleSaveScenario}
              onOpenChat={() => setChatOpen(true)}
            />
          </div>
        )}
      </main>

      {/* Chat panel */}
      <ChatPanel
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        simulationResult={result}
      />

      {/* Compare drawer */}
      <CompareDrawer
        isOpen={compareOpen}
        onClose={() => setCompareOpen(false)}
        scenarios={savedScenarios}
        onDelete={handleDeleteScenario}
      />

      {/* Toast notification */}
      {toastMsg && (
        <div role="status" aria-live="polite" className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm text-white shadow-lg">
          {toastMsg}
        </div>
      )}
    </div>
  );
}
