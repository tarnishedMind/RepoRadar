# 0006. Unit test coverage threshold for core logic

**Status:** Accepted (2026-10-18), implemented in M9 (2026-10-19)

## Context

Unit tests cover the GitHub client, search params, paging, watchlist storage
and the proxy, but nothing stops new logic from landing without tests. UI is
covered by Playwright smoke tests, so line coverage of components would be
noise.

## Decision

- Use Vitest coverage with the V8 provider (`@vitest/coverage-v8`, dev only).
- Measure `src/entities/**`, `src/proxy.ts` and the pure, framework-free
  modules in `src/features/**` (parsers, guards, list and paging logic).
  Exclude `*.tsx`, `index.ts`/`server.ts` re-export files, Server Actions and
  Route Handlers.
- Fail below 80% of lines for that set. `pnpm test` runs with coverage, so CI
  enforces it.
- Added after the feature-folder migration creates `src/entities/`
  (ADR 0002); until then the threshold would measure folders that don't exist.

## Consequences

- New core logic needs tests to merge. Lowering the threshold needs a new record.
- 80% is a floor, not a target; don't write tests just to move the number.
