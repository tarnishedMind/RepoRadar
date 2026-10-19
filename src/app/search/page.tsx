import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchSkeleton, parseSearchParams } from "@/features/search";
import { PrefetchedSearch } from "@/features/search/server";

type Props = PageProps<"/search">;

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q } = parseSearchParams(await searchParams);
  return { title: q ? `Search: ${q}` : "Search" };
}

export default function SearchPage({ searchParams }: Props) {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Search repositories</h1>
      <Suspense fallback={<SearchSkeleton />}>
        <PrefetchedSearch searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
