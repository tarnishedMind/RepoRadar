import Image from "next/image";
import Link from "next/link";
import { Skeleton } from "@/components/skeleton";
import { getRepoContributors } from "@/lib/github";

export async function Contributors({ owner, repo }: { owner: string; repo: string }) {
  const contributors = await getRepoContributors(owner, repo);
  if (!contributors?.length) return null;

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500">
        Top contributors
      </h2>
      <ul className="grid grid-cols-6 gap-2">
        {contributors.map((c) => (
          <li key={c.id}>
            <Link href={`/u/${c.login}`} title={`${c.login} · ${c.contributions} commits`}>
              <Image
                src={c.avatar_url}
                alt={c.login}
                width={36}
                height={36}
                className="rounded-full"
              />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ContributorsSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-4 w-32" />
      <div className="grid grid-cols-6 gap-2">
        {Array.from({ length: 12 }, (_, i) => (
          <Skeleton key={i} className="size-9 rounded-full" />
        ))}
      </div>
    </div>
  );
}
