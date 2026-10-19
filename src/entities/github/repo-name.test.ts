import { describe, expect, it } from "vitest";
import { isRepoFullName, sameRepo } from "./repo-name";

describe("isRepoFullName", () => {
  it.each(["vercel/next.js", "TanStack/query", "a-b/c_d.e"])("accepts %s", (name) => {
    expect(isRepoFullName(name)).toBe(true);
  });

  it.each(["vercel", "vercel/next.js/extra", "../etc/passwd", "a b/c", "", 42, null])(
    "rejects %s",
    (name) => {
      expect(isRepoFullName(name)).toBe(false);
    },
  );
});

describe("sameRepo", () => {
  it("compares case-insensitively", () => {
    expect(sameRepo("Vercel/Next.js", "vercel/next.js")).toBe(true);
    expect(sameRepo("vercel/next.js", "vercel/swr")).toBe(false);
  });
});
