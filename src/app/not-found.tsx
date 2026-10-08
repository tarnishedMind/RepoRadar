import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-start justify-center gap-4 px-6 py-24">
      <h1 className="text-3xl font-semibold tracking-tight">Not found</h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        We couldn&apos;t find that repository or user on GitHub.
      </p>
      <Link href="/" className="underline">
        Back to RepoRadar
      </Link>
    </main>
  );
}
