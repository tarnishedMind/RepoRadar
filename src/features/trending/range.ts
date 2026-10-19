import { isTrendingRange, type TrendingRange } from "@/entities/github";

const DEFAULT_RANGE: TrendingRange = "weekly";

/** `/trending` → weekly, `/trending/daily` → daily, anything else → 404. */
export function parseRange(segments: string[] | undefined): TrendingRange | null {
  if (!segments?.length) return DEFAULT_RANGE;
  const [range, ...rest] = segments;
  return rest.length === 0 && isTrendingRange(range) ? range : null;
}
