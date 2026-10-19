import type { Metadata } from "next";
import { Suspense } from "react";
import { getRepo } from "@/entities/github/server";
import { RepoSkeleton, RepoView } from "@/features/repo/server";

type Props = PageProps<"/[owner]/[repo]">;

// Prerender a few popular repos at build time. Any other repo is rendered on its
// first visit (the static shell streams immediately) and then cached, i.e. ISR.
export function generateStaticParams() {
  return [
    { owner: "vercel", repo: "next.js" },
    { owner: "facebook", repo: "react" },
  ];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { owner, repo } = await params;
  const data = await getRepo(owner, repo);
  if (!data) return { title: "Repository not found" };

  return {
    title: data.full_name,
    description:
      data.description ?? `${data.full_name} on GitHub, explored with RepoRadar.`,
    openGraph: {
      title: data.full_name,
      description: data.description ?? undefined,
    },
  };
}

export default function RepoPage({ params }: Props) {
  // `params` is passed down unawaited so the await happens inside <Suspense>:
  // the page's static shell (layout + skeleton) can be served before the repo
  // is known.
  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-10">
      <Suspense fallback={<RepoSkeleton />}>
        <RepoView params={params} />
      </Suspense>
    </main>
  );
}
