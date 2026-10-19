import type { NextRequest } from "next/server";
import { isRepoFullName } from "@/entities/github";
import { GitHubError, getRepo } from "@/entities/github/server";

/** Repo details for client-side prefetching (hover) and the preview modal. */
export async function GET(
  _request: NextRequest,
  ctx: RouteContext<"/api/repos/[owner]/[repo]">,
) {
  const { owner, repo } = await ctx.params;
  // Reject names GitHub can't have before they reach the API path.
  if (!isRepoFullName(`${owner}/${repo}`)) {
    return Response.json({ error: "Repository not found" }, { status: 404 });
  }
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
