import Link from "next/link";
import type { GitHubRepo } from "@/lib/github/types";
import { formatCount } from "@/lib/format";

export function RepoCard({
  repo,
  showOwner = false,
}: {
  repo: GitHubRepo;
  showOwner?: boolean;
}) {
  return (
    <Link
      href={`/${repo.full_name}`}
      className="flex flex-col gap-2 rounded-lg border border-zinc-200 p-4 transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
    >
      <span className="font-medium">
        {showOwner && <span className="text-zinc-500">{repo.owner.login} / </span>}
        {repo.name}
      </span>
      {repo.description && (
        <span className="line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
          {repo.description}
        </span>
      )}
      <span className="mt-auto flex gap-4 text-xs text-zinc-500">
        {repo.language && <span>{repo.language}</span>}
        <span>★ {formatCount(repo.stargazers_count)}</span>
        <span>⑂ {formatCount(repo.forks_count)}</span>
      </span>
    </Link>
  );
}
