import { queryOptions } from "@tanstack/react-query";
import type { GitHubRepo } from "@/entities/github";
import { getJson } from "@/shared/lib/get-json";

/** Lowercased: GitHub names are case-insensitive, so one repo is one cache entry. */
export const repoQueryKey = (owner: string, repo: string) =>
  ["repo", owner.toLowerCase(), repo.toLowerCase()] as const;

/** Repo details in the client cache: hover prefetch and the preview modal. */
export function repoQueryOptions(owner: string, repo: string) {
  return queryOptions({
    queryKey: repoQueryKey(owner, repo),
    queryFn: ({ signal }) =>
      getJson<GitHubRepo>(
        `/api/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`,
        signal,
      ),
    staleTime: 5 * 60 * 1000,
  });
}
