import "server-only";

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
      `GitHub API rate limit exceeded${resetAt ? `, resets at ${resetAt.toISOString()}` : ""}. Set GITHUB_TOKEN to raise the limit.`,
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
  const token = process.env.GITHUB_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function request(path: string, options: GitHubFetchOptions) {
  const url = new URL(path, GITHUB_API);
  for (const [key, value] of Object.entries(options.searchParams ?? {})) {
    url.searchParams.set(key, String(value));
  }

  const res = await fetch(url, {
    headers: buildHeaders(options.accept ?? "application/vnd.github+json"),
  });

  if (res.status === 404) return null;

  if (
    (res.status === 403 || res.status === 429) &&
    res.headers.get("x-ratelimit-remaining") === "0"
  ) {
    const reset = res.headers.get("x-ratelimit-reset");
    throw new GitHubRateLimitError(
      reset ? new Date(Number(reset) * 1000) : null,
    );
  }

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
