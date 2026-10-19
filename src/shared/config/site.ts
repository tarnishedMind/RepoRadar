/**
 * Absolute base URL, used for metadataBase (OG image URLs), the sitemap and
 * robots.txt. On Vercel the production domain is provided automatically.
 * The only place public and platform variables are read (ADR 0005); empty
 * strings count as unset.
 */
export function getSiteUrl() {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return new URL(explicit);
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  return new URL(vercel ? `https://${vercel}` : "http://localhost:3000");
}

export const siteUrl = getSiteUrl();

/** First path segments owned by RepoRadar itself, never treated as a GitHub owner. */
export const RESERVED_SEGMENTS = new Set([
  "u",
  "trending",
  "languages",
  "search",
  "watchlist",
  "api",
]);
