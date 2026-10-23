import { describe, expect, it } from "vitest";
import { parseRevalidateTags, tags } from "./tags";

describe("tags", () => {
  it("lowercases ids", () => {
    expect(tags.repo("Vercel", "Next.js")).toBe("repo:vercel/next.js");
    expect(tags.user("Torvalds")).toBe("user:torvalds");
  });

  it("has a broad and a specific tag for lists", () => {
    expect(tags.trending()).toBe("trending");
    expect(tags.trending("daily")).toBe("trending:daily");
    expect(tags.leaderboard("rust")).toBe("leaderboard:rust");
    expect(tags.field("ai-ml")).toBe("field:ai-ml");
  });
});

describe("parseRevalidateTags", () => {
  it("accepts every tag kind tags.* produces", () => {
    const all = [
      tags.trending(),
      tags.trending("weekly"),
      tags.leaderboard(),
      tags.leaderboard("typescript"),
      tags.field(),
      tags.field("frontend"),
      tags.repo("vercel", "next.js"),
      tags.user("torvalds"),
    ];
    expect(parseRevalidateTags({ tags: all })).toEqual(all);
  });

  it("lowercases input", () => {
    expect(parseRevalidateTags({ tags: ["REPO:Vercel/Next.js"] })).toEqual(["repo:vercel/next.js"]);
  });

  it.each([
    ["no body", null],
    ["a non-object", "trending"],
    ["missing tags", {}],
    ["an empty list", { tags: [] }],
    ["a non-array", { tags: "trending" }],
    ["a non-string tag", { tags: ["trending", 1] }],
    ["an unknown kind", { tags: ["everything"] }],
    ["an unknown range", { tags: ["trending:yearly"] }],
    ["an unknown language", { tags: ["leaderboard:cobol"] }],
    ["an unknown field", { tags: ["field:fullstack"] }],
  ])("rejects %s", (_, body) => {
    expect(parseRevalidateTags(body)).toBeNull();
  });
});
