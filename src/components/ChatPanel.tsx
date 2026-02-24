"use client";

import { useState, useRef, useEffect } from "react";
import { ChatMessage, SimulationResult } from "@/lib/types";
import { lockScroll, unlockScroll } from "@/lib/scrollLock";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  simulationResult: SimulationResult | null;
}

// Max messages to send to API to avoid exceeding context window
const MAX_HISTORY_MESSAGES = 20;

// Simple markdown-like rendering for assistant messages
function renderContent(text: string, isUser: boolean) {
  if (isUser) return text;

  // First, extract code blocks (which may contain double newlines internally)
  const segments: { type: "code" | "text"; content: string }[] = [];
  const codeBlockRegex = /```(\w*)\n?([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: "text", content: text.slice(lastIndex, match.index) });
    }
    segments.push({ type: "code", content: match[2] });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    segments.push({ type: "text", content: text.slice(lastIndex) });
  }

  return segments.map((seg, si) => {
    if (seg.type === "code") {
      return (
        <pre key={`seg-${si}`} className="my-1 overflow-x-auto rounded bg-gray-200 p-2 text-xs">
          <code>{seg.content}</code>
        </pre>
      );
    }
    // Split text segments into paragraphs
    return seg.content.split(/\n\n+/).map((para, pi) => {
      const trimmed = para.trim();
      if (!trimmed) return null;
      // Inline formatting: **bold**, *italic*, `code`
      const parts = trimmed.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/).map((s, j) => {
        if (s.startsWith("**") && s.endsWith("**") && s.length > 4)
          return <strong key={j}>{s.slice(2, -2)}</strong>;
        if (s.startsWith("*") && s.endsWith("*") && s.length > 2)
          return <em key={j}>{s.slice(1, -1)}</em>;
        if (s.startsWith("`") && s.endsWith("`") && s.length > 2)
          return <code key={j} className="rounded bg-gray-200 px-1 text-xs">{s.slice(1, -1)}</code>;
        return s;
      });
      return <p key={`seg-${si}-p-${pi}`} className={si > 0 || pi > 0 ? "mt-2" : ""}>{parts}</p>;
    });
  });
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
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  }, [isOpen]);

  // Abort streaming and close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  // Cancel in-flight request when panel closes + lock body scroll
  useEffect(() => {
    if (isOpen) {
      lockScroll();
    } else {
      abortRef.current?.abort();
    }
    return () => { if (isOpen) unlockScroll(); };
  }, [isOpen]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: isStreaming ? "auto" : "smooth",
    });
  }, [messages, isStreaming]);

  function buildContext() {
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
  }

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
      const allMessages = [...messages, userMsg];
      // Keep only the last N messages to avoid exceeding API context limits
      const chatHistory = allMessages
        .slice(-MAX_HISTORY_MESSAGES)
        .map((m) => ({ role: m.role, content: m.content }));

      // Cancel any previous in-flight request
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: chatHistory,
          simulationContext: buildContext(),
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        let errorMsg = `Falha na comunicacao (HTTP ${res.status})`;
        try {
          const err = await res.json();
          errorMsg = err.error || errorMsg;
        } catch {
          // non-JSON error response (e.g. proxy HTML page)
        }
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsg.id
              ? { ...m, content: `Erro: ${errorMsg}` }
              : m
          )
        );
        setIsStreaming(false);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No reader");

      try {
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

        // Flush any remaining bytes from the decoder
        const remainder = decoder.decode();
        if (remainder) {
          accumulated += remainder;
        }

        // If stream ended with no content, show fallback message
        if (!accumulated.trim()) {
          accumulated = "Desculpe, nao recebi uma resposta. Tente novamente.";
        }

        const final_ = accumulated;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsg.id ? { ...m, content: final_ } : m
          )
        );
      } finally {
        try { reader.cancel(); } catch { /* already closed */ }
      }
    } catch (err: unknown) {
      // Don't show error if request was intentionally aborted
      if (err instanceof DOMException && err.name === "AbortError") {
        setIsStreaming(false);
        return;
      }
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
        aria-hidden="true"
      />

      {/* Panel */}
      <div role="dialog" aria-modal="true" aria-label="Assistente PGBL / VGBL" className="relative flex h-[85vh] w-full max-w-lg flex-col rounded-t-2xl bg-white shadow-2xl sm:h-[600px] sm:rounded-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100">
              <svg
                aria-hidden="true"
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
                Assistente PGBL / VGBL
              </h3>
              <p className="text-xs text-gray-400">Tire suas duvidas</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar assistente"
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
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
                    type="button"
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
                {msg.content ? (
                  renderContent(msg.content, msg.role === "user")
                ) : (
                  <span className="inline-flex gap-1" role="status" aria-label="Gerando resposta">
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
              aria-label="Enviar mensagem"
              className="btn-primary px-4"
            >
              <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
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
