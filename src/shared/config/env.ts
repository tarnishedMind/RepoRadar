import "server-only";

/**
 * The only place server-only environment variables are read (ADR 0005).
 * Values are read on every call, not at import time, so tests can use
 * `vi.stubEnv`. An empty string (as in a copied `.env.example`) counts as unset.
 */
function read(name: string): string | undefined {
  return process.env[name] || undefined;
}

export const env = {
  /** Optional: raises GitHub's rate limit from 60 to 5,000 requests an hour. */
  githubToken: () => read("GITHUB_TOKEN"),
  /** Required for POST /api/revalidate; without it the endpoint rejects every call. */
  revalidateSecret: () => read("REVALIDATE_SECRET"),
  /** Optional: Groq key for /find. Without it /find falls back to keyword search. */
  groqApiKey: () => read("GROQ_API_KEY"),
  /** Kill switch for the AI part of /find; anything but "false" keeps it on. */
  findAiEnabled: () => read("FIND_AI_ENABLED") !== "false",
};
