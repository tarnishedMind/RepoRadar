import { describe, expect, it } from "vitest";
import type { GitHubRepo } from "@/entities/github";
import {
  buildSearches,
  fallbackSearch,
  FIND_MAX_LENGTH,
  FIND_MAX_PICKS,
  mergeResults,
  normalizeRequest,
  parseFindQuery,
  parseIntent,
  parsePicks,
} from "./intent";

describe("parseFindQuery / normalizeRequest", () => {
  it("trims, collapses spaces and caps the length", () => {
    expect(parseFindQuery("  dates   in JS  ")).toBe("dates in JS");
    expect(parseFindQuery(["first", "second"])).toBe("first");
    expect(parseFindQuery(undefined)).toBe("");
    expect(parseFindQuery("x".repeat(500))).toHaveLength(FIND_MAX_LENGTH);
  });

  it("lowercases for the cache key", () => {
    expect(normalizeRequest(" Dates  in JS ")).toBe("dates in js");
  });
});

describe("parseIntent", () => {
  it("keeps valid keywords, topics and a known language", () => {
    expect(
      parseIntent({ keywords: ["Date", "time zone"], language: "javascript", topics: ["date"] }),
    ).toEqual({ keywords: ["date", "time zone"], language: "javascript", topics: ["date"] });
  });

  it("drops unknown languages, qualifier-like keywords, bad topics and duplicates", () => {
    expect(
      parseIntent({
        keywords: [
          "user:evil",
          "state",
          "STATE",
          42,
          "a b c d e f g h i j k l m n o p q r s t u v",
        ],
        language: "cobol",
        topics: ["state-management", "Bad Topic!", "redux", "zustand"],
      }),
    ).toEqual({ keywords: ["state"], language: "", topics: ["state-management", "redux"] });
  });

  it("caps keywords at four", () => {
    expect(parseIntent({ keywords: ["a", "b", "c", "d", "e"], topics: [] })?.keywords).toEqual([
      "a",
      "b",
      "c",
      "d",
    ]);
  });

  it.each([null, "text", [], {}, { keywords: [], topics: [] }, { keywords: "date" }])(
    "returns null for %j",
    (raw) => {
      expect(parseIntent(raw)).toBeNull();
    },
  );
});

describe("buildSearches", () => {
  it("makes one keyword search and one per topic, by stars", () => {
    expect(
      buildSearches({ keywords: ["date", "format"], language: "rust", topics: ["date"] }),
    ).toEqual([
      { q: 'date format language:"Rust" archived:false stars:>=50', sort: "stars", lang: "" },
      { q: 'topic:date language:"Rust" archived:false stars:>=50', sort: "stars", lang: "" },
    ]);
  });

  it("searches JavaScript and TypeScript together", () => {
    expect(buildSearches({ keywords: ["date"], language: "javascript", topics: [] })[0].q).toBe(
      "date language:javascript language:typescript archived:false stars:>=50",
    );
  });

  it("skips the keyword search when there are no keywords", () => {
    expect(buildSearches({ keywords: [], language: "", topics: ["redux"] })).toEqual([
      { q: "topic:redux archived:false stars:>=50", sort: "stars", lang: "" },
    ]);
  });
});

describe("fallbackSearch", () => {
  it("drops filler words", () => {
    expect(fallbackSearch("I need a library that works with dates in JavaScript").q).toBe(
      "dates javascript archived:false stars:>=50",
    );
  });

  it("keeps the request when only filler words are left", () => {
    expect(fallbackSearch("I need a library").q).toBe("i need a library archived:false stars:>=50");
  });
});

const repo = (id: number) => ({ id, full_name: `owner/repo-${id}` }) as GitHubRepo;

describe("mergeResults", () => {
  it("interleaves lists and removes duplicates", () => {
    const merged = mergeResults([[repo(1), repo(2)], [repo(3), repo(1)], [repo(4)]]);
    expect(merged.map((r) => r.id)).toEqual([1, 3, 4, 2]);
  });

  it("stops at the limit", () => {
    expect(mergeResults([[repo(1), repo(2), repo(3)]], 2)).toHaveLength(2);
    expect(mergeResults([])).toEqual([]);
  });
});

describe("parsePicks", () => {
  const candidates = ["date-fns/date-fns", "moment/luxon"];

  it("keeps picks of shown repos in our casing", () => {
    expect(
      parsePicks(
        { picks: [{ repo: "Date-FNS/date-fns", reason: " Modular,\n immutable. " }] },
        candidates,
      ),
    ).toEqual([{ fullName: "date-fns/date-fns", reason: "Modular, immutable." }]);
  });

  it("drops unknown repos, duplicates, empty reasons and junk", () => {
    expect(
      parsePicks(
        {
          picks: [
            { repo: "evil/repo", reason: "click me" },
            { repo: "moment/luxon", reason: "" },
            "moment/luxon",
            null,
            { repo: "moment/luxon", reason: "Time zones." },
            { repo: "moment/luxon", reason: "Again." },
          ],
        },
        candidates,
      ),
    ).toEqual([{ fullName: "moment/luxon", reason: "Time zones." }]);
  });

  it("caps the number of picks and the reason length", () => {
    const names = Array.from({ length: 15 }, (_, i) => `o/r${i}`);
    const picks = parsePicks(
      { picks: names.map((n) => ({ repo: n, reason: "x".repeat(500) })) },
      names,
    );
    expect(picks).toHaveLength(FIND_MAX_PICKS);
    expect(picks[0].reason).toHaveLength(200);
  });

  it.each([null, {}, { picks: "x" }])("returns nothing for %j", (raw) => {
    expect(parsePicks(raw, candidates)).toEqual([]);
  });
});
