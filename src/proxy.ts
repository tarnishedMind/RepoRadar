import { NextResponse, type NextRequest } from "next/server";
import { RESERVED_SEGMENTS } from "@/shared/config/site";

/**
 * Proxy (called Middleware before Next 16) runs before every matching request,
 * before any page renders. It's for cheap decisions based on the URL and
 * headers: redirects, rewrites and headers. Not for data fetching.
 *
 * Here it makes RepoRadar accept GitHub-style URLs:
 *   /vercel/next.js.git               → 308 /vercel/next.js
 *   /vercel/next.js/tree/canary/docs  → 308 /vercel/next.js
 *   /github.com/vercel/next.js        → 308 /vercel/next.js  (paste after our domain)
 *   /torvalds                         → 308 /u/torvalds
 *   /@torvalds                        → rewrite to /u/torvalds (URL stays /@torvalds)
 * and marks personal or endless pages as not indexable.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const original = pathname.split("/").filter(Boolean);
  let segments = original;

  if (request.method === "GET" || request.method === "HEAD") {
    // "https://github.com/x/y" pasted after our domain arrives as /https:/github.com/x/y.
    if (/^https?:$/i.test(segments[0] ?? "")) segments = segments.slice(1);
    if (/^(www\.)?github\.com$/i.test(segments[0] ?? "")) segments = segments.slice(1);

    const [first = "", second] = segments;

    if (first.startsWith("@") && segments.length === 1) {
      // A rewrite serves another route's content without changing the URL.
      return NextResponse.rewrite(new URL(`/u/${first.slice(1)}`, request.url));
    }

    if (first && !RESERVED_SEGMENTS.has(first.toLowerCase())) {
      const target =
        second === undefined ? `/u/${first}` : `/${first}/${second.replace(/\.git$/i, "")}`;
      if (target !== `/${original.join("/")}`) {
        // A redirect tells the browser to go to a new URL (308 = permanent, keeps method).
        return NextResponse.redirect(new URL(target, request.url), 308);
      }
    }
  }

  const response = NextResponse.next();
  // Search results, AI finds and the cookie-based watchlist shouldn't show up in search engines.
  if (["search", "find", "watchlist"].includes(original[0] ?? "")) {
    response.headers.set("X-Robots-Tag", "noindex");
  }
  return response;
}

export const config = {
  matcher: [
    // Everything except API routes, Next internals, metadata routes (OG images,
    // sitemap, robots) and static files.
    "/((?!api/|_next/|favicon\\.ico|sitemap\\.xml|robots\\.txt|.*opengraph-image|.*twitter-image|.*\\.(?:png|jpe?g|gif|svg|webp|ico)$).*)",
  ],
};
