import Link from "next/link";
import { notFound } from "next/navigation";
import { RepoCard, TRENDING_RANGES, type TrendingRange } from "@/entities/github";
import { getTrendingRepos } from "@/entities/github/server";
import { Skeleton } from "@/shared/ui/skeleton";
import { UpdatedAt } from "@/shared/ui/updated-at";
import { parseRange } from "./range";

export async function TrendingList({ params }: { params: Promise<{ range?: string[] }> }) {
  const range = parseRange((await params).range);
  if (!range) notFound();

  const { repos, since, fetchedAt } = await getTrendingRepos(range);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <nav className="flex gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-900">
          {(Object.keys(TRENDING_RANGES) as TrendingRange[]).map((key) => (
            <Link
              key={key}
              href={`/trending/${key}`}
              aria-current={key === range ? "page" : undefined}
              className="rounded-md px-3 py-1 text-sm text-zinc-600 aria-[current=page]:bg-white aria-[current=page]:text-zinc-900 aria-[current=page]:shadow-sm dark:text-zinc-400 dark:aria-[current=page]:bg-zinc-800 dark:aria-[current=page]:text-zinc-100"
            >
              {TRENDING_RANGES[key].label}
            </Link>
          ))}
        </nav>
        <div className="text-right">
          <p className="text-xs text-zinc-500">Created after {since}</p>
          <UpdatedAt iso={fetchedAt} />
        </div>
      </div>

      {repos.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {repos.map((repo) => (
            <RepoCard key={repo.id} repo={repo} showOwner />
          ))}
        </div>
      ) : (
        <p className="text-zinc-500">No repositories found for this range.</p>
      )}
    </>
  );
}

export function TrendingSkeleton() {
  return (
    <>
      <Skeleton className="h-9 w-72" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 9 }, (_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
    </>
  );
}
