# 0004. Hand-written type guards at trust boundaries

**Status:** Accepted (2026-10-18)

## Context

Untrusted data enters at a few places: Server Action arguments, Route Handler
query strings and bodies, the watchlist cookie, environment variables and
GitHub API responses. Today each is checked with small hand-written guards
(`isRepoFullName`, `parseSearchParams`, the revalidate `TAG_PATTERN`). GitHub
responses are cast to TypeScript types without runtime checks.

A schema library (zod) was considered. It gives one declarative style and
inferred types, but adds a dependency and a refactor of every boundary.

## Decision

Keep hand-written guards. Every boundary takes `unknown`, narrows it with an
`isX(value): value is X` guard or a `parseX(raw): X` normalizer, and rejects or
defaults anything else. Guards are pure, live next to the type they guard, and
have unit tests. GitHub responses stay type-cast: GitHub is a trusted source
and the app degrades through `error.tsx` if a shape changes.

## Consequences

- No new dependency; the pattern is already used everywhere.
- Each guard is code to test and maintain.

## Optional later: zod

zod stays an option, not a plan. Reasons to adopt it: many new boundaries
(forms, more Server Actions or Route Handlers), a wish to validate GitHub
responses at runtime, or guards getting long enough that a schema reads
better. Adopting it means a new record that supersedes this one, then
migrating boundaries one at a time behind the same `parseX` function names
so callers don't change.
