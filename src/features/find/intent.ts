import {
  type GitHubRepo,
  isLanguageSlug,
  LANGUAGES,
  type LanguageSlug,
  type RepoSearchParams,
} from "@/entities/github";

/**
 * Pure logic for /find: normalizing the request, validating what the model
 * returns (ADR 0004/0008: model output is untrusted input) and turning it into
 * GitHub searches. No Next or React imports, so it is unit-tested in plain Node.
 */

export const FIND_MAX_LENGTH = 200;
/** Repositories handed to the model for picking, and shown without AI. */
export const FIND_CANDIDATES = 20;
/** Best matches the model may pick, each with a reason. */
export const FIND_MAX_PICKS = 10;
const MAX_KEYWORDS = 4;
const MAX_TOPICS = 2;
const MAX_REASON = 200;
/** Keeps very small or abandoned projects out of every /find search. */
const QUALIFIERS = "archived:false stars:>=50";

export interface FindIntent {
  keywords: string[];
  language: LanguageSlug | "";
  topics: string[];
}

export interface FindPick {
  fullName: string;
  reason: string;
}

/** The `q` param as typed: trimmed, single-spaced and capped. */
export function parseFindQuery(raw: string | string[] | undefined): string {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return (value ?? "").replace(/\s+/g, " ").trim().slice(0, FIND_MAX_LENGTH);
}

/** Cache key for a request: case and spacing don't create new model calls. */
export function normalizeRequest(query: string): string {
  return parseFindQuery(query).toLowerCase();
}

// Letters, digits and a few joiners ("c++", "c#", "next.js", "real-time"). No ":"
// so a keyword can never become a GitHub search qualifier.
const KEYWORD = /^[\p{L}\p{N}][\p{L}\p{N} .+#-]{0,39}$/u;
const TOPIC = /^[a-z0-9][a-z0-9-]{0,49}$/;

function cleanList(raw: unknown, pattern: RegExp, max: number): string[] {
  if (!Array.isArray(raw)) return [];
  const values = raw
    .filter((v): v is string => typeof v === "string")
    .map((v) => v.trim().toLowerCase())
    .filter((v) => pattern.test(v));
  return [...new Set(values)].slice(0, max);
}

/** Validates the model's interpretation. Null when there is nothing to search for. */
export function parseIntent(raw: unknown): FindIntent | null {
  if (typeof raw !== "object" || raw === null) return null;
  const { keywords, language, topics } = raw as Record<string, unknown>;
  const intent: FindIntent = {
    keywords: cleanList(keywords, KEYWORD, MAX_KEYWORDS),
    language: typeof language === "string" && isLanguageSlug(language) ? language : "",
    topics: cleanList(topics, TOPIC, MAX_TOPICS),
  };
  return intent.keywords.length || intent.topics.length ? intent : null;
}

/** JavaScript and TypeScript share one ecosystem: a JS request should find TS-written libraries. */
const JS_FAMILY = ["javascript", "typescript"];

function languageQualifier(lang: LanguageSlug | ""): string {
  if (!lang) return "";
  // Repeating `language:` means OR in GitHub search.
  if (JS_FAMILY.includes(lang)) return JS_FAMILY.map((l) => ` language:${l}`).join("");
  return ` language:"${LANGUAGES[lang]}"`;
}

/**
 * One keyword search plus one search per topic, most stars first: for "find me a
 * library" requests popularity beats GitHub's best match, which favors repos
 * that merely have the words in their name. The model then reranks the merge.
 */
export function buildSearches(intent: FindIntent): RepoSearchParams[] {
  const queries = [
    ...(intent.keywords.length ? [intent.keywords.join(" ")] : []),
    ...intent.topics.map((t) => `topic:${t}`),
  ];
  const suffix = `${languageQualifier(intent.language)} ${QUALIFIERS}`;
  return queries.map((q) => ({ q: `${q}${suffix}`, sort: "stars", lang: "" }));
}

const STOPWORDS = new Set(
  (
    "i me my we need want looking look for find a an the some any that which who works work " +
    "working with to of in on and or is are be can could should would something library " +
    "libraries lib tool tools package packages repo repos repository project please good best"
  ).split(" "),
);

/** Without the model: a plain keyword search on the request minus filler words. */
export function fallbackSearch(query: string): RepoSearchParams {
  const words = normalizeRequest(query)
    .split(/[^\p{L}\p{N}.+#-]+/u)
    .filter((w) => w && !STOPWORDS.has(w))
    .slice(0, 6);
  const q = words.length ? words.join(" ") : normalizeRequest(query);
  return { q: `${q} ${QUALIFIERS}`, sort: "best-match", lang: "" };
}

/** Interleaves result lists (first of each, then second of each, …), deduplicated. */
export function mergeResults(lists: readonly (readonly GitHubRepo[])[], limit = FIND_CANDIDATES) {
  const seen = new Set<number>();
  const merged: GitHubRepo[] = [];
  const longest = Math.max(0, ...lists.map((l) => l.length));
  for (let i = 0; i < longest && merged.length < limit; i++) {
    for (const list of lists) {
      const repo = list[i];
      if (!repo || seen.has(repo.id)) continue;
      seen.add(repo.id);
      merged.push(repo);
      if (merged.length === limit) break;
    }
  }
  return merged;
}

/**
 * Validates the model's picks: only repositories we actually showed it, each
 * once, with a short plain-text reason. Names come back in our own casing.
 */
export function parsePicks(raw: unknown, candidates: readonly string[]): FindPick[] {
  const picks =
    typeof raw === "object" && raw !== null ? (raw as Record<string, unknown>).picks : undefined;
  if (!Array.isArray(picks)) return [];
  const byLower = new Map(candidates.map((name) => [name.toLowerCase(), name]));
  const result: FindPick[] = [];
  for (const pick of picks) {
    if (typeof pick !== "object" || pick === null) continue;
    const { repo, reason } = pick as Record<string, unknown>;
    if (typeof repo !== "string" || typeof reason !== "string") continue;
    const fullName = byLower.get(repo.trim().toLowerCase());
    const text = reason.replace(/\s+/g, " ").trim().slice(0, MAX_REASON);
    if (!fullName || !text || result.some((p) => p.fullName === fullName)) continue;
    result.push({ fullName, reason: text });
    if (result.length === FIND_MAX_PICKS) break;
  }
  return result;
}
