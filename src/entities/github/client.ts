import "server-only";

import { env } from "@/shared/config/env";

const GITHUB_API = "https://api.github.com";

export class GitHubError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "GitHubError";
  }
}

export class GitHubRateLimitError extends GitHubError {
  constructor(readonly resetAt: Date | null) {
    super(
      `GitHub API rate limit exceeded${resetAt ? `, resets at ${resetAt.toISOString()}` : ""}.${env.githubToken() ? "" : " Set GITHUB_TOKEN to raise the limit."}`,
      403,
    );
    this.name = "GitHubRateLimitError";
  }
}

type GitHubFetchOptions = {
  /** Media type for the `Accept` header, e.g. `application/vnd.github.html+json`. */
  accept?: string;
  searchParams?: Record<string, string | number>;
};

function buildHeaders(accept: string): HeadersInit {
  const headers: Record<string, string> = {
    Accept: accept,
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "RepoRadar",
  };
  const token = env.githubToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

/**
 * GitHub's search API has a "secondary" rate limit that trips on bursts of
 * concurrent requests (e.g. `next build` prerendering every leaderboard at
 * once). Run search requests one at a time per server process.
 */
let searchQueue: Promise<unknown> = Promise.resolve();
function serialize<T>(task: () => Promise<T>): Promise<T> {
  const run = searchQueue.then(task, task);
  searchQueue = run.catch(() => undefined);
  return run;
}

async function send(url: URL, accept: string, attempt = 1): Promise<Response> {
  const res = await fetch(url, { headers: buildHeaders(accept) });
  if (res.status !== 403 && res.status !== 429) return res;

  const retryAfter = res.headers.get("retry-after");
  const reset = res.headers.get("x-ratelimit-reset");
  const primaryExhausted = res.headers.get("x-ratelimit-remaining") === "0";
  // Secondary limits come without Retry-After at times; the body says so.
  const secondary = !primaryExhausted && /secondary rate limit/i.test(await res.clone().text());

  if (secondary && attempt < 3) {
    // Back off briefly and try again (2s, then 4s).
    await new Promise((r) => setTimeout(r, 2000 * attempt));
    return send(url, accept, attempt + 1);
  }
  if (primaryExhausted || secondary || retryAfter) {
    throw new GitHubRateLimitError(
      retryAfter
        ? new Date(Date.now() + Number(retryAfter) * 1000)
        : reset
          ? new Date(Number(reset) * 1000)
          : null,
    );
  }
  return res;
}

async function request(path: string, options: GitHubFetchOptions) {
  const url = new URL(path, GITHUB_API);
  for (const [key, value] of Object.entries(options.searchParams ?? {})) {
    url.searchParams.set(key, String(value));
  }

  const accept = options.accept ?? "application/vnd.github+json";
  const res = await (path.startsWith("/search/")
    ? serialize(() => send(url, accept))
    : send(url, accept));

  if (res.status === 404) return null;

  if (!res.ok) {
    throw new GitHubError(
      `GitHub API ${res.status} ${res.statusText} for ${url.pathname}`,
      res.status,
    );
  }

  return res;
}

/**
 * Fetches JSON from the GitHub REST API.
 * Resolves to `null` on 404 so callers can decide to render `notFound()`;
 * throws on rate limiting and other errors.
 */
export async function githubJson<T>(
  path: string,
  options: GitHubFetchOptions = {},
): Promise<T | null> {
  const res = await request(path, options);
  if (!res) return null;
  // 204 No Content, e.g. contributors of an empty repository.
  if (res.status === 204) return [] as T;
  return (await res.json()) as T;
}

/** Fetches a text representation, e.g. a README rendered to HTML by GitHub. */
export async function githubText(
  path: string,
  options: GitHubFetchOptions = {},
): Promise<string | null> {
  const res = await request(path, options);
  return res ? res.text() : null;
}
