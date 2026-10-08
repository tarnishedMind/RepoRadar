export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-6 px-6 py-24">
      <h1 className="text-4xl font-semibold tracking-tight">RepoRadar</h1>
      <p className="text-lg text-zinc-600 dark:text-zinc-400">
        Explore GitHub repositories, developers and what&apos;s trending. Built
        with the Next.js App Router and TanStack Query.
      </p>
      <p className="text-sm text-zinc-500">
        Work in progress. See <code>docs/PLAN.md</code> for the roadmap.
      </p>
    </main>
  );
}
