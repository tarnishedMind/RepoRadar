import Link from "next/link";
import { FIELDS, type FieldSlug } from "@/entities/github";

/** The field picker: one card per field with the topics it is built from. */
export function FieldList() {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {(Object.keys(FIELDS) as FieldSlug[]).map((slug) => (
        <li key={slug}>
          {/* No prefetch: an uncached field costs four GitHub searches, and prefetching all
              nine at once would burn GitHub's 30-searches-a-minute limit. */}
          <Link
            href={`/fields/${slug}`}
            prefetch={false}
            className="flex h-full flex-col gap-2 rounded-lg border border-zinc-200 p-4 transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
          >
            <span className="font-medium">{FIELDS[slug].label}</span>
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              {FIELDS[slug].description}
            </span>
            <span className="mt-auto text-xs text-zinc-500">
              {FIELDS[slug].topics.map((t) => `#${t}`).join(" ")}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
