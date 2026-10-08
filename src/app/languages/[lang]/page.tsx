import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Skeleton } from "@/components/skeleton";
import { UpdatedAt } from "@/components/updated-at";
import { formatCount } from "@/lib/format";
import {
  LANGUAGES,
  getLanguageLeaderboard,
  isLanguageSlug,
} from "@/lib/github";

type Props = PageProps<"/languages/[lang]">;

// All supported languages are prerendered. Data is cached with cacheLife("days")
// and tagged `leaderboard` + `leaderboard:<lang>`, so POST /api/revalidate can
// refresh one language or all of them on demand.
export function generateStaticParams() {
  return Object.keys(LANGUAGES).map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!isLanguageSlug(lang)) return {};
  return {
    title: `Top ${LANGUAGES[lang]} repositories`,
    description: `The all-time most-starred ${LANGUAGES[lang]} repositories on GitHub.`,
  };
}

export default function LeaderboardPage({ params }: Props) {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-10">
      <Link href="/languages" className="text-sm text-zinc-500 hover:underline">
        ← All languages
      </Link>
      <Suspense fallback={<LeaderboardSkeleton />}>
        <Leaderboard params={params} />
      </Suspense>
    </main>
  );
}

async function Leaderboard({ params }: Pick<Props, "params">) {
  const { lang } = await params;
  if (!isLanguageSlug(lang)) notFound();

  const { repos, totalCount, fetchedAt } = await getLanguageLeaderboard(lang);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-semibold tracking-tight">
            Top {LANGUAGES[lang]} repositories
          </h1>
          <p className="text-sm text-zinc-500">
            Top {repos.length} of {formatCount(totalCount)} repositories
          </p>
        </div>
        <UpdatedAt iso={fetchedAt} />
      </div>

      <ol className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
        {repos.map((repo, i) => (
          <li key={repo.id}>
            <Link
              href={`/${repo.full_name}`}
              className="flex items-center gap-4 px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-900"
            >
              <span className="w-6 text-right text-sm tabular-nums text-zinc-400">
                {i + 1}
              </span>
              <Image
                src={repo.owner.avatar_url}
                alt=""
                width={28}
                height={28}
                className="rounded-full"
              />
              <span className="flex min-w-0 flex-col">
                <span className="truncate font-medium">{repo.full_name}</span>
                {repo.description && (
                  <span className="truncate text-sm text-zinc-500">{repo.description}</span>
                )}
              </span>
              <span className="ml-auto shrink-0 text-sm tabular-nums">
                ★ {formatCount(repo.stargazers_count)}
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </>
  );
}

function LeaderboardSkeleton() {
  return (
    <>
      <Skeleton className="h-9 w-80" />
      <div className="flex flex-col gap-2">
        {Array.from({ length: 10 }, (_, i) => (
          <Skeleton key={i} className="h-12" />
        ))}
      </div>
    </>
  );
}
