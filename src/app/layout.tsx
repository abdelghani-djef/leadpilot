import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "LeadPilot — AI lead qualification",
  description:
    "Scores every website inquiry hot, warm or cold, summarizes it, and drafts a reply in the customer's language.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <header className="border-b border-line bg-paper/90 backdrop-blur sticky top-0 z-10">
          <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
            <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
              <span className="grid h-7 w-7 place-items-center rounded-md bg-accent text-sm text-white">L</span>
              LeadPilot
            </Link>
            <div className="flex items-center gap-5 text-sm">
              <Link href="/" className="text-muted hover:text-ink">
                Try it
              </Link>
              <Link
                href="/dashboard"
                className="rounded-md border border-line bg-card px-3 py-1.5 font-medium hover:border-ink"
              >
                Dashboard
              </Link>
            </div>
          </nav>
        </header>
        {children}
        <footer className="border-t border-line">
          <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-muted sm:flex-row sm:justify-between sm:px-6">
            <p>LeadPilot is a demo project built with Next.js, Groq AI and SQLite.</p>
            {process.env.NEXT_PUBLIC_CONTACT_URL ? (
              <a href={process.env.NEXT_PUBLIC_CONTACT_URL} className="font-medium text-accent hover:underline">
                Want this for your business? Get in touch
              </a>
            ) : null}
          </div>
        </footer>
      </body>
    </html>
  );
}
