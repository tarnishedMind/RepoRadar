import Image from "next/image";
import { notFound } from "next/navigation";
import { RepoCard } from "@/entities/github";
import { getUser, getUserRepos } from "@/entities/github/server";
import { formatCount, formatDate } from "@/shared/lib/format";
import { Stat } from "@/shared/ui/stat";

export async function UserProfile({ login }: { login: string }) {
  // Start both requests at once instead of waterfalling.
  const [user, repos] = await Promise.all([getUser(login), getUserRepos(login)]);
  if (!user) notFound();

  const topRepos = (repos ?? [])
    .filter((r) => !r.fork)
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, 12);
  const totalStars = (repos ?? []).reduce((sum, r) => sum + r.stargazers_count, 0);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 py-10">
      <header className="flex flex-col gap-6 sm:flex-row sm:items-center">
        <Image
          src={user.avatar_url}
          alt=""
          width={96}
          height={96}
          className="rounded-full"
          priority
        />
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            {user.name ?? user.login}
            {user.name && <span className="ml-2 font-normal text-zinc-500">@{user.login}</span>}
          </h1>
          {user.bio && <p className="max-w-2xl text-zinc-600 dark:text-zinc-400">{user.bio}</p>}
          <p className="flex flex-wrap gap-x-4 text-sm text-zinc-500">
            {user.location && <span>{user.location}</span>}
            {user.company && <span>{user.company}</span>}
            <span>Joined {formatDate(user.created_at)}</span>
            <a href={user.html_url} className="underline" target="_blank" rel="noreferrer">
              GitHub
            </a>
          </p>
        </div>
      </header>

      <div className="flex flex-wrap gap-8">
        <Stat label="Public repos" value={formatCount(user.public_repos)} />
        <Stat label="Followers" value={formatCount(user.followers)} />
        <Stat label="Following" value={formatCount(user.following)} />
        <Stat label="Stars (top 100 repos)" value={formatCount(totalStars)} />
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500">
          Top repositories
        </h2>
        {topRepos.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {topRepos.map((repo) => (
              <RepoCard key={repo.id} repo={repo} />
            ))}
          </div>
        ) : (
          <p className="text-zinc-500">No public repositories yet.</p>
        )}
      </section>
    </main>
  );
}
