"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ChatMessage, SimulationResult } from "@/lib/types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  simulationResult: SimulationResult | null;
}

const QUICK_PROMPTS = [
  "Por que o PGBL e vantajoso apos o break-even?",
  "O que significa o prazo de reembolso?",
  "Qual a diferenca entre regime progressivo e regressivo?",
  "O que acontece se eu resgatar antes de 10 anos?",
  "Como a aliquota marginal afeta o beneficio?",
];

export default function ChatPanel({
  isOpen,
  onClose,
  simulationResult,
}: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const buildContext = useCallback(() => {
    if (!simulationResult) return null;
    const { inputs, derived, terminalA, terminalB, annualizedDelta, breakEvenYear } =
      simulationResult;
    return {
      renda_anual: inputs.annualIncome,
      plano: inputs.wrapper,
      contribuicao_pct: inputs.contributionPct,
      regime: inputs.regime,
      retorno_esperado: inputs.expectedReturn,
      horizonte_anos: inputs.horizonYears,
      ir_ganhos: inputs.capitalGainsTax,
      prazo_reembolso: inputs.refundDelayYears,
      xin: derived.xin,
      xout: derived.xout,
      reembolso: derived.refundAmount,
      patrimonio_sem_pgbl: terminalA,
      patrimonio_com_pgbl: terminalB,
      delta_bps: annualizedDelta,
      break_even_ano: breakEvenYear,
    };
  }, [simulationResult]);

  async function handleSend(text?: string) {
    const content = text || input.trim();
    if (!content || isStreaming) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsStreaming(true);

    const assistantMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "",
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, assistantMsg]);

    try {
      const chatHistory = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: chatHistory,
          simulationContext: buildContext(),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsg.id
              ? { ...m, content: `Erro: ${err.error || "Falha na comunicacao"}` }
              : m
          )
        );
        setIsStreaming(false);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No reader");

      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        const current = accumulated;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsg.id ? { ...m, content: current } : m
          )
        );
      }
    } catch (err: any) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsg.id
            ? { ...m, content: "Desculpe, ocorreu um erro. Tente novamente." }
            : m
        )
      );
    } finally {
      setIsStreaming(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative flex h-[85vh] w-full max-w-lg flex-col rounded-t-2xl bg-white shadow-2xl sm:h-[600px] sm:rounded-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100">
              <svg
                className="h-4 w-4 text-primary-600"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                Assistente PGBL
              </h3>
              <p className="text-xs text-gray-400">Tire suas duvidas</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="chat-scroll flex-1 overflow-y-auto p-4">
          {messages.length === 0 && (
            <div className="space-y-3">
              <p className="text-center text-sm text-gray-400">
                Pergunte sobre sua simulacao ou sobre PGBL em geral.
              </p>
              <div className="space-y-2">
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => handleSend(prompt)}
                    className="w-full rounded-lg border border-gray-200 p-2.5 text-left text-sm text-gray-600 transition-colors hover:border-primary-300 hover:bg-primary-50"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`mb-3 flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-primary-600 text-white"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {msg.content || (
                  <span className="inline-flex gap-1">
                    <span className="animate-pulse">●</span>
                    <span className="animate-pulse" style={{ animationDelay: "150ms" }}>●</span>
                    <span className="animate-pulse" style={{ animationDelay: "300ms" }}>●</span>
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="border-t border-gray-100 p-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Digite sua pergunta..."
              className="input-field flex-1"
              disabled={isStreaming}
            />
            <button
              type="submit"
              disabled={isStreaming || !input.trim()}
              className="btn-primary px-4"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </button>
          </form>
          <p className="mt-1.5 text-center text-[10px] text-gray-300">
            Ferramenta educacional. Nao constitui aconselhamento fiscal.
          </p>
        </div>
      </div>
    </div>
  );
}
