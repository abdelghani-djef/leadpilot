import type { Engine, LeadAnalysis } from "@/lib/schema";
import { CATEGORY_LABEL, EngineTag, ScoreBadge, Tag, urgencyLabel } from "./badges";
import { CopyButton } from "./copy-button";

export function AnalysisCard({ analysis, engine }: { analysis: LeadAnalysis; engine: Engine }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <ScoreBadge score={analysis.score} large />
        <Tag>{CATEGORY_LABEL[analysis.category]}</Tag>
        <Tag>{urgencyLabel(analysis.urgency)}</Tag>
        <Tag>Language: {analysis.language.toUpperCase()}</Tag>
        {analysis.budget_estimate ? <Tag>Budget: {analysis.budget_estimate}</Tag> : null}
      </div>
      <p className="text-sm text-muted">{analysis.score_reason}</p>

      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Summary</h3>
        <p className="mt-1 text-sm" dir="auto">
          {analysis.summary}
        </p>
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Suggested reply</h3>
          <CopyButton text={analysis.suggested_reply} />
        </div>
        <p
          className="mt-1 whitespace-pre-line rounded-lg border border-line bg-paper p-3 text-sm leading-relaxed"
          dir="auto"
        >
          {analysis.suggested_reply}
        </p>
      </section>

      <section className="flex items-start gap-2 rounded-lg bg-accent-soft p-3 text-sm text-accent">
        <span className="font-semibold">Next step:</span>
        <span>{analysis.next_action}</span>
      </section>

      <EngineTag engine={engine} />
    </div>
  );
}
