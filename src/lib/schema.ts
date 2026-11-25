import { z } from "zod";

/** What the public contact form sends. Limits keep abuse and API cost bounded. */
export const LeadInput = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  email: z.email("A valid email is required").max(200),
  company: z.string().trim().max(160).optional().default(""),
  budget: z.string().trim().max(80).optional().default(""),
  message: z.string().trim().min(10, "Tell us a bit more (10+ characters)").max(4000),
});
export type LeadInput = z.infer<typeof LeadInput>;

/** What the AI (or the offline demo engine) returns for each lead. Mirrors LEAD_SCHEMA in analyze.ts. */
export const LeadAnalysis = z.object({
  score: z.enum(["hot", "warm", "cold"]),
  score_reason: z.string(),
  category: z.enum([
    "new_project",
    "quote_request",
    "support",
    "partnership",
    "job_application",
    "spam",
    "other",
  ]),
  urgency: z.enum(["high", "medium", "low"]),
  language: z.string(),
  summary: z.string(),
  budget_estimate: z.string().nullable(),
  suggested_reply: z.string(),
  next_action: z.string(),
});
export type LeadAnalysis = z.infer<typeof LeadAnalysis>;

export type Engine = "ai" | "demo" | "demo-fallback";

export const LeadStatus = z.enum(["new", "contacted", "won", "lost"]);
export type LeadStatus = z.infer<typeof LeadStatus>;

export type Lead = LeadInput &
  LeadAnalysis & {
    id: number;
    created_at: string;
    engine: Engine;
    status: LeadStatus;
  };
