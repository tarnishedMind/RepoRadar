import Link from "next/link";
import { LANGUAGES, type LanguageSlug } from "@/entities/github";

/** Links to every language leaderboard. */
export function LanguageList() {
  return (
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
  );
}
