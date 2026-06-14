"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────
// ReportView — render a simple markdown report as styled JSX.
//
// Handles the subset emitted by /api/reports:
//   "## heading", "**bold line / label**", "- bullet", "---" rule,
//   "_italic_" inline, and plain paragraphs. Unknown syntax falls
//   through as paragraph text, so this never throws on odd input.
//
// Toolbar: "Imprimer / Exporter" (window.print, guarded) and a
// download-as-.md button (Blob). Both client-only.
// ─────────────────────────────────────────────────────────────

export interface ReportData {
  title: string;
  body: string;
  created_at: string;
}

type Block =
  | { type: "h2"; text: string }
  | { type: "p"; text: string }
  | { type: "bold"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "hr" };

// Parse the markdown body into a flat list of blocks.
function parseBlocks(body: string): Block[] {
  const lines = body.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let bullets: string[] = [];

  const flushBullets = () => {
    if (bullets.length > 0) {
      blocks.push({ type: "ul", items: bullets });
      bullets = [];
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (line.trim() === "") {
      flushBullets();
      continue;
    }
    if (line.startsWith("## ")) {
      flushBullets();
      blocks.push({ type: "h2", text: line.slice(3).trim() });
    } else if (line.trim() === "---") {
      flushBullets();
      blocks.push({ type: "hr" });
    } else if (line.startsWith("- ")) {
      bullets.push(line.slice(2).trim());
    } else if (/^\*\*.+\*\*$/.test(line.trim())) {
      flushBullets();
      blocks.push({ type: "bold", text: line.trim().replace(/^\*\*|\*\*$/g, "") });
    } else {
      flushBullets();
      blocks.push({ type: "p", text: line.trim() });
    }
  }
  flushBullets();
  return blocks;
}

// Render inline emphasis: **bold** and _italic_. Returns JSX nodes.
function renderInline(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|_[^_]+_)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    const token = match[0];
    if (token.startsWith("**")) {
      nodes.push(
        <strong key={key++} className="font-semibold text-slate-100">
          {token.slice(2, -2)}
        </strong>,
      );
    } else {
      nodes.push(
        <em key={key++} className="text-muted">
          {token.slice(1, -1)}
        </em>,
      );
    }
    last = match.index + token.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

export default function ReportView({
  report,
  className,
}: {
  report: ReportData;
  className?: string;
}) {
  const blocks = useMemo(() => parseBlocks(report.body), [report.body]);

  const handlePrint = () => {
    if (typeof window !== "undefined") window.print();
  };

  const handleDownload = () => {
    if (typeof window === "undefined") return;
    const md = `# ${report.title}\n\n${report.body}\n`;
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slugify(report.title)}.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const dateLabel = formatDate(report.created_at);

  return (
    <div className={cn("card overflow-hidden", className)}>
      {/* Toolbar — hidden when printing */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3 print:hidden">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-bold text-slate-100">{report.title}</h2>
          {dateLabel && <p className="text-xs text-muted">Generated {dateLabel}</p>}
        </div>
        <div className="flex shrink-0 gap-2">
          <button type="button" onClick={handlePrint} className="btn btn-ghost text-sm">
            Print / Export
          </button>
          <button type="button" onClick={handleDownload} className="btn btn-ghost text-sm">
            Download .md
          </button>
        </div>
      </div>

      <article className="prose-report px-4 py-5 sm:px-6">
        {/* Print-only title */}
        <h1 className="mb-4 hidden text-2xl font-black text-slate-100 print:block">
          {report.title}
        </h1>
        {blocks.map((block, i) => (
          <BlockNode key={i} block={block} />
        ))}
      </article>
    </div>
  );
}

function BlockNode({ block }: { block: Block }) {
  switch (block.type) {
    case "h2":
      return (
        <h3 className="mb-2 mt-5 text-sm font-bold uppercase tracking-wide text-brand first:mt-0">
          {block.text}
        </h3>
      );
    case "bold":
      return (
        <p className="mb-1 mt-3 font-semibold text-slate-200">{renderInline(block.text)}</p>
      );
    case "ul":
      return (
        <ul className="mb-3 space-y-1.5">
          {block.items.map((item, i) => (
            <li key={i} className="flex gap-2 text-sm text-slate-300">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-brand" aria-hidden />
              <span className="min-w-0">{renderInline(item)}</span>
            </li>
          ))}
        </ul>
      );
    case "hr":
      return <hr className="my-4 border-line" />;
    case "p":
    default:
      return (
        <p className="mb-3 text-sm leading-relaxed text-slate-300">{renderInline(block.text)}</p>
      );
  }
}

function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "memo"
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}
