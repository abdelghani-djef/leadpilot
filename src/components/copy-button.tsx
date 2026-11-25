"use client";

import { useState } from "react";

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard can be blocked (http, iframe); the text stays selectable.
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="rounded-md px-2 py-1 text-xs font-medium text-accent hover:bg-accent-soft"
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}
