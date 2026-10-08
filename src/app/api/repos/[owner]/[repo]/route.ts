import type { NextRequest } from "next/server";
import { GitHubError, getRepo } from "@/lib/github";

/** Repo details for client-side prefetching (hover) and the preview modal. */
export async function GET(
  _request: NextRequest,
  ctx: RouteContext<"/api/repos/[owner]/[repo]">,
) {
  const { owner, repo } = await ctx.params;
  try {
    const data = await getRepo(owner, repo);
    return data
      ? Response.json(data)
      : Response.json({ error: "Repository not found" }, { status: 404 });
  } catch (error) {
    if (error instanceof GitHubError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
