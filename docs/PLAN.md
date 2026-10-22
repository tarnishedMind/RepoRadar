# RepoRadar — Feature & Milestone Plan

RepoRadar explores GitHub repositories, developers and what's trending, built on the
public GitHub REST API. It is a portfolio project meant to exercise the modern
Next.js App Router end to end.

**Stack:** Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind CSS v4,
TanStack Query v5, pnpm, Node 22. Deploys to Vercel.

## Feature map → Next.js concepts

| Feature | Route | Concepts showcased |
| --- | --- | --- |
| Repo detail page | `/[owner]/[repo]` | Server Components, SSR, `generateMetadata`, dynamic OG image, streaming with `<Suspense>` (README, contributors, languages load independently) |
| User / org profile | `/u/[login]` | SSR, parallel data fetching, `loading.tsx`, `error.tsx`, `not-found.tsx` |
| Trending | `/trending/[[...range]]` | ISR (`revalidate`), `generateStaticParams` for daily/weekly/monthly |
| Language leaderboards | `/languages/[lang]` | ISR + `cacheTag`, on-demand revalidation via `POST /api/revalidate` route handler (secret-protected, `revalidateTag`) |
| Repos by field | `/fields/[field]` | Parallel cached fan-out (`Promise.all` of searches inside one `"use cache"` read), ISR + `generateStaticParams`, per-field OG image |
| Describe it | `/find?q=…` | `next/form` GET search, nested `<Suspense>` streaming (repos first, AI reasons after), `"use cache"` around an LLM call, untrusted model output validated at the boundary, graceful fallback |
| Search | `/search` | TanStack Query `useInfiniteQuery` infinite scroll, URL-synced filters, server prefetch + `HydrationBoundary` |
| Repo preview modal | `@modal/(..)[owner]/[repo]` | Parallel routes + intercepting routes: modal on soft nav, full page on hard nav/refresh |
| Hover prefetch | repo cards | `queryClient.prefetchQuery` on hover, plus `<Link>` prefetch |
| Watchlist / stars | `/watchlist` | Server Actions, `useOptimistic` and TanStack optimistic mutations with rollback, cookie-backed storage |
| Rate limit & locale guard | `src/proxy.ts` | Proxy (formerly middleware): request headers, redirects, lightweight rate-limit header surfacing |
| API layer | `src/entities/github` | Typed fetch wrapper, `cacheLife` / `cacheTag`, optional `GITHUB_TOKEN` for higher limits |

## Phases

Milestones are numbered globally (M0, M1, …) so commit prefixes like `M7:` stay
unique; phases group them.

| Phase | Goal | Milestones | Status |
| --- | --- | --- | --- |
| 1. Showcase MVP | Every core App Router feature working end to end | M0–M7 | ✅ Done |
| 2. Architecture & quality | Predictable structure, enforced boundaries, tested core, consistent formatting | M8–M10 | ✅ Done |
| 3. Discovery | New ways to find repositories, as separate routes next to the existing ones | M11–M12 | ✅ Done |

Structural decisions are recorded in [docs/adr/](adr/README.md).

## Phase 1 — Showcase MVP ✅

### M0 — Foundation ✅
- Scaffold Next.js 16 + TypeScript + Tailwind, pnpm, `.nvmrc` (Node 22)
- TanStack Query provider (`QueryClient` per request on server, singleton in browser), devtools
- This plan

### M1 — GitHub data layer & repo/user pages ✅
- Typed GitHub client (`src/lib/github`), env config, error mapping (404, rate limit)
- `/[owner]/[repo]` and `/u/[login]` as Server Components with `generateMetadata`
- `loading.tsx`, `error.tsx`, `not-found.tsx`; streamed sections with Suspense

### M2 — Trending & leaderboards (ISR) ✅
- Trending page using the search API (`created:>date sort:stars`) with time-based revalidation
- Language leaderboards with `cacheTag` and `POST /api/revalidate` for on-demand revalidation
- `generateStaticParams` for popular languages

### M3 — Search with TanStack Query ✅
- Server-prefetched first page + `HydrationBoundary`
- `useInfiniteQuery` with IntersectionObserver infinite scroll, URL-synced query/filters
- Prefetch repo details on card hover

### M4 — Repo preview modal ✅
- `@modal` parallel slot + `(..)` intercepting route for repo preview
- `default.tsx` fallbacks, close on back navigation

### M5 — Watchlist, Server Actions & optimistic UI ✅
- Watchlist stored in a cookie (no auth needed), mutated via Server Actions
- Optimistic star/watch toggles with TanStack `useMutation` (`onMutate` / rollback) and `useOptimistic`

### M6 — Proxy, metadata polish, OG images ✅
- `proxy.ts`: normalize routes (e.g. `/owner/repo.git` → `/owner/repo`), attach headers
- `opengraph-image.tsx` for repo and user pages, sitemap, robots

### M7 — Quality & deploy ✅
- Unit tests (Vitest) for the data layer, Playwright smoke tests
- GitHub Actions CI (lint, typecheck, build)
- Deployed to Vercel: https://repo-radar-eta.vercel.app/
- README with screenshots and architecture notes

## Phase 2 — Architecture & quality ✅

### M8 — Feature folders ✅
ADRs [0002](adr/0002-feature-folder-layers.md), [0003](adr/0003-cross-feature-imports.md).
Follow the `reporadar-refactoring` skill: small behavior-preserving steps.
- ESLint boundary rules (`no-restricted-imports`, `import/no-cycle`)
- `src/shared` (ui, lib, hooks, config), `src/entities/github`
- `src/features/{watchlist,search,repo,trending,leaderboard,user}` with `index.ts` / `server.ts`
- Thin route files, `app/_components` for Providers and SiteHeader
- Remove duplicated helpers (`sameRepo`, repo-name regex); data layer no longer imports from queries
- Update ARCHITECTURE.md and README for the new layout

