import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GitHubError, GitHubRateLimitError, githubJson, githubText } from "./client";

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
    ...init,
  });
}

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("GITHUB_TOKEN", "");
});

afterEach(() => {
  fetchMock.mockReset();
  vi.useRealTimers();
});

describe("githubJson", () => {
  it("returns parsed JSON and calls the GitHub REST API", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ full_name: "vercel/next.js" }));

    await expect(githubJson("/repos/vercel/next.js")).resolves.toEqual({
      full_name: "vercel/next.js",
    });
    const [url] = fetchMock.mock.calls[0];
    expect(String(url)).toBe("https://api.github.com/repos/vercel/next.js");
  });

  it("adds query parameters", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse([]));
    await githubJson("/users/torvalds/repos", { searchParams: { per_page: 100, sort: "pushed" } });
    expect(String(fetchMock.mock.calls[0][0])).toBe(
      "https://api.github.com/users/torvalds/repos?per_page=100&sort=pushed",
    );
  });

  it("sends the token only when GITHUB_TOKEN is set", async () => {
    fetchMock.mockImplementation(async () => jsonResponse({}));

    await githubJson("/users/a");
    const anonymous = new Headers(fetchMock.mock.calls[0][1]?.headers);
    expect(anonymous.has("authorization")).toBe(false);

    vi.stubEnv("GITHUB_TOKEN", "test-token");
    await githubJson("/users/a");
    const authed = new Headers(fetchMock.mock.calls[1][1]?.headers);
    expect(authed.get("authorization")).toBe("Bearer test-token");
  });

  it("resolves to null on 404 so pages can call notFound()", async () => {
    fetchMock.mockResolvedValueOnce(new Response("Not Found", { status: 404 }));
    await expect(githubJson("/repos/nope/nope")).resolves.toBeNull();
  });

  it("treats 204 No Content as an empty list", async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));
    await expect(githubJson("/repos/a/b/contributors")).resolves.toEqual([]);
  });

  it("throws GitHubRateLimitError when the primary limit is exhausted", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response("rate limited", {
        status: 403,
        headers: { "x-ratelimit-remaining": "0", "x-ratelimit-reset": "1800000000" },
      }),
    );

    const error = await githubJson("/users/a").catch((e: unknown) => e);
    expect(error).toBeInstanceOf(GitHubRateLimitError);
    expect((error as GitHubRateLimitError).resetAt?.toISOString()).toBe(
      new Date(1_800_000_000 * 1000).toISOString(),
    );
  });

  it("retries a secondary rate limit and then succeeds", async () => {
    vi.useFakeTimers();
    fetchMock
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ message: "You have exceeded a secondary rate limit." }), {
          status: 403,
          headers: { "x-ratelimit-remaining": "10" },
        }),
      )
      .mockResolvedValueOnce(jsonResponse({ total_count: 0, items: [] }));

    const promise = githubJson("/search/repositories", { searchParams: { q: "x" } });
    await vi.advanceTimersByTimeAsync(2000);
    await expect(promise).resolves.toEqual({ total_count: 0, items: [] });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("gives up on a secondary rate limit after three attempts", async () => {
    vi.useFakeTimers();
    fetchMock.mockImplementation(async () =>
      new Response("You have exceeded a secondary rate limit", { status: 403 }),
    );

    const promise = githubJson("/search/repositories").catch((e: unknown) => e);
    await vi.advanceTimersByTimeAsync(2000 + 4000);
    expect(await promise).toBeInstanceOf(GitHubRateLimitError);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("throws GitHubError with the status for other failures", async () => {
    fetchMock.mockResolvedValueOnce(new Response("boom", { status: 500, statusText: "Server Error" }));

    const error = await githubJson("/users/a").catch((e: unknown) => e);
    expect(error).toBeInstanceOf(GitHubError);
    expect(error).not.toBeInstanceOf(GitHubRateLimitError);
    expect((error as GitHubError).status).toBe(500);
  });

  it("runs search requests one at a time", async () => {
    let inFlight = 0;
    let maxInFlight = 0;
    fetchMock.mockImplementation(async () => {
      inFlight++;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await new Promise((r) => setTimeout(r, 5));
      inFlight--;
      return jsonResponse({ items: [] });
    });

    await Promise.all([
      githubJson("/search/repositories", { searchParams: { q: "a" } }),
      githubJson("/search/repositories", { searchParams: { q: "b" } }),
      githubJson("/search/repositories", { searchParams: { q: "c" } }),
    ]);
    expect(maxInFlight).toBe(1);
  });
});

describe("githubText", () => {
  it("passes the Accept header and returns the body as text", async () => {
    fetchMock.mockResolvedValueOnce(new Response("<h1>README</h1>"));

    await expect(
      githubText("/repos/a/b/readme", { accept: "application/vnd.github.html+json" }),
    ).resolves.toBe("<h1>README</h1>");
    const headers = new Headers(fetchMock.mock.calls[0][1]?.headers);
    expect(headers.get("accept")).toBe("application/vnd.github.html+json");
  });
});
