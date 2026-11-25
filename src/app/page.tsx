import { LeadForm } from "./lead-form";

const FEATURES = [
  {
    title: "Scores every lead",
    body: "Hot, warm or cold, with the reason, the budget they mentioned and how urgent it is.",
  },
  {
    title: "Replies in their language",
    body: "A ready-to-send reply in English, French or Arabic, asking the questions that move the deal forward.",
  },
  {
    title: "Plugs into your tools",
    body: "Each lead is pushed to n8n, Google Sheets, Make or your CRM through a signed webhook.",
  },
];

const STEPS = [
  { n: "1", title: "A customer fills in your form", body: "Your website form posts to LeadPilot instead of an inbox." },
  {
    n: "2",
    title: "AI reads and scores it",
    body: "It decides how promising the lead is, summarizes it and drafts the reply. Attempts to trick it are flagged as spam.",
  },
  {
    n: "3",
    title: "You act on the best leads first",
    body: "Hot leads sit at the top of the dashboard and reach your other tools within seconds.",
  },
];

export default function Home() {
  return (
    <main>
      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_1.05fr] lg:py-20">
        <div className="lg:pt-6">
          <p className="text-sm font-semibold text-accent">AI lead qualification for small businesses</p>
          <h1 className="mt-3 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            Know which leads to call first, before you open your inbox.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted">
            LeadPilot reads every inquiry from your website, scores it, summarizes it and drafts the reply, so you
            spend your time on the customers most likely to buy.
          </p>
          <ul className="mt-8 space-y-5">
            {FEATURES.map((f) => (
              <li key={f.title} className="flex gap-3">
                <span className="mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-accent-soft text-accent">
                  <svg viewBox="0 0 12 12" className="h-3 w-3" aria-hidden="true">
                    <path d="M2.5 6.2 5 8.5l4.5-5" fill="none" stroke="currentColor" strokeWidth="1.8" />
                  </svg>
                </span>
                <div>
                  <p className="font-medium">{f.title}</p>
                  <p className="text-sm text-muted">{f.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <LeadForm />
      </section>

      <section className="border-t border-line bg-card">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <h2 className="text-2xl font-semibold tracking-tight">How it works</h2>
          <ol className="mt-8 grid gap-6 md:grid-cols-3">
            {STEPS.map((s) => (
              <li key={s.n} className="rounded-xl border border-line bg-paper p-5">
                <span className="text-sm font-semibold text-accent">Step {s.n}</span>
                <p className="mt-2 font-medium">{s.title}</p>
                <p className="mt-1 text-sm text-muted">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </main>
  );
}
