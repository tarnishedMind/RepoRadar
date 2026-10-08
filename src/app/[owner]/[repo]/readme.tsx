import { Skeleton } from "@/components/skeleton";
import { getRepoReadmeHtml } from "@/lib/github";

export async function Readme({ owner, repo }: { owner: string; repo: string }) {
  const html = await getRepoReadmeHtml(owner, repo);

  return (
    <section className="min-w-0 rounded-lg border border-zinc-200 p-6 dark:border-zinc-800">
      <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-zinc-500">
        README
      </h2>
      {html ? (
        <article
          className="prose prose-zinc max-w-none dark:prose-invert prose-img:inline prose-img:my-0"
          // GitHub renders and sanitizes README HTML server-side.
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <p className="text-zinc-500">This repository has no README.</p>
      )}
    </section>
  );
}

export function ReadmeSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-6 dark:border-zinc-800">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-8 w-1/2" />
      {Array.from({ length: 8 }, (_, i) => (
        <Skeleton key={i} className="h-4 w-full" />
      ))}
    </div>
  );
}
