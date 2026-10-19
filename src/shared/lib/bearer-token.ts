import { timingSafeEqual } from "node:crypto";

/**
 * True when an `Authorization: Bearer <token>` header carries `secret`.
 * Compared in constant time so response timing doesn't leak the secret;
 * a missing secret rejects everything.
 */
export function hasBearerToken(header: string | null, secret: string | undefined) {
  if (!secret) return false;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : "";
  const a = Buffer.from(token);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}
