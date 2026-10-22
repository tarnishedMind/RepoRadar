import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { FIELDS, type FieldSlug, isFieldSlug } from "@/entities/github";
import { FieldRepos, FieldReposSkeleton } from "@/features/fields/server";

type Props = PageProps<"/fields/[field]">;

// Two fields are prerendered at build time; the rest render on their first visit
// and are cached from then on (ISR). Each field costs one search per topic, so
// the build list stays short to respect GitHub's search rate limit. Data is
// cached with cacheLife("days") and tagged `field` + `field:<slug>` for
// POST /api/revalidate.
const PRERENDERED: FieldSlug[] = ["frontend", "backend"];

export function generateStaticParams() {
  return PRERENDERED.map((field) => ({ field }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { field } = await params;
  if (!isFieldSlug(field)) return {};
  return {
    title: `Top ${FIELDS[field].label} repositories`,
    description: `The most-starred active ${FIELDS[field].label} repositories on GitHub. ${FIELDS[field].description}`,
  };
}

export default function FieldPage({ params }: Props) {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-10">
      <Link href="/fields" className="text-sm text-zinc-500 hover:underline">
        ← All fields
      </Link>
      <Suspense fallback={<FieldReposSkeleton />}>
        <FieldRepos params={params} />
      </Suspense>
    </main>
  );
}
