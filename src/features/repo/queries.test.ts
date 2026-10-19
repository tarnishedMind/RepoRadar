import { describe, expect, it, vi } from "vitest";
import { repoQueryKey, repoQueryOptions } from "./queries";

describe("repoQueryKey", () => {
  it("is case-insensitive like GitHub", () => {
    expect(repoQueryKey("Vercel", "Next.js")).toEqual(repoQueryKey("vercel", "next.js"));
  });
});

describe("repoQueryOptions", () => {
  it("fetches our Route Handler with URL-encoded segments", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ id: 1 }));
    vi.stubGlobal("fetch", fetchMock);
    const { queryFn } = repoQueryOptions("a b", "c#d");

    // queryFn only reads `signal` from its context.
    await expect(queryFn!({ signal: undefined } as never)).resolves.toEqual({ id: 1 });
    expect(fetchMock).toHaveBeenCalledWith("/api/repos/a%20b/c%23d", { signal: undefined });
  });
});
