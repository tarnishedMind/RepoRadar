"use client";

import { useQuery, useQueryClient, type InfiniteData } from "@tanstack/react-query";
import Image from "next/image";
import { Skeleton } from "@/components/skeleton";
import { Stat } from "@/components/stat";
import { formatCount, formatDate } from "@/lib/format";
import type { GitHubRepo } from "@/lib/github/types";
import { repoQueryOptions, type SearchPage } from "@/lib/queries";

export function RepoPreview({ owner, repo }: { owner: string; repo: string }) {
  const queryClient = useQueryClient();

  const { data, error, isPlaceholderData } = useQuery({
    ...repoQueryOptions(owner, repo),
    // Usually already in the cache from the hover prefetch. If not, show the
    // copy from the search results instantly while the full record loads.
    placeholderData: () => findInSearchCache(queryClient, `${owner}/${repo}`),
  });

  if (error) return <p className="text-red-600">{error.message}</p>;
  if (!data) return <RepoPreviewSkeleton />;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3 pr-8">
        <Image
          src={data.owner.avatar_url}
          alt=""
          width={40}
          height={40}
          className="rounded-full"
        />
        <h2 className="text-xl font-semibold tracking-tight">
          <span className="text-zinc-500">{data.owner.login} / </span>
          {data.name}
        </h2>
      </div>

      {data.description && (
        <p className="text-zinc-600 dark:text-zinc-400">{data.description}</p>
      )}

      {!!data.topics?.length && (
        <ul className="flex flex-wrap gap-2">
          {data.topics.slice(0, 10).map((topic) => (
            <li
              key={topic}
              className="rounded-full bg-sky-100 px-2.5 py-0.5 text-xs text-sky-800 dark:bg-sky-950 dark:text-sky-300"
            >
              {topic}
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap gap-6">
        <Stat label="Stars" value={formatCount(data.stargazers_count)} />
        <Stat label="Forks" value={formatCount(data.forks_count)} />
        <Stat
          label="Watchers"
          value={isPlaceholderData ? "…" : formatCount(data.subscribers_count ?? data.watchers_count)}
        />
        <Stat label="Last push" value={formatDate(data.pushed_at)} />
      </div>

      <div className="flex flex-wrap items-center gap-3 text-sm">
        {/* A plain <a> forces a hard navigation, so the full page loads instead
            of being intercepted into the modal again. */}
        <a
          href={`/${data.full_name}`}
          className="rounded-md bg-zinc-900 px-4 py-2 text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900"
        >
          Open full page
        </a>
        <a href={data.html_url} target="_blank" rel="noreferrer" className="underline">
          View on GitHub
        </a>
        {data.language && <span className="text-zinc-500">{data.language}</span>}
        {data.license?.spdx_id && <span className="text-zinc-500">{data.license.spdx_id}</span>}
      </div>
    </div>
  );
}

function findInSearchCache(
  queryClient: ReturnType<typeof useQueryClient>,
  fullName: string,
): GitHubRepo | undefined {
  const target = fullName.toLowerCase();
  for (const [, data] of queryClient.getQueriesData<InfiniteData<SearchPage>>({
    queryKey: ["search"],
  })) {
    for (const page of data?.pages ?? []) {
      const hit = page.items.find((r) => r.full_name.toLowerCase() === target);
      if (hit) return hit;
    }
  }
  return undefined;
}

export function RepoPreviewSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <Skeleton className="size-10 rounded-full" />
        <Skeleton className="h-7 w-64" />
      </div>
      <Skeleton className="h-5 w-full" />
      <div className="flex gap-6">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-10 w-16" />
        ))}
      </div>
      <Skeleton className="h-9 w-36" />
    </div>
  );
}
