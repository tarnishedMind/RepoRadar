import { readWatchlist } from "@/features/watchlist/server";

/** Lets client components load the (httpOnly) watchlist cookie as JSON. */
export async function GET() {
  return Response.json(await readWatchlist());
}
