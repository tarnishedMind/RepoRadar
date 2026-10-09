import "server-only";

import { cookies } from "next/headers";

/**
 * The watchlist lives in a cookie: no accounts or database needed, and it
 * travels with every request so Server Components can read it.
 */

export const WATCHLIST_COOKIE = "watchlist";
export const WATCHLIST_LIMIT = 50;

const FULL_NAME = /^[\w.-]{1,39}\/[\w.-]{1,100}$/;

export function isRepoFullName(value: unknown): value is string {
  return typeof value === "string" && FULL_NAME.test(value);
}

function parse(raw: string | undefined): string[] {
  if (!raw) return [];
  try {
    const value: unknown = JSON.parse(raw);
    return Array.isArray(value) ? value.filter(isRepoFullName).slice(0, WATCHLIST_LIMIT) : [];
  } catch {
    return [];
  }
}

/** Reads the watchlist from the incoming request (a runtime API). */
export async function readWatchlist() {
  return parse((await cookies()).get(WATCHLIST_COOKIE)?.value);
}

/** Writes the watchlist. Only allowed in Server Actions and Route Handlers. */
export async function writeWatchlist(list: string[]) {
  (await cookies()).set(WATCHLIST_COOKIE, JSON.stringify(list), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

export function sameRepo(a: string, b: string) {
  return a.toLowerCase() === b.toLowerCase();
}
