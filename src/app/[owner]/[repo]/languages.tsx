import { Skeleton } from "@/components/skeleton";
import { getRepoLanguages } from "@/lib/github";

const COLORS = [
  "bg-sky-500",
  "bg-amber-500",
  "bg-emerald-500",
  "bg-rose-500",
  "bg-violet-500",
  "bg-zinc-400",
];

export async function Languages({ owner, repo }: { owner: string; repo: string }) {
  const languages = await getRepoLanguages(owner, repo);
  const entries = Object.entries(languages ?? {}).sort(([, a], [, b]) => b - a);
  const total = entries.reduce((sum, [, bytes]) => sum + bytes, 0);
  if (!total) return null;

  // Keep the top five and fold the long tail into "Other".
  const top = entries.slice(0, 5).map(([name, bytes]) => ({ name, share: bytes / total }));
  const rest = 1 - top.reduce((sum, l) => sum + l.share, 0);
  if (rest > 0.001) top.push({ name: "Other", share: rest });

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500">
        Languages
      </h2>
      <div className="flex h-2 overflow-hidden rounded-full">
        {top.map((l, i) => (
          <div key={l.name} className={COLORS[i]} style={{ width: `${l.share * 100}%` }} />
        ))}
      </div>
      <ul className="flex flex-col gap-1 text-sm">
        {top.map((l, i) => (
          <li key={l.name} className="flex items-center gap-2">
            <span className={`size-2 rounded-full ${COLORS[i]}`} />
            <span>{l.name}</span>
            <span className="ml-auto tabular-nums text-zinc-500">
              {(l.share * 100).toFixed(1)}%
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function LanguagesSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-2 w-full" />
      {Array.from({ length: 4 }, (_, i) => (
        <Skeleton key={i} className="h-4 w-full" />
      ))}
    </div>
  );
}
