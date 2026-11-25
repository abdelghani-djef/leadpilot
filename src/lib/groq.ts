import "server-only";

// Calls Groq's OpenAI-compatible chat API (same setup as the linguacards project).
// Model ids and parameters follow Groq's docs as checked on 2026-11-14:
// https://console.groq.com/docs/models and https://console.groq.com/docs/deprecations

export const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

/** How long one Groq call may take before it counts as failed. */
const GROQ_TIMEOUT_MS = 25_000;

export type ModelSpec = {
  id: string;
  /** gpt-oss accepts low/medium/high (reasoning can't be switched off); Qwen 3.8 accepts "none". */
  reasoningEffort?: "none" | "low" | "medium" | "high";
  /** gpt-oss only: leave the reasoning text out of the reply (it is still generated and counted). */
  hideReasoning?: boolean;
  /** Leaves room for reasoning tokens too, or the JSON gets cut off. */
  maxTokens: number;
};

// A primary model and a fallback. Free-tier quotas are per model, so when one is used up
// or rate limited, the other answers.
export const LEAD_MODELS: ModelSpec[] = [
  { id: "openai/gpt-oss-120b", reasoningEffort: "low", hideReasoning: true, maxTokens: 2048 },
  // Preview model: Groq may retire it at short notice, which then fails over like a 404.
  { id: "qwen/qwen3.8-27b", reasoningEffort: "none", maxTokens: 1500 },
];

export type ChatMessage = { role: "system" | "user"; content: string };

export type ChatRequest = {
  messages: ChatMessage[];
  /** JSON schema the reply must follow (strict mode: every property required, no extra ones). */
  schema: { name: string; schema: Record<string, unknown> };
  temperature: number;
  /** Opaque visitor id for Groq's abuse monitoring; never personal data. */
  user: string;
};

/** Why a Groq call gave nothing usable. */
export class GroqFailure extends Error {
  constructor(readonly kind: "busy" | "upstream" | "no-key") {
    super(`Groq call failed: ${kind}`);
    this.name = "GroqFailure";
  }
}

export type ChatReply = {
  /** The reply's text (a JSON string, since a schema is given), or null if it had none. */
  content: string | null;
  /** "length" means the token limit cut the reply off. */
  finishReason: string | null;
  /** Index in the model list of the model that answered, so a retry can start after it. */
  modelIndex: number;
  model: string;
};

function chatBody(model: ModelSpec, req: ChatRequest): Record<string, unknown> {
  return {
    model: model.id,
    messages: req.messages,
    temperature: req.temperature,
    max_completion_tokens: model.maxTokens,
    ...(model.reasoningEffort ? { reasoning_effort: model.reasoningEffort } : {}),
    ...(model.hideReasoning ? { include_reasoning: false } : {}),
    stream: false,
    user: req.user,
    response_format: {
      type: "json_schema",
      json_schema: { name: req.schema.name, strict: true, schema: req.schema.schema },
    },
  };
}

type GroqErrorBody = { error?: { code?: unknown } } | null;

/** True when the model is gone or unknown, so the fallback model should answer instead. */
function modelGone(status: number, body: GroqErrorBody): boolean {
  if (status === 404) return true;
  const code = typeof body?.error?.code === "string" ? body.error.code : "";
  return code === "model_decommissioned" || code === "model_not_found";
}

/**
 * Sends the request to `models[start]`, moving to the next model when Groq is rate limited
 * (quotas are per model), the model is gone, or Groq has a server error. Throws GroqFailure.
 */
export async function groqChat(models: ModelSpec[], req: ChatRequest, start = 0): Promise<ChatReply> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new GroqFailure("no-key");

  let busy = false;
  for (let i = start; i < models.length; i++) {
    const model = models[i];
    let response: Response;
    try {
      response = await fetch(GROQ_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify(chatBody(model, req)),
        signal: AbortSignal.timeout(GROQ_TIMEOUT_MS),
      });
    } catch {
      // Timeout or network failure. Not retried: the visitor has already waited long enough.
      console.warn(`[leadpilot] groq ${model.id}: no response`);
      throw new GroqFailure("upstream");
    }

    if (response.ok) {
      const data = (await response.json().catch(() => null)) as {
        choices?: { message?: { content?: unknown }; finish_reason?: unknown }[];
      } | null;
      const choice = data?.choices?.[0];
      return {
        content: typeof choice?.message?.content === "string" ? choice.message.content : null,
        finishReason: typeof choice?.finish_reason === "string" ? choice.finish_reason : null,
        modelIndex: i,
        model: model.id,
      };
    }

    const body = (await response.json().catch(() => null)) as GroqErrorBody;
    console.warn(`[leadpilot] groq ${model.id}: HTTP ${response.status} ${response.headers.get("x-request-id") ?? ""}`.trim());

    if (response.status === 429) {
      busy = true;
      continue;
    }
    if (modelGone(response.status, body) || response.status >= 500) continue;
    // 400/401/403/413/422 and the like: the request or the key is wrong; another model won't help.
    throw new GroqFailure("upstream");
  }

  throw new GroqFailure(busy ? "busy" : "upstream");
}
