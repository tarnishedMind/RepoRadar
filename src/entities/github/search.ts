import type { LanguageSlug } from "./catalog";

/** Sort orders offered by GitHub's repository search, with display labels. */
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
