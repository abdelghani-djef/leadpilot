"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { LeadStatus } from "@/lib/schema";

const OPTIONS: LeadStatus[] = ["new", "contacted", "won", "lost"];

export function StatusSelect({ id, status }: { id: number; status: LeadStatus }) {
  const router = useRouter();
  const [value, setValue] = useState(status);
  const [pending, startTransition] = useTransition();
  const [failed, setFailed] = useState(false);

  async function change(next: LeadStatus) {
    const previous = value;
    setValue(next);
    setFailed(false);
    const response = await fetch(`/api/leads/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    if (!response.ok) {
      setValue(previous);
      setFailed(true);
      return;
    }
    startTransition(() => router.refresh());
  }

  return (
    <label className="flex items-center gap-2 text-xs text-muted">
      Status
      <select
        value={value}
        disabled={pending}
        onChange={(e) => change(e.target.value as LeadStatus)}
        className="rounded-md border border-line bg-card px-2 py-1 text-xs text-ink capitalize"
      >
        {OPTIONS.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      {failed ? <span className="text-hot">Not saved</span> : null}
    </label>
  );
}
