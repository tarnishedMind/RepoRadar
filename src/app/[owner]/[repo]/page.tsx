import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Skeleton } from "@/components/skeleton";
import { Stat } from "@/components/stat";
import { formatCount, formatDate } from "@/lib/format";
import { getRepo } from "@/lib/github";
import { Contributors, ContributorsSkeleton } from "./contributors";
import { Languages, LanguagesSkeleton } from "./languages";
import { Readme, ReadmeSkeleton } from "./readme";

type Props = PageProps<"/[owner]/[repo]">;

// Prerender a few popular repos at build time. Any other repo is rendered on its
// first visit (the static shell streams immediately) and then cached, i.e. ISR.
export function generateStaticParams() {
  return [
    { owner: "vercel", repo: "next.js" },
    { owner: "facebook", repo: "react" },
  ];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { owner, repo } = await params;
  const data = await getRepo(owner, repo);
  if (!data) return { title: "Repository not found" };

  return {
    title: data.full_name,
    description:
      data.description ?? `${data.full_name} on GitHub, explored with RepoRadar.`,
    openGraph: {
      title: data.full_name,
      description: data.description ?? undefined,
      images: [data.owner.avatar_url],
    },
  };
}

export default function RepoPage({ params }: Props) {
  // `params` is passed down unawaited so the await happens inside <Suspense>:
  // the page's static shell (layout + skeleton) can be served before the repo
  // is known.
  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-10">
      <Suspense fallback={<RepoSkeleton />}>
        <RepoView params={params} />
      </Suspense>
    </main>
  );
}

async function RepoView({ params }: Pick<Props, "params">) {
  const { owner, repo } = await params;
  const data = await getRepo(owner, repo);
  if (!data) notFound();

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <Image
            src={data.owner.avatar_url}
            alt=""
            width={40}
            height={40}
            className="rounded-full"
          />
          <h1 className="text-2xl font-semibold tracking-tight">
            <Link href={`/u/${data.owner.login}`} className="hover:underline">
              {data.owner.login}
            </Link>
            <span className="text-zinc-400"> / </span>
            {data.name}
          </h1>
          {data.archived && (
            <span className="rounded-full border px-2 py-0.5 text-xs text-amber-600">
              Archived
            </span>
          )}
        </div>

        {data.description && (
          <p className="max-w-3xl text-zinc-600 dark:text-zinc-400">
            {data.description}
          </p>
        )}

        {!!data.topics?.length && (
          <ul className="flex flex-wrap gap-2">
            {data.topics.map((topic) => (
              <li
                key={topic}
                className="rounded-full bg-sky-100 px-2.5 py-0.5 text-xs text-sky-800 dark:bg-sky-950 dark:text-sky-300"
              >
                {topic}
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-wrap gap-8">
          <Stat label="Stars" value={formatCount(data.stargazers_count)} />
          <Stat label="Forks" value={formatCount(data.forks_count)} />
          <Stat
            label="Watchers"
            value={formatCount(data.subscribers_count ?? data.watchers_count)}
          />
          <Stat label="Open issues" value={formatCount(data.open_issues_count)} />
          <Stat label="Last push" value={formatDate(data.pushed_at)} />
        </div>

        <div className="flex flex-wrap gap-4 text-sm">
          <a href={data.html_url} className="underline" target="_blank" rel="noreferrer">
            View on GitHub
          </a>
          {data.homepage && (
            <a href={data.homepage} className="underline" target="_blank" rel="noreferrer">
              Homepage
            </a>
          )}
          {data.license && (
            <span className="text-zinc-500">{data.license.spdx_id ?? data.license.name}</span>
          )}
        </div>
      </header>

      <div className="grid gap-10 lg:grid-cols-[1fr_280px]">
        {/* Each section streams independently: a slow README doesn't block the sidebar. */}
        <Suspense fallback={<ReadmeSkeleton />}>
          <Readme owner={owner} repo={repo} />
        </Suspense>

        <aside className="flex flex-col gap-10">
          <Suspense fallback={<LanguagesSkeleton />}>
            <Languages owner={owner} repo={repo} />
          </Suspense>
          <Suspense fallback={<ContributorsSkeleton />}>
            <Contributors owner={owner} repo={repo} />
          </Suspense>
        </aside>
      </div>
    </div>
  );
}

function RepoSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Skeleton className="size-10 rounded-full" />
        <Skeleton className="h-8 w-72" />
      </div>
      <Skeleton className="h-5 w-full max-w-2xl" />
      <div className="flex gap-8">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-10 w-16" />
        ))}
      </div>
      <ReadmeSkeleton />
    </div>
  );
}
