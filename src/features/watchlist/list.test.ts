import { describe, expect, it } from "vitest";
import { WATCHLIST_LIMIT, toggleWatched } from "./list";

describe("toggleWatched", () => {
  it("adds a repo to the front", () => {
    expect(toggleWatched(["vercel/swr"], "vercel/next.js", true)).toEqual({
      ok: true,
      list: ["vercel/next.js", "vercel/swr"],
    });
  });

  it("moves an existing repo to the front without duplicating it, ignoring case", () => {
    expect(toggleWatched(["vercel/swr", "Vercel/Next.js"], "vercel/next.js", true)).toEqual({
      ok: true,
      list: ["vercel/next.js", "vercel/swr"],
    });
  });

  it("removes a repo, ignoring case", () => {
    expect(toggleWatched(["Vercel/Next.js", "vercel/swr"], "vercel/next.js", false)).toEqual({
      ok: true,
      list: ["vercel/swr"],
    });
  });

  it.each([
    ["an invalid name", "../etc/passwd", true],
    ["a non-string name", 42, true],
    ["a non-boolean flag", "vercel/next.js", "false"],
  ])("rejects %s and keeps the list", (_, fullName, watched) => {
    const list = ["vercel/swr"];
    expect(toggleWatched(list, fullName, watched)).toEqual({
      ok: false,
      error: "Invalid repository name",
      list,
    });
  });

  it("refuses to add past the limit but still allows removing", () => {
    const full = Array.from({ length: WATCHLIST_LIMIT }, (_, i) => `owner/repo${i}`);
    const added = toggleWatched(full, "vercel/next.js", true);
    expect(added.ok).toBe(false);
    expect(added.list).toBe(full);
    expect(toggleWatched(full, "owner/repo0", false)).toMatchObject({ ok: true });
  });
});
