---
name: reporadar-principles
description: Structural principles for RepoRadar - feature-folder layout (src/features, src/entities, src/shared), layer and import rules, public APIs, and how KISS, DRY, SOLID and Clean Architecture apply here. Read before creating files or folders, moving code, or adding an abstraction.
---

# RepoRadar structural principles

Decisions behind these rules are recorded in `docs/adr/` (0002 layers, 0003
cross-feature imports, 0004 validation, 0005 env, 0006 coverage). Don't change a rule here
without a new ADR.

Goal: anyone (human or agent) can predict where a file lives, what it may
import, and what it exposes. Rules here are enforced by ESLint and the build
wherever possible; a rule that can't be enforced is kept short.

## 1. Layers

```
src/
  app/        routing only: page, layout, route, loading, error, metadata files
    _components/   app-wide composition (Providers, SiteHeader); private folder, not a route
  features/   one folder per user-facing capability
    repo/  search/  watchlist/  trending/  leaderboard/  user/
  entities/   domain data shared by several features
    github/   GitHub client, cached getters, cache tags, types, catalogs, RepoCard
  shared/     no domain knowledge at all
    ui/       Skeleton, Stat, Modal, UpdatedAt, OgCard
    lib/      format, get-query-client, get-json
    config/   env.ts (server-only secrets), site.ts (public URL, reserved segments)
    hooks/    use-hydrated, use-in-view
  proxy.ts    stays at src/ root (Next requires it)
```

Imports go strictly downward: `app → features → entities → shared`.
A layer never imports from a layer above it.

| Layer | May import | Must not |
| --- | --- | --- |
| `app` | features, entities, shared | hold business logic or markup longer than layout glue |
| `features/x` | other features' public API (ADR 0003), entities, shared | deep-import another feature; form an import cycle |
| `entities` | shared | know about features, routes or React Query keys of features |
| `shared` | npm packages only | import anything from `@/app`, `@/features`, `@/entities` |

Route files stay thin: read `params`/`searchParams`, call one feature
component or function, export metadata. Suspense boundaries and
`generateStaticParams` stay in the route file because they describe routing.

## 2. Feature anatomy

```
features/watchlist/
  index.ts          client-safe public API (components, hooks, query options, types)
  server.ts         server-only public API ("server-only"; cached reads, storage)
  actions.ts        Server Actions ("use server"), re-exported from index.ts
  watch-button.tsx  internals: imported by siblings with relative paths
  storage.ts        internals
  queries.ts
  *.test.ts         next to what they test
```

- Two entry points because a barrel that mixes server-only and client code
  breaks the build when a Client Component imports it. `index.ts` must never
  re-export anything that imports `server-only`, `next/headers` or secrets.
- Outside a feature, import only `@/features/x` or `@/features/x/server`.
  Inside, use relative imports.
- A feature owns its query keys and options (`watchlistQueryOptions` lives in
  `features/watchlist`). Keys stay namespaced by feature (`["watchlist"]`,
  `["search", params]`) so they can't collide.
- Create a new feature when a capability has its own route or its own state.
  Otherwise add to the closest existing feature.
- Code used by exactly one feature stays in it. Move it to `entities` only when a
  second feature needs the same domain data, and to `shared` only when it has no
  domain knowledge.

## 3. Enforcement (ESLint, no new dependencies)

Added to `eslint.config.mjs` with built-in `no-restricted-imports` and
`import/no-cycle` (eslint-plugin-import ships with eslint-config-next):

- Everywhere: forbid `@/features/*/*` except `@/features/*/server`.
- `src/shared/**`: forbid `@/app/**`, `@/features/**`, `@/entities/**`.
- `src/entities/**`: forbid `@/app/**`, `@/features/**`.
- `src/features/**`: forbid `@/app/**`.
- `import/no-cycle` on `src/**`.
- `server-only` stays the hard guard for secrets and cookies.

If a rule blocks a legitimate change, change the structure or ask Oleg. Don't
use an eslint-disable comment.

## 4. How the classic principles apply here

**KISS / YAGNI.** No state library, DI container, repository interfaces,
service classes or generic "base" components. An abstraction needs two real
callers today. Plain functions and modules beat classes (the GitHub error
classes are the exception: `instanceof` checks need them).

**DRY: one source of truth for anything that must agree:**
query keys, cache tags (`tags.*`), cache lifetimes, reserved URL segments,
repo-name validation, search-param parsing, catalogs. Duplicated knowledge is
a bug waiting to happen. Duplicated markup is not: extract UI only at the
third copy, and only if the copies would change together.

**SOLID, at module level:**
- Single responsibility: one module, one reason to change (the client does HTTP,
  `entities/github` does caching policy, features do UI + state).
- Open/closed: extend `as const` catalogs (`LANGUAGES`, `TRENDING_RANGES`,
  `SEARCH_SORTS`) instead of adding branches.
- Dependency inversion: features depend on `entities/github` functions, never
  on `fetch` or the GitHub URL shape.
- Liskov and interface segregation rarely matter in function-based React; keep
  props minimal and typed, and don't pass whole objects when a field will do
  across the server/client boundary.

**Clean Architecture, the useful part:** pure logic (parsing, validation,
paging, URL rules, list operations) lives in framework-free modules with no
imports from `next/*` or `react`, so it's unit-testable in plain Node. Next and
React APIs sit at the edges: route files, Server Actions, Route Handlers,
components.

## 5. Patterns to reuse (name them in code review)

- **Adapter:** `entities/github/client.ts` wraps GitHub HTTP, errors and rate limits.
- **Facade:** `entities/github` public API with cached getters.
- **Options factory:** `xQueryOptions()` shared by server prefetch and client hooks.
- **Server container + client leaf:** async Server Component fetches, small
  `"use client"` child handles interaction.
- **Result object:** Server Actions return `{ ok: true, ... } | { ok: false, error }`.
- **Guarded lookup table:** `as const` object + key type + `isX` guard.

## 6. Trust boundaries and configuration

- **Validation (ADR 0004).** Server Action arguments, Route Handler input,
  cookies and request bodies arrive as `unknown`. Narrow them with a pure
  `isX(value): value is X` guard or a `parseX(raw): X` normalizer that lives
  next to the type, has unit tests, and rejects or defaults anything else.
  No schema library for now; zod is an optional later step that needs a new
  ADR (see 0004). GitHub responses are typed by cast.
- **Environment (ADR 0005).** `process.env` is read only in
  `shared/config/env.ts` (server-only: `GITHUB_TOKEN`, `REVALIDATE_SECRET`) and
  `shared/config/site.ts` (public URL). Expose values through functions so
  `vi.stubEnv` works in tests; treat empty strings as unset; list every variable
  in `.env.example`. `NODE_ENV` checks may stay inline.

## 7. Code-level rules

- TypeScript strict; no `any`, no non-null `!` outside tests; prefer `unknown` +
  a type guard at trust boundaries (cookies, request bodies, action arguments).
- Functions over ~40 lines or components over ~150 lines are a signal to split.
- Comments explain why (or which Next.js feature is being shown), not what.
- Errors: data layer throws typed errors or returns `null` for "not found";
  actions return results; UI shows them through `error.tsx` or inline messages.
