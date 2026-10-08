import Link from "next/link";

const NAV = [
  { href: "/search", label: "Search" },
  { href: "/trending", label: "Trending" },
  { href: "/languages", label: "Languages" },
];

export function SiteHeader() {
  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800">
      <nav className="mx-auto flex h-14 w-full max-w-5xl items-center gap-6 px-6">
        <Link href="/" className="font-semibold tracking-tight">
          RepoRadar
        </Link>
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
