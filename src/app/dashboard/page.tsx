import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { CATEGORY_LABEL, EngineTag, ScoreBadge, Tag, urgencyLabel } from "@/components/badges";
import { CopyButton } from "@/components/copy-button";
import { listLeads } from "@/lib/db";
import type { Lead, LeadAnalysis } from "@/lib/schema";
import { StatusSelect } from "./status-select";

export const metadata: Metadata = { title: "Dashboard — LeadPilot" };
export const dynamic = "force-dynamic";

const FILTERS = ["all", "hot", "warm", "cold"] as const;
type Filter = (typeof FILTERS)[number];

function maskName(name: string): string {
  const [first, ...rest] = name.trim().split(/\s+/);
  return rest.length ? `${first} ${rest[rest.length - 1][0]}.` : first;
}

function maskEmail(email: string): string {
  const [user, domain] = email.split("@");
  return `${user[0]}•••@${domain}`;
}

function timeAgo(iso: string): string {
  const minutes = Math.round((Date.now() - Date.parse(iso)) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  return `${Math.round(hours / 24)} d ago`;
}

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ score?: string }> }) {
  const isAdmin = (await headers()).get("x-leadpilot-admin") === "1";
  const requested = (await searchParams).score;
  const filter: Filter = FILTERS.includes(requested as Filter) ? (requested as Filter) : "all";

  const all = listLeads();
  const count = (score: LeadAnalysis["score"]) => all.filter((l) => l.score === score).length;
  const leads = filter === "all" ? all : all.filter((l) => l.score === filter);

  const stats = [
    { label: "Leads", value: all.length, tone: "text-ink" },
    { label: "Hot", value: count("hot"), tone: "text-hot" },
    { label: "Warm", value: count("warm"), tone: "text-warm" },
    { label: "Cold", value: count("cold"), tone: "text-cold" },
  ];

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Leads</h1>
          <p className="mt-1 text-sm text-muted">Newest first. Hot leads are the ones to call today.</p>
        </div>
        <Link href="/" className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent/90">
          Send a test lead
        </Link>
      </div>

      {!isAdmin ? (
        <p className="mt-6 rounded-lg border border-warm/30 bg-warm-soft px-4 py-3 text-sm text-warm">
          Public demo view: names, emails and messages are hidden, and changes are turned off.
        </p>
      ) : null}

      <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-line bg-card p-4">
            <dt className="text-xs font-medium uppercase tracking-wide text-muted">{s.label}</dt>
            <dd className={`mt-1 text-3xl font-semibold ${s.tone}`}>{s.value}</dd>
          </div>
        ))}
      </dl>

      <nav className="mt-8 flex gap-2" aria-label="Filter by score">
        {FILTERS.map((f) => (
          <Link
            key={f}
            href={f === "all" ? "/dashboard" : `/dashboard?score=${f}`}
            className={`rounded-full px-3 py-1 text-sm capitalize ${
              f === filter ? "bg-ink text-white" : "border border-line bg-card text-muted hover:text-ink"
            }`}
          >
            {f}
          </Link>
        ))}
      </nav>

      {leads.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-line bg-card p-10 text-center">
          <p className="font-medium">No leads here yet</p>
          <p className="mt-1 text-sm text-muted">
            Send one from the <Link href="/" className="text-accent underline">home page</Link> to see it scored.
          </p>
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {leads.map((lead) => (
            <LeadRow key={lead.id} lead={lead} isAdmin={isAdmin} />
          ))}
        </ul>
      )}
    </main>
  );
}

function LeadRow({ lead, isAdmin }: { lead: Lead; isAdmin: boolean }) {
  return (
    <li className="rounded-xl border border-line bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <ScoreBadge score={lead.score} />
            <p className="font-semibold" dir="auto">
              {isAdmin ? lead.name : maskName(lead.name)}
            </p>
            {lead.company ? (
              <p className="text-sm text-muted" dir="auto">
                · {lead.company}
              </p>
            ) : null}
          </div>
          <p className="mt-1 text-xs text-muted">
            {isAdmin ? lead.email : maskEmail(lead.email)} · {timeAgo(lead.created_at)}
          </p>
        </div>
        {isAdmin ? <StatusSelect id={lead.id} status={lead.status} /> : <Tag>Status: {lead.status}</Tag>}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Tag>{CATEGORY_LABEL[lead.category]}</Tag>
        <Tag>{urgencyLabel(lead.urgency)}</Tag>
        <Tag>{lead.language.toUpperCase()}</Tag>
        {lead.budget_estimate ? <Tag>Budget: {lead.budget_estimate}</Tag> : null}
        <EngineTag engine={lead.engine} />
      </div>

      <p className="mt-3 text-sm" dir="auto">
        {lead.summary}
      </p>
      <p className="mt-1 text-sm text-muted">{lead.score_reason}</p>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {isAdmin ? (
          <details className="self-start rounded-lg border border-line bg-paper p-3 text-sm">
            <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-muted">
              Original message
            </summary>
            <p className="mt-2 whitespace-pre-line" dir="auto">
              {lead.message}
            </p>
          </details>
        ) : (
          <p className="self-start rounded-lg border border-dashed border-line p-3 text-xs text-muted">
            The original message is hidden in the public view.
          </p>
        )}
        <div className="rounded-lg border border-line bg-paper p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Suggested reply</p>
            <CopyButton text={lead.suggested_reply} />
          </div>
          <p className="mt-2 line-clamp-4 whitespace-pre-line text-sm" dir="auto">
            {lead.suggested_reply}
          </p>
        </div>
      </div>

      <p className="mt-3 text-sm text-accent">
        <span className="font-semibold">Next step:</span> {lead.next_action}
      </p>
    </li>
  );
}
