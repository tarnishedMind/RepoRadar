import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { RepoCard } from "@/components/repo-card";
import { Skeleton } from "@/components/skeleton";
import { UpdatedAt } from "@/components/updated-at";
import {
  TRENDING_RANGES,
  getTrendingRepos,
  isTrendingRange,
  type TrendingRange,
} from "@/lib/github";

type Props = PageProps<"/trending/[[...range]]">;

const DEFAULT_RANGE: TrendingRange = "weekly";

/** `/trending` → weekly, `/trending/daily` → daily, anything else → 404. */
function parseRange(segments: string[] | undefined): TrendingRange | null {
  if (!segments?.length) return DEFAULT_RANGE;
  const [range, ...rest] = segments;
  return rest.length === 0 && isTrendingRange(range) ? range : null;
}

// Every valid URL is prerendered at build time. The data underneath is cached
// with cacheLife("hours"), so each page is regenerated in the background at most
// hourly (ISR), or immediately via POST /api/revalidate.
export function generateStaticParams() {
  return [
    { range: [] },
    ...Object.keys(TRENDING_RANGES).map((range) => ({ range: [range] })),
  ];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const range = parseRange((await params).range);
  if (!range) return {};
  return {
    title: `Trending · ${TRENDING_RANGES[range].label}`,
    description: `The most-starred GitHub repositories created ${TRENDING_RANGES[range].label.toLowerCase()}.`,
  };
}

export default function TrendingPage({ params }: Props) {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Trending</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          The most-starred repositories created recently.
        </p>
      </div>
      <Suspense fallback={<TrendingSkeleton />}>
        <TrendingList params={params} />
      </Suspense>
    </main>
  );
}

async function TrendingList({ params }: Pick<Props, "params">) {
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

function TrendingSkeleton() {
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
