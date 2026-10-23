"use client";

import Link from "next/link";
import { useEffect } from "react";
import { normalizeRequest } from "./intent";
import { addHistoryEntry, clearHistory, removeHistoryEntry, useFindHistory } from "./history-store";

/**
 * Recent /find requests from this browser. Results are cached by request on
 * the server, so reopening one is instant and costs no AI quota.
 */
export function FindHistory({ current }: { current: string }) {
  const history = useFindHistory();

  useEffect(() => {
    if (current) addHistoryEntry(current);
  }, [current]);

  if (!history.length) return null;
  const currentKey = normalizeRequest(current);

  return (
    <section aria-label="Recent requests" className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm text-zinc-500">Recent requests</h2>
        <button
          type="button"
          onClick={clearHistory}
          className="text-xs text-zinc-500 hover:text-zinc-900 hover:underline dark:hover:text-zinc-100"
        >
          Clear all
        </button>
      </div>
      <ul className="flex flex-wrap gap-2">
        {history.map(({ query, at }) => (
          <li
            key={query}
            className="flex items-center rounded-full border border-zinc-200 text-sm has-[a[aria-current]]:border-zinc-900 dark:border-zinc-800 dark:has-[a[aria-current]]:border-zinc-100"
          >
            <Link
              href={`/find?${new URLSearchParams({ q: query })}`}
              prefetch={false}
              aria-current={normalizeRequest(query) === currentKey ? "page" : undefined}
              title={new Date(at).toLocaleString()}
              className="max-w-72 truncate py-1 pl-3 pr-1 hover:underline"
            >
              {query}
            </Link>
            <button
              type="button"
              onClick={() => removeHistoryEntry(query)}
              aria-label={`Remove “${query}” from history`}
              className="px-2 py-1 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              ×
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
