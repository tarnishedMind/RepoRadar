import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { githubJson, githubText } from "./client";
import { LANGUAGES, TRENDING_RANGES } from "./catalog";
import type { LanguageSlug, TrendingRange } from "./catalog";
import type {
  GitHubContributor,
  GitHubLanguages,
  GitHubRepo,
  GitHubSearchResult,
  GitHubUser,
} from "./types";

export * from "./types";
export * from "./catalog";
export { GitHubError, GitHubRateLimitError } from "./client";

/**
 * Cached GitHub queries. Each one uses `"use cache"` so results are shared across
 * requests and can be included in prerendered pages, and is tagged so it can be
 * revalidated on demand (see M2).
 */

export const tags = {
  repo: (owner: string, repo: string) =>
    `repo:${owner}/${repo}`.toLowerCase(),
  user: (login: string) => `user:${login}`.toLowerCase(),
  trending: (range?: TrendingRange) => (range ? `trending:${range}` : "trending"),
  leaderboard: (lang?: LanguageSlug) =>
    lang ? `leaderboard:${lang}` : "leaderboard",
};

async function searchRepos(q: string, perPage = 30) {
  const result = await githubJson<GitHubSearchResult<GitHubRepo>>(
    "/search/repositories",
    { searchParams: { q, sort: "stars", order: "desc", per_page: perPage } },
  );
  return result ?? { total_count: 0, incomplete_results: false, items: [] };
}

/**
 * "Trending" = the most-starred repositories created within the range.
 * Revalidated hourly (ISR); `fetchedAt` is baked into the cached result so the
 * page can show when it was last regenerated.
 */
export async function getTrendingRepos(range: TrendingRange) {
  "use cache";
  cacheLife("hours");
  cacheTag(tags.trending(), tags.trending(range));

  const since = new Date(Date.now() - TRENDING_RANGES[range].days * 86_400_000);
  const date = since.toISOString().slice(0, 10);
  const { items } = await searchRepos(`created:>${date}`);
  return { repos: items, since: date, fetchedAt: new Date().toISOString() };
}

/** All-time most-starred repositories for a language, revalidated daily. */
export async function getLanguageLeaderboard(lang: LanguageSlug) {
  "use cache";
  cacheLife("days");
  cacheTag(tags.leaderboard(), tags.leaderboard(lang));

  const { items, total_count } = await searchRepos(
    `language:"${LANGUAGES[lang]}"`,
    50,
  );
  return { repos: items, totalCount: total_count, fetchedAt: new Date().toISOString() };
}

export async function getRepo(owner: string, repo: string) {
  "use cache";
  cacheLife("hours");
  cacheTag(tags.repo(owner, repo));
  return githubJson<GitHubRepo>(`/repos/${owner}/${repo}`);
}

/** README rendered to HTML by GitHub (already sanitized on their side). */
export async function getRepoReadmeHtml(owner: string, repo: string) {
  "use cache";
  cacheLife("hours");
  cacheTag(tags.repo(owner, repo));
  return githubText(`/repos/${owner}/${repo}/readme`, {
    accept: "application/vnd.github.html+json",
  });
}

export async function getRepoLanguages(owner: string, repo: string) {
  "use cache";
  cacheLife("days");
  cacheTag(tags.repo(owner, repo));
  return githubJson<GitHubLanguages>(`/repos/${owner}/${repo}/languages`);
}

export async function getRepoContributors(owner: string, repo: string) {
  "use cache";
  cacheLife("days");
  cacheTag(tags.repo(owner, repo));
  return githubJson<GitHubContributor[]>(
    `/repos/${owner}/${repo}/contributors`,
    { searchParams: { per_page: 24 } },
  );
}

export async function getUser(login: string) {
  "use cache";
  cacheLife("hours");
  cacheTag(tags.user(login));
  return githubJson<GitHubUser>(`/users/${login}`);
}

export async function getUserRepos(login: string) {
  "use cache";
  cacheLife("hours");
  cacheTag(tags.user(login));
  return githubJson<GitHubRepo[]>(`/users/${login}/repos`, {
    searchParams: { sort: "pushed", per_page: 100, type: "owner" },
  });
}
