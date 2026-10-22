import {
  FIELDS,
  LANGUAGES,
  TRENDING_RANGES,
  type FieldSlug,
  type LanguageSlug,
  type TrendingRange,
} from "./catalog";

/**
 * Cache tags for the cached GitHub reads, so they can be revalidated on demand
 * (see POST /api/revalidate). Always lowercase, `kind:id` form.
 */
export const tags = {
  repo: (owner: string, repo: string) => `repo:${owner}/${repo}`.toLowerCase(),
  user: (login: string) => `user:${login}`.toLowerCase(),
  trending: (range?: TrendingRange) => (range ? `trending:${range}` : "trending"),
  leaderboard: (lang?: LanguageSlug) => (lang ? `leaderboard:${lang}` : "leaderboard"),
  field: (field?: FieldSlug) => (field ? `field:${field}` : "field"),
};

const keys = (catalog: object) => Object.keys(catalog).join("|");

/** Every tag `tags.*` can produce. Derived from the catalogs so the two can't drift. */
const TAG_PATTERN = new RegExp(
  `^(trending(:(${keys(TRENDING_RANGES)}))?|leaderboard(:(${keys(LANGUAGES)}))?|field(:(${keys(FIELDS)}))?|repo:[\\w.-]+\\/[\\w.-]+|user:[\\w-]+)$`,
);

/**
 * Validates the body of POST /api/revalidate: `{ tags: string[] }` with known
 * tags only (lowercased like `tags.*`). Returns null if anything is off.
 */
export function parseRevalidateTags(body: unknown): string[] | null {
  const raw = typeof body === "object" && body !== null && "tags" in body ? body.tags : undefined;
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const valid = raw
    .filter((t): t is string => typeof t === "string")
    .map((t) => t.toLowerCase())
    .filter((t) => TAG_PATTERN.test(t));
  return valid.length === raw.length ? valid : null;
}
