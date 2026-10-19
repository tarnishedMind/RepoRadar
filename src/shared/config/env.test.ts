import { describe, expect, it, vi } from "vitest";
import { env } from "./env";

describe("env", () => {
  it("reads values at call time", () => {
    vi.stubEnv("GITHUB_TOKEN", "first");
    expect(env.githubToken()).toBe("first");
    vi.stubEnv("GITHUB_TOKEN", "second");
    expect(env.githubToken()).toBe("second");
  });

  it("treats empty strings as unset", () => {
    vi.stubEnv("GITHUB_TOKEN", "");
    vi.stubEnv("REVALIDATE_SECRET", "");
    expect(env.githubToken()).toBeUndefined();
    expect(env.revalidateSecret()).toBeUndefined();
  });
});
