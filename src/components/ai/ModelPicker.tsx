"use client";

import { AI_MODELS } from "@/lib/ai";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────
// ModelPicker — compact dropdown over the configured AI models.
//
// Controlled via `value` + `onChange`. Models without an API key are
// kept selectable but labelled "(clé requise)" so the user can see what
// unlocking a provider would offer; the backend transparently falls
// back to the mock provider for unavailable models.
// ─────────────────────────────────────────────────────────────

export default function ModelPicker({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (id: string) => void;
  className?: string;
}) {
  return (
    <select
      aria-label="AI model"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "rounded-md border border-line bg-bg-soft px-2 py-1 text-xs text-slate-200",
        "outline-none transition-colors hover:border-brand/60 focus:border-brand/60",
        className,
      )}
    >
      {AI_MODELS.map((m) => (
        <option key={m.id} value={m.id} className="bg-bg text-slate-200">
          {m.label}
          {m.available ? "" : " (clé requise)"}
        </option>
      ))}
    </select>
  );
}
