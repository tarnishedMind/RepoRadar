import { describe, expect, it } from "vitest";
import { fieldTopicQuery, rankFieldRepos } from "./field-ranking";
import type { GitHubRepo } from "./types";

const repo = (id: number, stars: number, topics?: string[]) =>
  ({ id, full_name: `owner/repo-${id}`, stargazers_count: stars, topics }) as GitHubRepo;

describe("fieldTopicQuery", () => {
  it("filters to active, unarchived repos with some stars", () => {
    expect(fieldTopicQuery("react", new Date("2026-10-22T12:00:00Z"))).toBe(
      "topic:react archived:false stars:>=200 pushed:>=2026-04-25",
    );
  });
});

describe("rankFieldRepos", () => {
  const topics = ["react", "vue", "svelte"];

  it("merges the lists and sorts by stars", () => {
    const ranked = rankFieldRepos(topics, [[repo(1, 50)], [repo(2, 300)], [repo(3, 100)]]);
    expect(ranked.map((r) => r.id)).toEqual([2, 3, 1]);
  });

  it("keeps one entry per repository", () => {
    const ranked = rankFieldRepos(topics, [[repo(1, 10)], [repo(1, 10)], []]);
    expect(ranked).toHaveLength(1);
  });

  it("lists matched topics in field order, including the searched one", () => {
    const [ranked] = rankFieldRepos(topics, [[], [repo(1, 10, ["svelte", "react", "css"])], []]);
    expect(ranked.matchedTopics).toEqual(["react", "vue", "svelte"]);
  });

  it("breaks star ties by name and cuts to the limit", () => {
    const tied = [repo(2, 5), repo(1, 5), repo(3, 1)];
    expect(rankFieldRepos(["x"], [tied], 2).map((r) => r.id)).toEqual([1, 2]);
  });
});
