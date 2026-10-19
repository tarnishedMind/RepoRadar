# 0005. One typed module for environment variables

**Status:** Accepted (2026-10-18)

## Context

`process.env` is read in four places (`lib/github/client.ts`,
`api/revalidate/route.ts`, `lib/site.ts`, `lib/watchlist.ts`). Names are
strings repeated across files, optional values are handled ad hoc, and nothing
documents which variables exist besides `.env.example`.

## Decision

- Server-only variables (`GITHUB_TOKEN`, `REVALIDATE_SECRET`) are read only in
  `src/shared/config/env.ts`, which starts with `import "server-only"`.
- Public and platform variables (`NEXT_PUBLIC_SITE_URL`,
  `VERCEL_PROJECT_PRODUCTION_URL`) are read only in
  `src/shared/config/site.ts`, which is client-safe.
- Values are read through small functions (`env.githubToken()`), not captured
  at import time, so tests can still use `vi.stubEnv`.
- Empty strings count as unset. `NODE_ENV` checks may stay inline.
- `.env.example` lists every variable the module reads.

## Consequences

- One place to see and document configuration; a typo is a type error.
- Secrets can't reach the client: importing `env.ts` from a Client Component
  fails the build.
