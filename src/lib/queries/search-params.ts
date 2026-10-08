import { isLanguageSlug, type LanguageSlug } from "@/lib/github/catalog";

export const SEARCH_SORTS = {
  "best-match": "Best match",
  stars: "Most stars",
  forks: "Most forks",
  updated: "Recently updated",
} as const;

export type SearchSort = keyof typeof SEARCH_SORTS;

export interface RepoSearchParams {
  q: string;
  sort: SearchSort;
  lang: LanguageSlug | "";
}

export const SEARCH_PER_PAGE = 30;
/** GitHub's search API never returns more than 1,000 results. */
export const SEARCH_MAX_RESULTS = 1000;

type RawParams =
  | URLSearchParams
  | Record<string, string | string[] | undefined>;

function read(raw: RawParams, key: string) {
  const value = raw instanceof URLSearchParams ? raw.get(key) : raw[key];
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

/**
 * Normalizes URL search params into a stable object. Server and client both use
 * this so their TanStack Query keys match and the server cache hydrates cleanly.
 */
export function parseSearchParams(raw: RawParams): RepoSearchParams {
  const sort = read(raw, "sort");
  const lang = read(raw, "lang");
  return {
    q: read(raw, "q").trim().slice(0, 200),
    sort: Object.hasOwn(SEARCH_SORTS, sort) ? (sort as SearchSort) : "best-match",
    lang: isLanguageSlug(lang) ? lang : "",
  };
}

/** Serializes params back to a query string, omitting defaults. */
export function toQueryString(params: RepoSearchParams, page?: number) {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  if (params.sort !== "best-match") sp.set("sort", params.sort);
  if (params.lang) sp.set("lang", params.lang);
  if (page) sp.set("page", String(page));
  return sp.toString();
}
