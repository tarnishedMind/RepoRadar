import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { proxy } from "./proxy";

const run = (path: string, method = "GET") =>
  proxy(new NextRequest(new URL(path, "https://reporadar.test"), { method }));

describe("proxy redirects", () => {
  it.each([
    ["/vercel/next.js.git", "/vercel/next.js"],
    ["/vercel/next.js/tree/canary/docs", "/vercel/next.js"],
    ["/vercel/next.js/issues/123", "/vercel/next.js"],
    ["/github.com/vercel/next.js", "/vercel/next.js"],
    ["/https:/github.com/vercel/next.js/pulls", "/vercel/next.js"],
    ["/torvalds", "/u/torvalds"],
  ])("%s → %s", (from, to) => {
    const res = run(from);
    expect(res.status).toBe(308);
    expect(new URL(res.headers.get("location")!).pathname).toBe(to);
  });
});

describe("proxy pass-through", () => {
  it.each(["/", "/vercel/next.js", "/u/torvalds", "/trending/daily", "/languages/rust"])(
    "leaves %s alone",
    (path) => {
      const res = run(path);
      expect(res.headers.get("location")).toBeNull();
      expect(res.headers.get("x-middleware-next")).toBe("1");
    },
  );

  it("never redirects non-GET requests (Server Actions POST to the page URL)", () => {
    const res = run("/vercel/next.js.git", "POST");
    expect(res.headers.get("location")).toBeNull();
  });

  it("does not treat reserved sections as GitHub owners", () => {
    expect(run("/search").headers.get("location")).toBeNull();
    expect(run("/watchlist").headers.get("location")).toBeNull();
  });
});

describe("proxy rewrites and headers", () => {
  it("rewrites /@login to the user page without changing the URL", () => {
    const res = run("/@torvalds");
    expect(res.headers.get("location")).toBeNull();
    expect(new URL(res.headers.get("x-middleware-rewrite")!).pathname).toBe("/u/torvalds");
  });

  it("marks search, find and watchlist pages as noindex", () => {
    expect(run("/search").headers.get("x-robots-tag")).toBe("noindex");
    expect(run("/find").headers.get("x-robots-tag")).toBe("noindex");
    expect(run("/watchlist").headers.get("x-robots-tag")).toBe("noindex");
    expect(run("/trending").headers.get("x-robots-tag")).toBeNull();
  });
});
