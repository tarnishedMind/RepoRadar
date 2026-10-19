import type { NextRequest } from "next/server";
import { SEARCH_MAX_RESULTS, SEARCH_PER_PAGE } from "@/entities/github";
import { GitHubError, searchRepositories } from "@/entities/github/server";
import { parseSearchParams } from "@/features/search";

/** Backs the client-side infinite query. Keeps the GitHub token on the server. */
export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const params = parseSearchParams(sp);
  const page = Math.max(1, Number.parseInt(sp.get("page") ?? "1", 10) || 1);

  if (!params.q) {
    return Response.json({ error: "Missing q" }, { status: 400 });
  }
  if (page * SEARCH_PER_PAGE > SEARCH_MAX_RESULTS + SEARCH_PER_PAGE) {
    return Response.json({ error: "Page out of range" }, { status: 400 });
  }

  try {
    return Response.json(await searchRepositories(params, page));
  } catch (error) {
    if (error instanceof GitHubError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
