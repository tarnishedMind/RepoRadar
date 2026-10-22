import Link from "next/link";
import { Suspense } from "react";
import { Skeleton } from "@/shared/ui/skeleton";
import { FindForm } from "./find-form";
import { FindHistory } from "./find-history";
import { FindResults, FindResultsSkeleton } from "./find-results";
import { parseFindQuery } from "./intent";

const EXAMPLES = [
  "I need a library that works with dates in JavaScript",
  "Fast state management for React",
  "A Python tool to scrape websites",
  "Self-hosted alternative to Notion",
];

/**
 * Three nested Suspense levels stream in order: the form (as soon as the
 * search params are read), the repositories (after the model reads the
 * request and GitHub answers), then the model's picks with reasons.
 */
export async function FindView({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = parseFindQuery((await searchParams).q);

  return (
    <>
      <FindForm defaultValue={query} />
      <FindHistory current={query} />
      {query ? (
        // A new key per query shows the skeleton again instead of the old results.
        <Suspense key={query} fallback={<FindResultsSkeleton />}>
          <FindResults query={query} />
        </Suspense>
      ) : (
        <div className="flex flex-col gap-3">
          <span className="text-sm text-zinc-500">Try one of these:</span>
          <ul className="flex flex-wrap gap-2">
            {EXAMPLES.map((example) => (
              <li key={example}>
                {/* No prefetch: each example would spend GitHub searches and Groq quota on hover. */}
                <Link
                  href={`/find?${new URLSearchParams({ q: example })}`}
                  prefetch={false}
                  className="rounded-full border border-zinc-200 px-3 py-1 text-sm hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
                >
                  {example}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

export function FindViewSkeleton() {
  return <Skeleton className="h-10 w-full" />;
}
