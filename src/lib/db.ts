import "server-only";
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import path from "node:path";
import type { Engine, Lead, LeadAnalysis, LeadInput, LeadStatus } from "./schema";

const dataDir = process.env.DATA_DIR ?? path.join(process.cwd(), "data");

// One connection per server process; reused across hot reloads in dev.
const globalForDb = globalThis as unknown as { leadpilotDb?: DatabaseSync };

function open(): DatabaseSync {
  mkdirSync(dataDir, { recursive: true });
  const db = new DatabaseSync(path.join(dataDir, "leadpilot.db"));
  db.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS leads (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at      TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
      name            TEXT    NOT NULL,
      email           TEXT    NOT NULL,
      company         TEXT    NOT NULL DEFAULT '',
      budget          TEXT    NOT NULL DEFAULT '',
      message         TEXT    NOT NULL,
      score           TEXT    NOT NULL,
      score_reason    TEXT    NOT NULL,
      category        TEXT    NOT NULL,
      urgency         TEXT    NOT NULL,
      language        TEXT    NOT NULL,
      summary         TEXT    NOT NULL,
      budget_estimate TEXT,
      suggested_reply TEXT    NOT NULL,
      next_action     TEXT    NOT NULL,
      engine          TEXT    NOT NULL,
      status          TEXT    NOT NULL DEFAULT 'new'
    );
  `);
  return db;
}

function db(): DatabaseSync {
  globalForDb.leadpilotDb ??= open();
  return globalForDb.leadpilotDb;
}

export function insertLead(input: LeadInput, analysis: LeadAnalysis, engine: Engine): Lead {
  const row = db()
    .prepare(
      `INSERT INTO leads (name, email, company, budget, message, score, score_reason, category,
         urgency, language, summary, budget_estimate, suggested_reply, next_action, engine)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       RETURNING *`,
    )
    .get(
      input.name,
      input.email,
      input.company,
      input.budget,
      input.message,
      analysis.score,
      analysis.score_reason,
      analysis.category,
      analysis.urgency,
      analysis.language,
      analysis.summary,
      analysis.budget_estimate,
      analysis.suggested_reply,
      analysis.next_action,
      engine,
    );
  return row as unknown as Lead;
}

export function listLeads(): Lead[] {
  return db().prepare("SELECT * FROM leads ORDER BY id DESC LIMIT 200").all() as unknown as Lead[];
}

export function setLeadStatus(id: number, status: LeadStatus): boolean {
  const result = db().prepare("UPDATE leads SET status = ? WHERE id = ?").run(status, id);
  return Number(result.changes) > 0;
}
