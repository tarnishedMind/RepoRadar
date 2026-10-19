import { describe, expect, it } from "vitest";
import { parseSearchPage, parseSearchParams, toQueryString } from "./search-params";

describe("parseSearchParams", () => {
  it("applies defaults for missing values", () => {
    expect(parseSearchParams({})).toEqual({ q: "", sort: "best-match", lang: "" });
  });

  it("reads from URLSearchParams and plain objects the same way", () => {
    const fromUrl = parseSearchParams(new URLSearchParams("q=react&sort=stars&lang=rust"));
    const fromObject = parseSearchParams({ q: "react", sort: "stars", lang: "rust" });
    expect(fromUrl).toEqual({ q: "react", sort: "stars", lang: "rust" });
    expect(fromObject).toEqual(fromUrl);
  });

  it("drops unknown sort and language values", () => {
    expect(parseSearchParams({ q: "x", sort: "random", lang: "cobol" })).toEqual({
      q: "x",
      sort: "best-match",
      lang: "",
    });
  });

  it("trims the query, caps its length and takes the first of repeated params", () => {
    expect(parseSearchParams({ q: ["  next  ", "ignored"] }).q).toBe("next");
    expect(parseSearchParams({ q: "a".repeat(500) }).q).toHaveLength(200);
  });
});

describe("toQueryString", () => {
  it("omits default values", () => {
    expect(toQueryString({ q: "react", sort: "best-match", lang: "" })).toBe("q=react");
  });

  it("includes the page when given", () => {
    expect(toQueryString({ q: "react", sort: "stars", lang: "go" }, 3)).toBe(
      "q=react&sort=stars&lang=go&page=3",
    );
  });

  it("round-trips through parseSearchParams", () => {
    const params = { q: "state management", sort: "updated", lang: "typescript" } as const;
    expect(parseSearchParams(new URLSearchParams(toQueryString(params)))).toEqual(params);
  });
});

describe("parseSearchPage", () => {
  it.each([
    [null, 1],
    ["", 1],
    ["abc", 1],
    ["-3", 1],
    ["2", 2],
    ["34", 34],
  ])("%s → %s", (raw, page) => {
    expect(parseSearchPage(raw)).toBe(page);
  });

  it("rejects pages past GitHub's 1,000-result cap", () => {
    expect(parseSearchPage("35")).toBeNull();
  });
});
