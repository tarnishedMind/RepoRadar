import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { LANGUAGES, isLanguageSlug, type LanguageSlug } from "@/entities/github";
import { Leaderboard, LeaderboardSkeleton } from "@/features/leaderboard/server";

type Props = PageProps<"/languages/[lang]">;

// The most popular languages are prerendered at build time; the others are
// rendered on their first visit and cached from then on (ISR). Building only a
// few keeps `next build` under GitHub's search rate limit. Data is cached with
// cacheLife("days") and tagged `leaderboard` + `leaderboard:<lang>`, so
// POST /api/revalidate can refresh one language or all of them on demand.
const PRERENDERED: LanguageSlug[] = ["typescript", "javascript", "python", "rust"];

export function generateStaticParams() {
  return PRERENDERED.map((lang) => ({ lang }));
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
