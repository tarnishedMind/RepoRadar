import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GitHubRepo } from "@/entities/github";

vi.mock("next/cache", () => ({ cacheLife: vi.fn() }));
const groq = vi.hoisted(() => ({ groqJson: vi.fn() }));
vi.mock("./groq", () => groq);

const { getIntent, getPicks, toCandidate } = await import("./ai");

const repo = {
  full_name: "date-fns/date-fns",
  description: null,
  language: null,
  stargazers_count: 1,
} as GitHubRepo;

beforeEach(() => {
  groq.groqJson.mockReset();
  vi.stubEnv("GROQ_API_KEY", "key");
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

describe("getIntent", () => {
  it("returns the validated intent", async () => {
    groq.groqJson.mockResolvedValueOnce({ keywords: ["date"], language: "javascript", topics: [] });
    await expect(getIntent("dates in js")).resolves.toEqual({
      keywords: ["date"],
      language: "javascript",
      topics: [],
    });
  });

  it("falls back (null) on errors and on unusable output", async () => {
    groq.groqJson.mockRejectedValueOnce(new Error("429"));
    await expect(getIntent("a")).resolves.toBeNull();
    groq.groqJson.mockResolvedValueOnce({ keywords: [], topics: [] });
    await expect(getIntent("b")).resolves.toBeNull();
  });

  it("never calls the model without a key or with the switch off", async () => {
    vi.stubEnv("GROQ_API_KEY", "");
    await expect(getIntent("a")).resolves.toBeNull();
    vi.stubEnv("GROQ_API_KEY", "key");
    vi.stubEnv("FIND_AI_ENABLED", "false");
    await expect(getIntent("a")).resolves.toBeNull();
    expect(groq.groqJson).not.toHaveBeenCalled();
  });
});

describe("getPicks", () => {
  it("returns validated picks for the shown repos", async () => {
    groq.groqJson.mockResolvedValueOnce({
      picks: [{ repo: "date-fns/date-fns", reason: "Modular." }],
    });
    await expect(getPicks("dates", [repo])).resolves.toEqual([
      { fullName: "date-fns/date-fns", reason: "Modular." },
    ]);
    expect(JSON.parse(groq.groqJson.mock.calls[0][1])).toEqual({
      request: "dates",
      candidates: [toCandidate(repo)],
    });
  });

  it("returns null when nothing usable comes back or there is nothing to rank", async () => {
    groq.groqJson.mockResolvedValueOnce({ picks: [{ repo: "evil/x", reason: "hi" }] });
    await expect(getPicks("dates", [repo])).resolves.toBeNull();
    await expect(getPicks("dates", [])).resolves.toBeNull();
  });
});

describe("toCandidate", () => {
  it("fills missing fields with empty values", () => {
    expect(toCandidate(repo)).toEqual({
      repo: "date-fns/date-fns",
      description: "",
      language: "",
      stars: 1,
      topics: [],
    });
  });
});
