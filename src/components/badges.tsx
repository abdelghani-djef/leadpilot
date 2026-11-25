import type { Engine, LeadAnalysis } from "@/lib/schema";

const SCORE_STYLE: Record<LeadAnalysis["score"], string> = {
  hot: "bg-hot-soft text-hot ring-hot/25",
  warm: "bg-warm-soft text-warm ring-warm/25",
  cold: "bg-cold-soft text-cold ring-cold/25",
};

export function ScoreBadge({ score, large = false }: { score: LeadAnalysis["score"]; large?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold uppercase tracking-wide ring-1 ring-inset ${
        SCORE_STYLE[score]
      } ${large ? "px-3 py-1 text-sm" : "px-2 py-0.5 text-xs"}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {score}
    </span>
  );
}

export const CATEGORY_LABEL: Record<LeadAnalysis["category"], string> = {
  new_project: "New project",
  quote_request: "Quote request",
  support: "Support",
  partnership: "Partnership",
  job_application: "Job application",
  spam: "Spam",
  other: "Other",
};

export function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-md border border-line bg-paper px-2 py-0.5 text-xs text-muted">
      {children}
    </span>
  );
}

const ENGINE_LABEL: Record<Engine, string> = {
  ai: "Analyzed by AI",
  demo: "Offline demo engine",
  "demo-fallback": "Demo engine (AI unavailable)",
};

export function EngineTag({ engine }: { engine: Engine }) {
  return <Tag>{ENGINE_LABEL[engine]}</Tag>;
}

export function urgencyLabel(urgency: LeadAnalysis["urgency"]): string {
  return { high: "Urgent", medium: "Soon", low: "No rush" }[urgency];
}