### M9 — Config & test coverage ✅
ADRs [0004](adr/0004-validation-at-trust-boundaries.md), [0005](adr/0005-typed-env-module.md), [0006](adr/0006-unit-test-coverage-threshold.md).
- `shared/config/env.ts` (server-only) and `shared/config/site.ts`; no other `process.env` reads
- Trust-boundary guards reviewed against ADR 0004, each with unit tests
- Vitest coverage (`@vitest/coverage-v8`), 80% lines on entities, proxy and pure logic, enforced in CI

### M10 — Formatting with Biome ✅
ADR [0007](adr/0007-biome-formatter.md).
- `@biomejs/biome` (exact version) as formatter only; ESLint keeps all lint rules
- `biome.json`: 2 spaces, line width 100, git-ignored files skipped
- `pnpm format` / `pnpm format:check`, check runs in CI before lint
- One reformat-only commit, listed in `.git-blame-ignore-revs`

## Phase 3 — Discovery ✅

### M11 — Repos by field ✅
A developer picks a field (Frontend, Backend, …) and gets the most relevant active
repositories for it. Built as a separate route: existing pages and their behavior
stay unchanged; shared code only gains additive entries.
- Fields, 4 GitHub topics each: Frontend (react, vue, svelte, angular), Backend
  (backend, rest-api, microservices, web-framework), Mobile (android, ios, react-native,
  flutter), DevOps (devops, kubernetes, docker, terraform), AI/ML (machine-learning,
  deep-learning, llm, nlp), Data (database, data-engineering, etl, analytics), Game dev
  (game-engine, gamedev, godot, unity), Security (security, pentesting, cryptography,
  ctf), Embedded (embedded, iot, arduino, rtos). Every topic has at least 30 active
  repos with 200+ stars
- Ranking: GitHub search rejects `topic:a OR topic:b`, so one search per topic runs
  (queued by the client's search queue) with `archived:false stars:>=200 pushed:>=<180 days ago>`, sorted by stars;
  results are merged, deduplicated and the top 30 by stars kept, each with its matched
  topics
- `FIELDS` catalog in `entities/github/catalog.ts` (so `TAG_PATTERN` stays derived from
  catalogs); `getFieldRepos(field)` in `cached.ts` with `cacheLife("days")` and tags
  `field` + `field:<slug>`; pure merge/rank in `entities/github/field-ranking.ts` with
  unit tests
- `src/features/fields/`: `index.ts` (`FieldList` picker), `server.ts` (`FieldRepos`,
  `FieldReposSkeleton`)
- Routes: `/fields` (static picker), `/fields/[field]` (ISR, Frontend and Backend
  prerendered via `generateStaticParams`), `generateMetadata`, `opengraph-image.tsx`
  on `OgCard`
- "Fields" link in the site header; `POST /api/revalidate` accepts the new tags
- One Playwright smoke test; no new dependencies; ARCHITECTURE.md and README updated

### M12 — Describe it (natural-language repo finder) ✅
A developer describes what they need ("a library that works with dates in JavaScript",
"fast state management for React") and gets matching repositories with a one-line reason
each. Separate route; existing pages stay unchanged. A free LLM (Groq) translates the
request into GitHub search; GitHub still does the searching.
- Flow: `/find?q=…` via `next/form` (shareable URL, `noindex` like `/search`)
  1. **Interpret**: Groq `openai/gpt-oss-20b` turns the request into
     `{ keywords, language?, topics }` (JSON mode, small `max_tokens`)
  2. **Search**: 1–3 GitHub searches from that intent (reuses `searchRepositories`),
     sorted by stars (best match favored repos that only had the words in their name),
     JavaScript and TypeScript searched together, interleaved and deduplicated
  3. **Explain**: a second Groq call picks the best ~10 and writes one reason per repo
- Streaming: repo list renders as soon as step 2 finishes; reasons stream in through a
  nested `<Suspense>`
- Caching: steps 1 and 3 in `"use cache"` keyed on the normalized request (trimmed,
  lowercased, whitespace collapsed), `cacheLife("days")`, so repeats cost no quota
- Trust boundary (ADR 0004): input capped at 200 characters; model output is untrusted
  and validated by a pure `parseIntent` / `parseReasons` (unknown language or topics
  dropped, sizes capped, reasons only for repos we actually returned), unit-tested
- Fallback: no key, `FIND_AI_ENABLED=false`, Groq 429/error or invalid output → plain
  keyword search on the request, with a note on the page. The page never breaks
- Quota protection: caching + input/token caps + a Vercel Firewall rate-limit rule on
  `/find` (documented in README; configured in the Vercel dashboard, not in code)
- Groq called with plain `fetch` (OpenAI-compatible API), no new dependency;
  `env.groqApiKey()` and `env.findAiEnabled()` in `shared/config/env.ts`, `.env.example`
  updated
- Layout: `src/features/find/` (`index.ts` search form, `server.ts` results body,
  `groq.ts` server-only client, `intent.ts` pure parsing + tests); `find` added to
  `RESERVED_SEGMENTS`; "Describe it" link in the header
- ADR 0008: LLM output is untrusted input; provider behind one small module
- One Playwright smoke test that passes with or without a key (CI has none); ARCHITECTURE.md,
  README updated
- Fix found while testing: field links no longer prefetch (opening `/fields` fired up to
  36 GitHub searches and hit the search rate limit); `/find` example links don't either
