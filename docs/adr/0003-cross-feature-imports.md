# 0003. Features may import each other through their public API

**Status:** Accepted (2026-10-18)

## Context

`WatchButton` (watchlist) is used inside search result cards (search) and on
the repo page (repo). Strict FSD forbids feature-to-feature imports and would
move that composition to `app/` or a separate `widgets` layer.

## Decision

A feature may import another feature, but only through `@/features/<name>`
(or `@/features/<name>/server` from server code). Deep imports into another
feature's files are forbidden, and import cycles are a lint error.

## Consequences

- No extra layer and no prop-drilling of slots just to keep features apart.
- A feature's `index.ts` is a contract: changing it means checking its users.
- If two features start depending on each other in both directions, the shared
  part moves down to `entities` or `shared`.
