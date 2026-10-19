import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { parseRevalidateTags } from "@/entities/github/server";
import { env } from "@/shared/config/env";
import { hasBearerToken } from "@/shared/lib/bearer-token";

/**
 * On-demand revalidation for ISR pages.
 *
 *   curl -X POST http://localhost:3000/api/revalidate \
 *     -H "Authorization: Bearer $REVALIDATE_SECRET" \
 *     -H "Content-Type: application/json" \
 *     -d '{"tags":["trending"]}'
 *
 * Supported tags: trending, trending:<range>, leaderboard, leaderboard:<lang>,
 * repo:<owner>/<name>, user:<login>.
 */
export async function POST(request: NextRequest) {
  if (!hasBearerToken(request.headers.get("authorization"), env.revalidateSecret())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tags = parseRevalidateTags(await request.json().catch(() => null));
  if (!tags) {
    return NextResponse.json(
      { error: "Body must be { tags: string[] } with supported tags only" },
      { status: 400 },
    );
  }

  // "max": serve the stale page while the fresh one regenerates in the background.
  for (const tag of tags) revalidateTag(tag, "max");

  return NextResponse.json({ revalidated: tags, now: new Date().toISOString() });
}
