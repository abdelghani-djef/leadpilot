import "server-only";

/**
 * Small in-memory limiter for the public form, so a public demo can't run up an API bill.
 * Per IP: 5 leads per 10 minutes. Whole site: DAILY_LEAD_LIMIT leads per day (default 300).
 * In-memory is enough for one server; use Redis or the database if you run several.
 */
const PER_IP_LIMIT = 5;
const PER_IP_WINDOW_MS = 10 * 60 * 1000;
const DAILY_LIMIT = Number(process.env.DAILY_LEAD_LIMIT ?? 300);

const hits = new Map<string, number[]>();
let day = new Date().toISOString().slice(0, 10);
let dailyCount = 0;

export function checkRateLimit(ip: string): { ok: true } | { ok: false; reason: string } {
  const today = new Date().toISOString().slice(0, 10);
  if (today !== day) {
    day = today;
    dailyCount = 0;
    hits.clear();
  }
  if (dailyCount >= DAILY_LIMIT) {
    return { ok: false, reason: "The demo has reached its daily limit. Please try again tomorrow." };
  }

  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < PER_IP_WINDOW_MS);
  if (recent.length >= PER_IP_LIMIT) {
    return { ok: false, reason: "Too many submissions. Please wait a few minutes and try again." };
  }

  recent.push(now);
  hits.set(ip, recent);
  dailyCount += 1;
  return { ok: true };
}
