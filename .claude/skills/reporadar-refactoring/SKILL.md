---
name: reporadar-refactoring
description: Step-by-step workflow for refactoring RepoRadar without changing behavior. Use when asked to refactor, clean up, restructure, rename, extract or deduplicate code in this repo. Pairs with the reporadar-architecture skill, which defines the target conventions.
---

# RepoRadar refactoring workflow

A refactor here changes structure, never behavior. Same URLs, same HTML and
metadata, same cache lifetimes and tags, same build output symbols, same
Server Action results. If a step needs a behavior change, stop and ask Oleg.

Read `reporadar-architecture` first; it is the definition of "better".

## 1. Before the first edit

1. `git status` must be clean (untracked editor folders like `.vscode/` are fine).
   Work on the current feature branch; don't create or switch branches unasked.
2. Record a baseline, so you can tell a regression from a pre-existing failure:
   ```sh
   pnpm format:check && pnpm lint && pnpm typecheck && pnpm test
   pnpm build 2>&1 | tee /tmp/reporadar-build-before.txt
   pnpm test:e2e
   ```
   Keep the route table from the build output (`○` / `◐` / `ƒ` per route).
3. Write a short plan: a numbered list of steps, each one small enough to review
   as a single diff (roughly one concern, a handful of files). Show it to Oleg
   before starting if it has more than ~5 steps or touches caching, proxy,
   routing or Server Actions.

## 2. One step at a time

For each step:

1. Make one kind of change only: move, rename, extract, inline, or dedupe.
   Never mix a refactor with a fix or feature. If you find a bug, note it and
   leave it for a separate step Oleg approves.
2. Keep public surfaces stable unless the step is about them: URLs, route
   folder names, query keys, cache `tags`, `cacheLife` profiles, Server Action
   names and return shapes, cookie name and format, `RESERVED_SEGMENTS`, the
   proxy `matcher`.
3. Move tests with the code they test and update imports; don't weaken
   assertions to make them pass.
4. Verify, in this order, stopping at the first failure:
   ```sh
   pnpm format           # Biome; formatting is never a separate review topic
   pnpm lint
   pnpm typecheck        # runs next typegen first
   pnpm test
   pnpm build            # compare route symbols with the baseline
   pnpm test:e2e         # needs the fresh build; real GitHub API
   ```
   Lint, typecheck and unit tests run after every step. Build + e2e run after
   every step that touches `src/app/**`, `src/proxy.ts`, the GitHub entity's cached getters,
   the query client setup, `next.config.ts`, or anything with `"use client"` /
   `"use server"` / `"use cache"`. For pure-module moves covered by unit tests,
   build + e2e can wait until the end of a group of steps.
5. If a check fails and the cause isn't obvious in a couple of tries, revert the
   step (`git restore` / `git checkout -- <files>` on your own uncommitted changes)
   and split it smaller.
6. Report the step to Oleg: what moved, why, check results. He commits; never
   run `git commit` or `git push` yourself unless he says so for that step.

## 3. Feature-folder migration order

Done in M8, except step 7 and `shared/config/env.ts` (both M9). Kept as the
reference for how a migration like this is sequenced.

Move in this order so every step builds and each layer exists before
something depends on it. One bullet is one step (or a few small ones).

1. Add the ESLint boundary rules from reporadar-principles, scoped to the new
   folders only, so they guard the migration from the start.
2. `shared/`: move `skeleton`, `stat`, `modal`, `updated-at`, `og-card`,
   `format`, `get-query-client`, hooks. Extract `getJson` from
   `lib/queries`. Move `site.ts` to `shared/config/` and add
   `shared/config/env.ts` (ADR 0005); switch the `process.env` reads to it in
   a separate step and keep `client.test.ts` env stubs passing.
3. `entities/github/`: move the client, cached getters, tags, types, catalogs,
   `RepoCard`. Add `index.ts` (client-safe: types, catalogs, RepoCard) and
   `server.ts` (cached getters, errors, tags). Move `SEARCH_PER_PAGE`
   so the entity no longer imports from `lib/queries`.
4. `features/watchlist/`: storage, actions, queries, WatchButton, nav link,
   items. Make `sameRepo` and the name check client-safe and delete the copy in
   WatchButton.
5. `features/search/`, then `features/repo/` (sections + preview), then
   `trending`, `leaderboard`, `user`, moving page bodies out of route files.
6. `app/_components/`: Providers and SiteHeader. Delete emptied `lib/`,
   `components/`, `hooks/` folders.
7. Add the coverage threshold (ADR 0006): `pnpm add -D @vitest/coverage-v8`
   (ask Oleg before installing), configure `coverage` in `vitest.config.mts`
   with 80% lines on the ADR's include list, make `pnpm test` run with
   coverage, and add tests if the current code falls short.
8. Widen the ESLint rules to all of `src/`, then update ARCHITECTURE.md, README,
   the old-to-new table in reporadar-architecture, and mark ADR 0002 as done.

Moving a test file with its module counts as part of the same step. Pure moves
change import paths only; any code change inside a moved file is its own step.

## 4. What to watch for in this codebase

- **Server/client boundary.** Moving a helper into a module with
  `import "server-only"`, or importing a barrel that re-exports server-only code from a
  `"use client"` file, breaks the build. Client files import only client-safe
  entry points (`index.ts`), never `server.ts`.
- **Cache keys.** Arguments of a `"use cache"` function are its cache key.
  Changing parameter order or shape silently invalidates and can split caches.
  Keep `tags.*` output identical (lowercased).
- **Query key parity.** Server prefetch and client hooks must build keys from the
  same `xQueryKey` helpers and `parseSearchParams`. A mismatch shows up as a client
  refetch after hydration, not as an error; check the Network tab or e2e.
- **Static shell.** Awaiting `params`/`searchParams` outside `<Suspense>`, or
  moving `cookies()` / `connection()` / `dehydrate()` out of a Suspense boundary,
  turns a `○`/`◐` route into `ƒ` or fails the build with a prerender error.
  Compare the build route table with the baseline.
- **Activity.** Hidden routes keep state; effects must clean up symmetrically.
- **Proxy.** Every redirect and rewrite is covered in `src/proxy.test.ts`. Keep
  those tests green and unchanged in meaning.
- **Rate limits.** Don't add pages to `generateStaticParams` or parallelize
  search calls as part of a refactor.

## 5. Things that are not refactor targets

- The two optimistic patterns, the two loading styles, and the teaching comments
  (see "Deliberate duplicates" in reporadar-architecture).
- Dependency upgrades, Next config changes, and new libraries. Those are separate
  tasks.

## 6. Finishing

1. Full check run (lint, typecheck, unit, build, e2e) and a route-table diff
   against the baseline. Any symbol change must be explained or reverted.
2. If structure or file locations changed, update `docs/ARCHITECTURE.md`
   (diagrams, tables, file paths) and the README if it names files.
3. Summarize for Oleg: the steps, files touched, check results, and any bugs
   noted but not fixed. Leave committing and pushing to him.
