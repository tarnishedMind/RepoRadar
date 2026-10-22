import "server-only";

import { env } from "@/shared/config/env";

/**
 * Minimal Groq client. Groq's API is OpenAI-compatible, so plain `fetch` is
 * enough (no SDK). Server-only because it reads GROQ_API_KEY.
 */

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
/** Free-plan model with strict JSON-schema output. */
export const GROQ_MODEL = "openai/gpt-oss-20b";

export class GroqError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "GroqError";
  }
}

export interface JsonSchema {
  name: string;
  schema: Record<string, unknown>;
}

/**
 * One chat completion constrained to a JSON schema. Resolves to the parsed
 * JSON, which is still untrusted (ADR 0008): callers validate it. Throws
 * GroqError on a missing key, HTTP errors (429 = quota) and empty answers.
 */
export async function groqJson(
  system: string,
  user: string,
  { name, schema }: JsonSchema,
  maxTokens: number,
): Promise<unknown> {
  const key = env.groqApiKey();
  if (!key) throw new GroqError("GROQ_API_KEY is not set", 401);

  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0,
      reasoning_effort: "low",
      include_reasoning: false,
      // Reasoning tokens may count here too, so leave headroom over the answer size.
      max_completion_tokens: maxTokens,
      response_format: { type: "json_schema", json_schema: { name, strict: true, schema } },
    }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new GroqError(`Groq API ${res.status} ${res.statusText}`, res.status);

  const body = (await res.json()) as { choices?: { message?: { content?: unknown } }[] };
  const content = body.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content) throw new GroqError("Groq returned no content", 502);
  try {
    return JSON.parse(content) as unknown;
  } catch {
    throw new GroqError("Groq returned invalid JSON", 502);
  }
}
