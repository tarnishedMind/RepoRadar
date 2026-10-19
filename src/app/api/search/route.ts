import type { NextRequest } from "next/server";
import { GitHubError, searchRepositories } from "@/entities/github/server";
import { parseSearchPage, parseSearchParams } from "@/features/search";

/** Backs the client-side infinite query. Keeps the GitHub token on the server. */
export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const params = parseSearchParams(sp);
  const page = parseSearchPage(sp.get("page"));

  if (!params.q) {
    return Response.json({ error: "Missing q" }, { status: 400 });
  }
  if (page === null) {
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
