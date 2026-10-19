import type { Metadata } from "next";
import { LanguageList } from "@/features/leaderboard";

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
      <LanguageList />
    </main>
  );
}
