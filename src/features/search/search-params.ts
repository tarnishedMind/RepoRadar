import {
  SEARCH_MAX_RESULTS,
  SEARCH_PER_PAGE,
  SEARCH_SORTS,
  isLanguageSlug,
  type RepoSearchParams,
  type SearchSort,
} from "@/entities/github";

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

/**
 * Parses the `page` query param of /api/search. Missing or junk values mean
 * page 1; a page past GitHub's 1,000-result cap returns null.
 */
export function parseSearchPage(raw: string | null): number | null {
  const page = Math.max(1, Number.parseInt(raw ?? "1", 10) || 1);
  return page * SEARCH_PER_PAGE > SEARCH_MAX_RESULTS + SEARCH_PER_PAGE ? null : page;
}
