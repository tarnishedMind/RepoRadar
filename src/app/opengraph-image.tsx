import { ImageResponse } from "next/og";
import { OgCard, ogSize } from "@/shared/ui/og-card";

// Default share image for every page that doesn't define its own.
export const alt = "RepoRadar: explore GitHub repositories and what's trending";
export const size = ogSize;
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <OgCard
        eyebrow="Explore GitHub"
        title="RepoRadar"
        description="Repositories, developers, trending projects and language leaderboards."
      />
    ),
    size,
  );
}
