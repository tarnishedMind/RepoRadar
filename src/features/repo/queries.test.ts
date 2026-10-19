import { describe, expect, it } from "vitest";
import { repoQueryKey } from "./queries";

describe("repoQueryKey", () => {
  it("is case-insensitive like GitHub", () => {
    expect(repoQueryKey("Vercel", "Next.js")).toEqual(repoQueryKey("vercel", "next.js"));
  });
});
