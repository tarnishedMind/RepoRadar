import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { githubJson, githubText } from "./client";
import type {
  GitHubContributor,
  GitHubLanguages,
  GitHubRepo,
  GitHubUser,
} from "./types";

export * from "./types";
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
};

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
