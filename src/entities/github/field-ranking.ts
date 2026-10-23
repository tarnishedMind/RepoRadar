import type { GitHubRepo } from "./types";

/** How many repositories a field page shows. */
export const FIELD_TOP_N = 30;
/** A repository must have been pushed to within this many days to count as active. */
export const FIELD_ACTIVE_DAYS = 180;
/** Minimum stars, so a field isn't flooded with tiny or abandoned projects. */
export const FIELD_MIN_STARS = 200;

export type FieldRepo = GitHubRepo & {
  /** The field's topics this repository is tagged with, in the field's order. */
  matchedTopics: string[];
};

/** Search query for one topic of a field: active, not archived, with some traction. */
export function fieldTopicQuery(topic: string, now: Date): string {
  const since = new Date(now.getTime() - FIELD_ACTIVE_DAYS * 86_400_000).toISOString().slice(0, 10);
  return `topic:${topic} archived:false stars:>=${FIELD_MIN_STARS} pushed:>=${since}`;
}

/**
 * Merges one search result list per topic (`results[i]` belongs to `topics[i]`)
 * into a single ranking: deduplicated by id, most stars first (name breaks
 * ties so the order is stable), cut to `limit`.
 */
export function rankFieldRepos(
  topics: readonly string[],
  results: readonly (readonly GitHubRepo[])[],
  limit = FIELD_TOP_N,
): FieldRepo[] {
  const byId = new Map<number, FieldRepo>();
  results.forEach((repos, i) => {
    for (const repo of repos) {
      if (byId.has(repo.id)) continue;
      // A repo found through one topic may carry the field's other topics too.
      const own = new Set([...(repo.topics ?? []), topics[i]]);
      byId.set(repo.id, { ...repo, matchedTopics: topics.filter((t) => own.has(t)) });
    }
  });
  return [...byId.values()]
    .sort(
      (a, b) => b.stargazers_count - a.stargazers_count || a.full_name.localeCompare(b.full_name),
    )
    .slice(0, limit);
}
