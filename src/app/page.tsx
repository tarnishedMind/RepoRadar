import Form from "next/form";
import Link from "next/link";

const EXAMPLES = [
  { href: "/vercel/next.js", label: "vercel/next.js" },
  { href: "/facebook/react", label: "facebook/react" },
  { href: "/TanStack/query", label: "TanStack/query" },
  { href: "/u/vercel", label: "@vercel" },
  { href: "/u/torvalds", label: "@torvalds" },
];

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center gap-6 px-6 py-24">
      <h1 className="text-4xl font-semibold tracking-tight">RepoRadar</h1>
      <p className="max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
        Explore GitHub repositories, developers and what&apos;s trending. Built
        with the Next.js App Router and TanStack Query.
      </p>
      {/* next/form: a GET form that navigates client-side and prefetches /search. */}
      <Form action="/search" className="flex max-w-xl gap-2">
        <input
          name="q"
          placeholder="Search repositories…"
          className="flex-1 rounded-md border border-zinc-300 bg-transparent px-3 py-2 outline-none focus:border-zinc-500 dark:border-zinc-700"
        />
        <button className="rounded-md bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900">
          Search
        </button>
      </Form>
      <div className="flex flex-col gap-3">
        <span className="text-sm text-zinc-500">Try one of these:</span>
        <ul className="flex flex-wrap gap-2">
          {EXAMPLES.map((e) => (
            <li key={e.href}>
              <Link
                href={e.href}
                className="rounded-full border border-zinc-200 px-3 py-1 text-sm hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
              >
                {e.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
