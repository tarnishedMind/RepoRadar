import { ImageResponse } from "next/og";
import { OgCard, ogSize } from "@/components/og/og-card";
import { formatCount } from "@/lib/format";
import { getUser } from "@/lib/github";

export const alt = "GitHub profile on RepoRadar";
export const size = ogSize;
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ login: string }> }) {
  const { login } = await params;
  const user = await getUser(login).catch(() => null);

  return new ImageResponse(
    user ? (
      <OgCard
        eyebrow={`@${user.login}`}
        title={user.name ?? user.login}
        description={user.bio}
        avatarUrl={user.avatar_url}
        stats={[
          { label: "Followers", value: formatCount(user.followers) },
          { label: "Public repos", value: formatCount(user.public_repos) },
        ]}
      />
    ) : (
      <OgCard eyebrow="GitHub profile" title={`@${login}`} />
    ),
    size,
  );
}
