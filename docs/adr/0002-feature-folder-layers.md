# 0002. Feature folders with four import layers

**Status:** Accepted (2026-10-18), implemented in M8 (2026-10-19)

## Context

After M7 the code is organized by technical kind: `components/`, `hooks/`,
`lib/github`, `lib/queries`, plus route-private files in `app/`. Watchlist
code alone is spread over five folders. The data layer imports from the query
layer (`lib/github/index.ts` → `lib/queries/search-params`), and a helper is
duplicated because its module is server-only. Nothing stops new code from
importing anything.

Full Feature-Sliced Design was considered. Its `app` and `pages` layers clash
with Next.js, where `src/app` is the router.

## Decision

Use four layers, importing only downward:

```
app → features → entities → shared
```

- `app/`: routing files only, plus `app/_components/` for app-wide composition.
- `features/<name>/`: repo, search, watchlist, trending, leaderboard, user.
  Each has `index.ts` (client-safe public API) and `server.ts` (server-only
  public API).
- `entities/github/`: GitHub client, cached getters, cache tags, types, catalogs.
- `shared/`: UI and helpers with no domain knowledge.

Boundaries are enforced with ESLint's built-in `no-restricted-imports` and
`import/no-cycle` (no new dependencies).

## Consequences

- Every file has one obvious home, and lint fails on wrong-way imports.
- Two entry points per feature, because one barrel mixing server-only and
  client code breaks the build when a Client Component imports it.
- A one-time migration, done in small verified steps (see the
  `reporadar-refactoring` skill).
