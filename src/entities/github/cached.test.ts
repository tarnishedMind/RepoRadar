import { beforeEach, describe, expect, it, vi } from "vitest";

// "use cache" is just a string outside a Next build; only the cache APIs and
// the HTTP layer need replacing.
const cache = vi.hoisted(() => ({ cacheLife: vi.fn(), cacheTag: vi.fn() }));
vi.mock("next/cache", () => cache);

const http = vi.hoisted(() => ({ githubJson: vi.fn(), githubText: vi.fn() }));
vi.mock("./client", () => http);

const {
  getLanguageLeaderboard,
  getRepo,
  getRepoContributors,
  getRepoReadmeHtml,
  getTrendingRepos,
  getUserRepos,
  searchRepositories,
} = await import("./cached");

const empty = { total_count: 0, incomplete_results: false, items: [] };

beforeEach(() => {
  http.githubJson.mockReset().mockResolvedValue(empty);
  http.githubText.mockReset().mockResolvedValue("<p>readme</p>");
});

/** The `searchParams` the last githubJson call sent to GitHub. */
const lastSearchParams = () => http.githubJson.mock.lastCall?.[1]?.searchParams;

describe("getTrendingRepos", () => {
  it("searches repos created since the start of the range, by stars", async () => {
    vi.useFakeTimers({ now: new Date("2026-10-19T12:00:00Z") });
    const result = await getTrendingRepos("weekly");
    vi.useRealTimers();

    expect(http.githubJson).toHaveBeenCalledWith("/search/repositories", expect.anything());
    expect(lastSearchParams()).toMatchObject({
      q: "created:>2026-10-12",
      sort: "stars",
      order: "desc",
    });
    expect(result).toMatchObject({ repos: [], since: "2026-10-12" });
    expect(cache.cacheLife).toHaveBeenCalledWith("hours");
    expect(cache.cacheTag).toHaveBeenCalledWith("trending", "trending:weekly");
  });
});

describe("getLanguageLeaderboard", () => {
  it("queries the language by display name and returns the total", async () => {
    http.githubJson.mockResolvedValueOnce({ ...empty, total_count: 1234 });
    const result = await getLanguageLeaderboard("cpp");

    expect(lastSearchParams()).toMatchObject({ q: 'language:"C++"', per_page: 50 });
    expect(result.totalCount).toBe(1234);
    expect(cache.cacheLife).toHaveBeenCalledWith("days");
    expect(cache.cacheTag).toHaveBeenCalledWith("leaderboard", "leaderboard:cpp");
  });
});

describe("searchRepositories", () => {
  it("omits sort and order for best match", async () => {
    await searchRepositories({ q: "react", sort: "best-match", lang: "" }, 2);
    expect(lastSearchParams()).toEqual({ q: "react", per_page: 30, page: 2 });
  });

  it("adds the language qualifier and sort", async () => {
    await searchRepositories({ q: "cli", sort: "forks", lang: "rust" }, 1);
    expect(lastSearchParams()).toMatchObject({
      q: 'cli language:"Rust"',
      sort: "forks",
      order: "desc",
    });
  });

  it("returns an empty page when GitHub returns nothing", async () => {
    http.githubJson.mockResolvedValueOnce(null);
    await expect(searchRepositories({ q: "x", sort: "stars", lang: "" }, 3)).resolves.toEqual({
      items: [],
      totalCount: 0,
      page: 3,
    });
  });
});

describe("repo and user reads", () => {
  it("tag every read with its repo or user", async () => {
    await getRepo("Vercel", "Next.js");
    expect(http.githubJson).toHaveBeenLastCalledWith("/repos/Vercel/Next.js");
    expect(cache.cacheTag).toHaveBeenLastCalledWith("repo:vercel/next.js");

    await getUserRepos("Torvalds");
    expect(cache.cacheTag).toHaveBeenLastCalledWith("user:torvalds");
  });

  it("asks GitHub to render the README as HTML", async () => {
    await expect(getRepoReadmeHtml("vercel", "next.js")).resolves.toBe("<p>readme</p>");
    expect(http.githubText).toHaveBeenCalledWith("/repos/vercel/next.js/readme", {
      accept: "application/vnd.github.html+json",
    });
  });

  it("limits contributors to 24", async () => {
    await getRepoContributors("vercel", "next.js");
    expect(lastSearchParams()).toEqual({ per_page: 24 });
  });
});
