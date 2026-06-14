"use client";

import { useEffect, useRef, useState } from "react";
import ModelPicker from "@/components/ai/ModelPicker";
import { AI_MODELS } from "@/lib/ai";
import type { ChatMessage } from "@/lib/types";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────
// CopilotDock — the app-wide "Ask Mnemo" dock.
//
// A fixed brand FAB at the bottom-right toggles a compact chat panel.
// History persists to localStorage so the conversation survives page
// navigations and refreshes. Works fully in demo mode: the /api/copilot
// route always answers (mock fallback) and never 500s.
// ─────────────────────────────────────────────────────────────

const STORAGE_KEY = "mnemo-copilot";
const DEFAULT_MODEL =
  AI_MODELS.find((m) => m.available)?.id ?? AI_MODELS[0]?.id ?? "mnemo-mock";

const GREETING: ChatMessage = {
  role: "assistant",
  content:
    "Ask Mnemo anything about the markets — US and Africa (BRVM, JSE, NGX, EGX). Tickers, trends, scenarios. Mention a symbol with $ (e.g. $AAPL, $SNTS) or just ask.",
};

function loadHistory(): ChatMessage[] {
  if (typeof window === "undefined") return [GREETING];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [GREETING];
    const parsed = JSON.parse(raw) as ChatMessage[];
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    return [GREETING];
  } catch {
    return [GREETING];
  }
}

export default function CopilotDock() {
  const [open, setOpen] = useState(false);
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  // Load persisted history once on mount (client-only).
  useEffect(() => {
    setMessages(loadHistory());
  }, []);

  // Persist whenever the conversation changes.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      // Storage may be full or blocked — non-fatal.
    }
  }, [messages]);

  // Keep the latest message in view.
  useEffect(() => {
    if (!open) return;
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, open, sending]);

  async function send() {
    const text = draft.trim();
    if (!text || sending) return;

    const userMsg: ChatMessage = { role: "user", content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    setDraft("");
    setSending(true);

    try {
      const res = await fetch("/api/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, model }),
      });
      const data = (await res.json()) as { reply?: string };
      const reply =
        typeof data.reply === "string" && data.reply.trim()
          ? data.reply
          : "(Mnemo AI is unavailable right now.)";
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "(Mnemo AI is unavailable right now.)" },
      ]);
    } finally {
      setSending(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Enter sends; Shift+Enter inserts a newline.
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  }

  function clearChat() {
    setMessages([GREETING]);
  }

  return (
    <>
      {/* Chat panel */}
      {open && (
        <div
          className={cn(
            "fixed bottom-24 right-5 z-50 flex w-[380px] max-w-[calc(100vw-2.5rem)] flex-col",
            "card max-h-[70vh] overflow-hidden p-0 shadow-glow",
          )}
          role="dialog"
          aria-label="Ask Mnemo"
        >
          {/* Header */}
          <header className="flex items-center gap-2 border-b border-line px-3 py-2.5">
            <SparkIcon className="h-4 w-4 text-brand" />
            <span className="text-sm font-semibold text-slate-100">Ask Mnemo</span>
            <div className="ml-auto flex items-center gap-1.5">
              <ModelPicker value={model} onChange={setModel} />
              <button
                type="button"
                onClick={clearChat}
                title="New conversation"
                className="rounded-md p-1 text-muted transition-colors hover:text-slate-200"
                aria-label="Clear conversation"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                title="Close"
                className="rounded-md p-1 text-muted transition-colors hover:text-slate-200"
                aria-label="Close copilot"
              >
                <CloseIcon className="h-4 w-4" />
              </button>
            </div>
          </header>

          {/* Messages */}
          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
            {messages.map((m, i) => (
              <Bubble key={i} message={m} />
            ))}
            {sending && <TypingIndicator />}
          </div>

          {/* Composer */}
          <div className="border-t border-line p-2.5">
            <div className="flex items-end gap-2">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={onKeyDown}
                rows={1}
                placeholder="Ask for an analysis… ($AAPL, $NPN, macro…)"
                className="input min-h-[40px] max-h-28 flex-1 resize-none py-2 text-sm"
              />
              <button
                type="button"
                onClick={() => void send()}
                disabled={sending || !draft.trim()}
                className="btn btn-primary h-[40px] px-3 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Send message"
              >
                <SendIcon className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-1.5 px-0.5 text-[10px] leading-tight text-muted">
              Mnemo AI can be wrong. Not financial advice.
            </p>
          </div>
        </div>
      )}

      {/* Floating action button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close Ask Mnemo" : "Open Ask Mnemo"}
        aria-expanded={open}
        className={cn(
          "fixed bottom-5 right-5 z-50 flex h-12 w-12 items-center justify-center rounded-full",
          "bg-brand text-bg shadow-glow transition-transform hover:scale-105 active:scale-95",
        )}
      >
        {open ? <CloseIcon className="h-5 w-5" /> : <SparkIcon className="h-5 w-5" />}
      </button>
    </>
  );
}

function Bubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-3 py-2 text-sm leading-relaxed",
          isUser
            ? "rounded-br-sm bg-brand text-bg"
            : "rounded-bl-sm bg-bg-elevated text-slate-200",
        )}
      >
        {message.content}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-bg-elevated px-3 py-2.5">
        <Dot delay="0ms" />
        <Dot delay="150ms" />
        <Dot delay="300ms" />
      </div>
    </div>
  );
}

function Dot({ delay }: { delay: string }) {
  return (
    <span
      className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted"
      style={{ animationDelay: delay }}
    />
  );
}

// ── Inline icons (no new deps) ─────────────────────────────────
function SparkIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2l1.8 5.4L19 9l-5.2 1.6L12 16l-1.8-5.4L5 9l5.2-1.6L12 2zm6 10l.9 2.7L21 16l-2.1.6L18 19l-.9-2.4L15 16l2.1-.6L18 12z" />
    </svg>
  );
}

function SendIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M3 11l18-8-8 18-2.5-7.5L3 11z" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" />
    </svg>
  );
}
