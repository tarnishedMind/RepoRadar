import { beforeEach, describe, expect, it, vi } from "vitest";

const cookieStore = { get: vi.fn(), set: vi.fn() };
vi.mock("next/headers", () => ({ cookies: async () => cookieStore }));

const { WATCHLIST_LIMIT, isRepoFullName, readWatchlist, sameRepo, writeWatchlist } =
  await import("./watchlist");

beforeEach(() => {
  cookieStore.get.mockReset();
  cookieStore.set.mockReset();
});

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

describe("readWatchlist", () => {
  it("returns an empty list without a cookie", async () => {
    cookieStore.get.mockReturnValue(undefined);
    await expect(readWatchlist()).resolves.toEqual([]);
  });

  it("ignores malformed JSON and invalid entries", async () => {
    cookieStore.get.mockReturnValue({ value: "{not json" });
    await expect(readWatchlist()).resolves.toEqual([]);

    cookieStore.get.mockReturnValue({
      value: JSON.stringify(["vercel/next.js", "bad", 7, "TanStack/query"]),
    });
    await expect(readWatchlist()).resolves.toEqual(["vercel/next.js", "TanStack/query"]);
  });

  it("caps the list at the limit", async () => {
    const many = Array.from({ length: WATCHLIST_LIMIT + 10 }, (_, i) => `owner/repo${i}`);
    cookieStore.get.mockReturnValue({ value: JSON.stringify(many) });
    await expect(readWatchlist()).resolves.toHaveLength(WATCHLIST_LIMIT);
  });
});

describe("writeWatchlist", () => {
  it("stores JSON in an httpOnly, lax cookie", async () => {
    await writeWatchlist(["vercel/next.js"]);
    expect(cookieStore.set).toHaveBeenCalledWith(
      "watchlist",
      '["vercel/next.js"]',
      expect.objectContaining({ httpOnly: true, sameSite: "lax", path: "/" }),
    );
  });
});
