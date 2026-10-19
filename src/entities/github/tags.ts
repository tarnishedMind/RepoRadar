import type { LanguageSlug, TrendingRange } from "./catalog";

/**
 * Cache tags for the cached GitHub reads, so they can be revalidated on demand
 * (see POST /api/revalidate). Always lowercase, `kind:id` form.
 */
export const tags = {
  repo: (owner: string, repo: string) =>
    `repo:${owner}/${repo}`.toLowerCase(),
  user: (login: string) => `user:${login}`.toLowerCase(),
  trending: (range?: TrendingRange) => (range ? `trending:${range}` : "trending"),
  leaderboard: (lang?: LanguageSlug) =>
    lang ? `leaderboard:${lang}` : "leaderboard",
};
