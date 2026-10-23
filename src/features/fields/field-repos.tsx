import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  FIELD_ACTIVE_DAYS,
  FIELD_MIN_STARS,
  FIELDS,
  type FieldSlug,
  isFieldSlug,
} from "@/entities/github";
import { getFieldRepos } from "@/entities/github/server";
import { formatCount } from "@/shared/lib/format";
import { Skeleton } from "@/shared/ui/skeleton";
import { UpdatedAt } from "@/shared/ui/updated-at";

export async function FieldRepos({ params }: { params: Promise<{ field: string }> }) {
  const { field } = await params;
  if (!isFieldSlug(field)) notFound();

  const { repos, fetchedAt } = await getFieldRepos(field);

  return (
    <>
      <nav aria-label="Fields" className="flex flex-wrap gap-2">
        {(Object.keys(FIELDS) as FieldSlug[]).map((slug) => (
          <Link
            key={slug}
            href={`/fields/${slug}`}
            prefetch={false} // see FieldList: each uncached field costs four searches
            aria-current={slug === field ? "page" : undefined}
            className="rounded-full border border-zinc-200 px-3 py-1 text-sm text-zinc-600 hover:border-zinc-400 aria-[current=page]:border-zinc-900 aria-[current=page]:bg-zinc-900 aria-[current=page]:text-white dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-600 dark:aria-[current=page]:border-zinc-100 dark:aria-[current=page]:bg-zinc-100 dark:aria-[current=page]:text-zinc-900"
          >
            {FIELDS[slug].label}
          </Link>
        ))}
      </nav>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-semibold tracking-tight">
            Top {FIELDS[field].label} repositories
          </h1>
          <p className="text-sm text-zinc-500">
            {FIELDS[field].topics.map((t) => `#${t}`).join(" ")} · {formatCount(FIELD_MIN_STARS)}+
            stars · pushed in the last {FIELD_ACTIVE_DAYS} days
          </p>
        </div>
        <UpdatedAt iso={fetchedAt} />
      </div>

      {repos.length ? (
        <ol className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          {repos.map((repo, i) => (
            <li key={repo.id}>
              <Link
                href={`/${repo.full_name}`}
                className="flex items-center gap-4 px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-900"
              >
                <span className="w-6 shrink-0 text-right text-sm tabular-nums text-zinc-400">
                  {i + 1}
                </span>
                <Image
                  src={repo.owner.avatar_url}
                  alt=""
                  width={28}
                  height={28}
                  className="shrink-0 rounded-full"
                />
                <span className="flex min-w-0 flex-col gap-1">
                  <span className="truncate font-medium">{repo.full_name}</span>
                  {repo.description && (
                    <span className="truncate text-sm text-zinc-500">{repo.description}</span>
                  )}
                  <span className="flex flex-wrap gap-1">
                    {repo.matchedTopics.map((t) => (
                      <span
                        key={t}
                        className="rounded-full bg-zinc-100 px-2 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                      >
                        {t}
                      </span>
                    ))}
                  </span>
                </span>
                <span className="ml-auto shrink-0 text-sm tabular-nums">
                  ★ {formatCount(repo.stargazers_count)}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-zinc-500">No active repositories found for this field.</p>
      )}
    </>
  );
}

export function FieldReposSkeleton() {
  return (
    <>
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-9 w-80" />
      <div className="flex flex-col gap-2">
        {Array.from({ length: 10 }, (_, i) => (
          <Skeleton key={i} className="h-16" />
        ))}
      </div>
    </>
  );
}
