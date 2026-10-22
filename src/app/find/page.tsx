import type { Metadata } from "next";
import { Suspense } from "react";
import { parseFindQuery } from "@/features/find";
import { FindView, FindViewSkeleton } from "@/features/find/server";

type Props = PageProps<"/find">;

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const query = parseFindQuery((await searchParams).q);
  return {
    title: query ? `Find: ${query}` : "Describe it",
    description: "Describe the project you need in plain words and get matching repositories.",
  };
}

export default function FindPage({ searchParams }: Props) {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Describe it</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Say what you need in plain words. AI turns it into GitHub searches and picks the best
          matches.
        </p>
      </div>
      <Suspense fallback={<FindViewSkeleton />}>
        <FindView searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
