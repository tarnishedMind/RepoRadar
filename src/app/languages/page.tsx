import type { Metadata } from "next";
import Link from "next/link";
import { LANGUAGES, type LanguageSlug } from "@/lib/github/catalog";

export const metadata: Metadata = {
  title: "Language leaderboards",
  description: "The most-starred GitHub repositories for popular languages.",
};

export default function LanguagesPage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Language leaderboards</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          The all-time most-starred repositories for each language.
        </p>
      </div>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {(Object.keys(LANGUAGES) as LanguageSlug[]).map((slug) => (
          <li key={slug}>
            <Link
              href={`/languages/${slug}`}
              className="block rounded-lg border border-zinc-200 px-4 py-3 font-medium transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
            >
              {LANGUAGES[slug]}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
