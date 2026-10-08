"use client";

import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { formatCount } from "@/lib/format";
import type { GitHubRepo } from "@/lib/github/types";
import { repoQueryOptions } from "@/lib/queries";

export function SearchResultCard({ repo }: { repo: GitHubRepo }) {
  const queryClient = useQueryClient();

  // Warm the repo-details cache on hover/focus so the preview (M4) opens
  // instantly. prefetchQuery is a no-op while cached data is still fresh.
  function prefetch() {
    void queryClient.prefetchQuery(repoQueryOptions(repo.owner.login, repo.name));
  }

  return (
    <Link
      href={`/${repo.full_name}`}
      onMouseEnter={prefetch}
      onFocus={prefetch}
      className="flex flex-col gap-2 rounded-lg border border-zinc-200 p-4 transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
    >
      <span className="font-medium">
        <span className="text-zinc-500">{repo.owner.login} / </span>
        {repo.name}
      </span>
      {repo.description && (
        <span className="line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
          {repo.description}
        </span>
      )}
      <span className="mt-auto flex gap-4 text-xs text-zinc-500">
        {repo.language && <span>{repo.language}</span>}
        <span>★ {formatCount(repo.stargazers_count)}</span>
        <span>⑂ {formatCount(repo.forks_count)}</span>
      </span>
    </Link>
  );
}
