/**
 * Absolute base URL, used for metadataBase (OG image URLs), the sitemap and
 * robots.txt. On Vercel the production domain is provided automatically.
 */
export const siteUrl = new URL(
  process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000"),
);

/** First path segments owned by RepoRadar itself, never treated as a GitHub owner. */
export const RESERVED_SEGMENTS = new Set([
  "u",
  "trending",
  "languages",
  "search",
  "watchlist",
  "api",
]);
