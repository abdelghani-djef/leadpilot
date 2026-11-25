import "server-only";
import { createHmac } from "node:crypto";
import type { Lead } from "./schema";

/**
 * Sends each new lead to WEBHOOK_URL (n8n, Make, Zapier, a Google Apps Script, a CRM...).
 * When WEBHOOK_SECRET is set, the body is signed so the receiver can check it came from here:
 *   X-LeadPilot-Signature: sha256=<hex HMAC of the raw body>
 * Failures are logged, never thrown: a broken integration must not lose the lead.
 */
export async function forwardLead(lead: Lead): Promise<"sent" | "skipped" | "failed"> {
  const url = process.env.WEBHOOK_URL;
  if (!url) return "skipped";

  const body = JSON.stringify({ event: "lead.created", lead });
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (process.env.WEBHOOK_SECRET) {
    const signature = createHmac("sha256", process.env.WEBHOOK_SECRET).update(body).digest("hex");
    headers["x-leadpilot-signature"] = `sha256=${signature}`;
  }

  try {
    const response = await fetch(url, { method: "POST", headers, body, signal: AbortSignal.timeout(5000) });
    if (!response.ok) {
      console.error(`[leadpilot] Webhook answered ${response.status}`);
      return "failed";
    }
    return "sent";
  } catch (error) {
    console.error("[leadpilot] Webhook failed:", error instanceof Error ? error.message : error);
    return "failed";
  }
}
