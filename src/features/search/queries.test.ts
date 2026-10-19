import { describe, expect, it } from "vitest";
import { SEARCH_PER_PAGE, type GitHubRepo } from "@/entities/github";
import { searchQueryKey, searchReposInfiniteOptions, type SearchPage } from "./queries";

const params = { q: "react", sort: "stars", lang: "" } as const;
const options = searchReposInfiniteOptions(params);

function page(n: number, items: number, totalCount: number): SearchPage {
  return { page: n, totalCount, items: Array.from({ length: items }, () => ({}) as GitHubRepo) };
}

function next(last: SearchPage) {
  return options.getNextPageParam(last, [last], last.page, [last.page]);
}

describe("searchReposInfiniteOptions", () => {
  it("uses the shared query key so server prefetch and client agree", () => {
    expect(options.queryKey).toEqual(searchQueryKey(params));
    expect(options.queryKey).toEqual(["search", { q: "react", sort: "stars", lang: "" }]);
  });

  it("is disabled until there is a query", () => {
    expect(options.enabled).toBe(true);
    expect(searchReposInfiniteOptions({ ...params, q: "" }).enabled).toBe(false);
  });

  it("asks for the next page while more results exist", () => {
    expect(next(page(1, SEARCH_PER_PAGE, 500))).toBe(2);
  });

  it("stops when the last page is short", () => {
    expect(next(page(2, 12, 42))).toBeUndefined();
  });

  it("stops at GitHub's 1,000 result cap", () => {
    expect(next(page(33, SEARCH_PER_PAGE, 250_000))).toBe(34);
    expect(next(page(34, SEARCH_PER_PAGE, 250_000))).toBeUndefined();
  });
});
