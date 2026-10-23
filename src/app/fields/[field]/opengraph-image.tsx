import { ImageResponse } from "next/og";
import { FIELDS, isFieldSlug } from "@/entities/github";
import { getFieldRepos } from "@/entities/github/server";
import { formatCount } from "@/shared/lib/format";
import { OgCard, ogSize } from "@/shared/ui/og-card";

export const alt = "Top repositories for a developer field on RepoRadar";
export const size = ogSize;
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ field: string }> }) {
  const { field } = await params;
  if (!isFieldSlug(field)) {
    return new ImageResponse(<OgCard eyebrow="Repos by field" title="RepoRadar" />, size);
  }

  // Same cached read as the page, so this costs no extra GitHub requests.
  const top = (await getFieldRepos(field).catch(() => null))?.repos[0];

  return new ImageResponse(
    <OgCard
      eyebrow="Repos by field"
      title={`Top ${FIELDS[field].label} repositories`}
      description={FIELDS[field].description}
      stats={
        top
          ? [
              { label: "Top repo", value: top.full_name },
              { label: "Stars", value: formatCount(top.stargazers_count) },
            ]
          : []
      }
    />,
    size,
  );
}
