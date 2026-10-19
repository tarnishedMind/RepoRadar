import { describe, expect, it, vi } from "vitest";
import { getSiteUrl } from "./site";

describe("getSiteUrl", () => {
  it("prefers NEXT_PUBLIC_SITE_URL", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://reporadar.example");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "repo-radar.vercel.app");
    expect(getSiteUrl().href).toBe("https://reporadar.example/");
  });

  it("falls back to the Vercel production domain", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "repo-radar.vercel.app");
    expect(getSiteUrl().href).toBe("https://repo-radar.vercel.app/");
  });

  it("uses localhost when nothing is set", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "");
    expect(getSiteUrl().href).toBe("http://localhost:3000/");
  });
});
