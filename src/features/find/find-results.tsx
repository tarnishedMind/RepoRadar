import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { type GitHubRepo, LANGUAGES, RepoCard } from "@/entities/github";
import { searchRepositories } from "@/entities/github/server";
import { formatCount } from "@/shared/lib/format";
import { Skeleton } from "@/shared/ui/skeleton";
import { getIntent, getPicks, isFindAiOn } from "./ai";
import {
  buildSearches,
  type FindIntent,
  fallbackSearch,
  mergeResults,
  normalizeRequest,
} from "./intent";

export async function FindResults({ query }: { query: string }) {
  const request = normalizeRequest(query);
  const intent = await getIntent(request);
  const searches = intent ? buildSearches(intent) : [fallbackSearch(request)];
  const results = await Promise.all(searches.map((search) => searchRepositories(search, 1)));
  const repos = mergeResults(results.map((r) => r.items));

  return (
    <>
      <SearchedFor intent={intent} />
      {!repos.length ? (
        <p className="text-zinc-500">No repositories matched. Try describing it differently.</p>
      ) : intent ? (
        // The plain list is a real fallback: it shows while the model picks.
        <Suspense fallback={<RepoGrid repos={repos} note="Picking the best matches…" />}>
          <BestMatches request={request} repos={repos} />
        </Suspense>
      ) : (
        <RepoGrid repos={repos} />
      )}
    </>
  );
}

function SearchedFor({ intent }: { intent: FindIntent | null }) {
  if (!intent) {
    return (
      <p className="text-sm text-zinc-500">
        {isFindAiOn()
          ? "The AI assistant is unavailable right now, so these are plain keyword results."
          : "Plain keyword results (the AI assistant is not configured)."}
      </p>
    );
  }
  const terms = [
    ...intent.keywords.map((k) => `“${k}”`),
    ...intent.topics.map((t) => `#${t}`),
    ...(intent.language ? [LANGUAGES[intent.language]] : []),
  ];
  return (
    <p className="text-sm text-zinc-500">
      Searched GitHub for{" "}
      {terms.map((term) => (
        <span
          key={term}
          className="mr-1 rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
        >
          {term}
        </span>
      ))}
    </p>
  );
}

async function BestMatches({ request, repos }: { request: string; repos: GitHubRepo[] }) {
  const picks = await getPicks(request, repos);
  if (!picks) return <RepoGrid repos={repos} />;

  const byName = new Map(repos.map((repo) => [repo.full_name, repo]));
  const picked = new Set(picks.map((p) => p.fullName));
  const rest = repos.filter((repo) => !picked.has(repo.full_name));

  return (
    <>
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Best matches</h2>
        <ol className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          {picks.map(({ fullName, reason }, i) => {
            const repo = byName.get(fullName);
            if (!repo) return null;
            return (
              <li key={fullName}>
                <Link
                  href={`/${fullName}`}
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
                    <span className="truncate font-medium">{fullName}</span>
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">{reason}</span>
                  </span>
                  <span className="ml-auto shrink-0 text-sm tabular-nums">
                    ★ {formatCount(repo.stargazers_count)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
        <p className="text-xs text-zinc-500">Picks and reasons are AI-generated; check the repo.</p>
      </section>
      {rest.length > 0 && <RepoGrid repos={rest} title="More results" />}
    </>
  );
}

function RepoGrid({
  repos,
  title = "Results",
  note,
}: {
  repos: GitHubRepo[];
  title?: string;
  note?: string;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline gap-3">
        <h2 className="text-lg font-semibold">{title}</h2>
        {note && <span className="animate-pulse text-sm text-zinc-500">{note}</span>}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {repos.map((repo) => (
          <RepoCard key={repo.id} repo={repo} showOwner />
        ))}
      </div>
    </section>
  );
}

export function FindResultsSkeleton() {
  return (
    <>
      <p className="animate-pulse text-sm text-zinc-500">Reading your request…</p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
    </>
  );
}
