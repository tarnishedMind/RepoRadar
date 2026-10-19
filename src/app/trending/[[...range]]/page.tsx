import type { Metadata } from "next";
import { Suspense } from "react";
import { TRENDING_RANGES } from "@/entities/github";
import { parseRange } from "@/features/trending";
import { TrendingList, TrendingSkeleton } from "@/features/trending/server";

type Props = PageProps<"/trending/[[...range]]">;

// Every valid URL is prerendered at build time. The data underneath is cached
// with cacheLife("hours"), so each page is regenerated in the background at most
// hourly (ISR), or immediately via POST /api/revalidate.
export function generateStaticParams() {
  return [{ range: [] }, ...Object.keys(TRENDING_RANGES).map((range) => ({ range: [range] }))];
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
