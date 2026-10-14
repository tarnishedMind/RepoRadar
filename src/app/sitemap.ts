import type { MetadataRoute } from "next";
import { LANGUAGES, TRENDING_RANGES } from "@/lib/github/catalog";
import { siteUrl } from "@/lib/site";

// Served at /sitemap.xml. Lists the pages worth indexing; repo and user pages
// are discovered by crawlers through links from these.
export default function sitemap(): MetadataRoute.Sitemap {
  const url = (path: string) => new URL(path, siteUrl).toString();
  return [
    { url: url("/"), changeFrequency: "daily", priority: 1 },
    { url: url("/trending"), changeFrequency: "hourly", priority: 0.9 },
    ...Object.keys(TRENDING_RANGES).map((range) => ({
      url: url(`/trending/${range}`),
      changeFrequency: "hourly" as const,
      priority: 0.8,
    })),
    { url: url("/languages"), changeFrequency: "weekly", priority: 0.7 },
    ...Object.keys(LANGUAGES).map((lang) => ({
      url: url(`/languages/${lang}`),
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
  ];
}
