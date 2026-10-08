import { timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";

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

const TAG_PATTERN =
  /^(trending(:(daily|weekly|monthly))?|leaderboard(:[a-z]+)?|repo:[\w.-]+\/[\w.-]+|user:[\w-]+)$/;

function isAuthorized(request: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) return false;

  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  const a = Buffer.from(token);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { tags?: unknown } | null;
  const tags = Array.isArray(body?.tags) ? body.tags : [];
  const valid = tags
    .filter((t): t is string => typeof t === "string")
    .map((t) => t.toLowerCase())
    .filter((t) => TAG_PATTERN.test(t));

  if (!valid.length || valid.length !== tags.length) {
    return NextResponse.json(
      { error: "Body must be { tags: string[] } with supported tags only" },
      { status: 400 },
    );
  }

  // "max": serve the stale page while the fresh one regenerates in the background.
  for (const tag of valid) revalidateTag(tag, "max");

  return NextResponse.json({ revalidated: valid, now: new Date().toISOString() });
}
