import type { Metadata } from "next";
import { Suspense } from "react";
import { WatchlistContent, WatchlistSkeleton } from "@/features/watchlist/server";

export const metadata: Metadata = {
  title: "Watchlist",
  description: "Repositories you are keeping an eye on.",
};

export default function WatchlistPage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Watchlist</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Saved in a cookie in this browser. No account needed.
        </p>
      </div>
      {/* Reading cookies is per-request, so it must sit inside <Suspense>. */}
      <Suspense fallback={<WatchlistSkeleton />}>
        <WatchlistContent />
      </Suspense>
    </main>
  );
}
