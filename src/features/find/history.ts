import { normalizeRequest, parseFindQuery } from "./intent";

/**
 * Pure logic for the /find history kept in localStorage. localStorage is
 * user-editable, so whatever comes back is validated like any other input
 * (ADR 0004).
 */

export const HISTORY_LIMIT = 10;

export interface HistoryEntry {
  query: string;
  /** When it was last searched, ms since epoch. */
  at: number;
}

/** Validates stored history: well-formed entries only, newest first, no duplicates. */
export function parseHistory(raw: unknown): HistoryEntry[] {
  if (!Array.isArray(raw)) return [];
  const entries = raw
    .filter(
      (e): e is HistoryEntry =>
        typeof e === "object" &&
        e !== null &&
        typeof e.query === "string" &&
        typeof e.at === "number" &&
        Number.isFinite(e.at),
    )
    .map((e) => ({ query: parseFindQuery(e.query), at: e.at }))
    .filter((e) => e.query)
    .sort((a, b) => b.at - a.at);
  const seen = new Set<string>();
  return entries
    .filter((e) => {
      const key = normalizeRequest(e.query);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, HISTORY_LIMIT);
}

/**
 * Puts a query at the top. Searching the same thing again (any case or
 * spacing) moves it up instead of adding a copy. Oldest entries fall off.
 */
export function addToHistory(history: HistoryEntry[], query: string, at: number): HistoryEntry[] {
  const clean = parseFindQuery(query);
  if (!clean) return history;
  const key = normalizeRequest(clean);
  return [{ query: clean, at }, ...history.filter((e) => normalizeRequest(e.query) !== key)].slice(
    0,
    HISTORY_LIMIT,
  );
}

export function removeFromHistory(history: HistoryEntry[], query: string): HistoryEntry[] {
  const key = normalizeRequest(query);
  return history.filter((e) => normalizeRequest(e.query) !== key);
}
