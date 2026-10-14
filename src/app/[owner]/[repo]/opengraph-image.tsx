import { ImageResponse } from "next/og";
import { OgCard, ogSize } from "@/components/og/og-card";
import { formatCount } from "@/lib/format";
import { getRepo } from "@/lib/github";

// Generated per repository from the same cached getRepo() the page uses, so
// rendering the image doesn't cost an extra GitHub request.
export const alt = "Repository overview on RepoRadar";
export const size = ogSize;
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ owner: string; repo: string }>;
}) {
  const { owner, repo } = await params;
  const data = await getRepo(owner, repo).catch(() => null);

  return new ImageResponse(
    data ? (
      <OgCard
        eyebrow={data.owner.login}
        title={data.name}
        description={data.description}
        avatarUrl={data.owner.avatar_url}
        stats={[
          { label: "Stars", value: formatCount(data.stargazers_count) },
          { label: "Forks", value: formatCount(data.forks_count) },
          ...(data.language ? [{ label: "Language", value: data.language }] : []),
        ]}
      />
    ) : (
      <OgCard eyebrow={owner} title={repo} />
    ),
    size,
  );
}
