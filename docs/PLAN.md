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
| Search | `/search` | TanStack Query `useInfiniteQuery` infinite scroll, URL-synced filters, server prefetch + `HydrationBoundary` |
| Repo preview modal | `@modal/(.)[owner]/[repo]` | Parallel routes + intercepting routes: modal on soft nav, full page on hard nav/refresh |
| Hover prefetch | repo cards | `queryClient.prefetchQuery` on hover, plus `<Link>` prefetch |
| Watchlist / stars | `/watchlist` | Server Actions, `useOptimistic` and TanStack optimistic mutations with rollback, cookie-backed storage |
| Rate limit & locale guard | `src/proxy.ts` | Proxy (formerly middleware): request headers, redirects, lightweight rate-limit header surfacing |
| API layer | `src/lib/github` | Typed fetch wrapper, `cacheLife` / `cacheTag`, optional `GITHUB_TOKEN` for higher limits |

## Milestones

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
- `@modal` parallel slot + `(.)` intercepting route for repo preview
- `default.tsx` fallbacks, close on back navigation

### M5 — Watchlist, Server Actions & optimistic UI ✅
- Watchlist stored in a cookie (no auth needed), mutated via Server Actions
- Optimistic star/watch toggles with TanStack `useMutation` (`onMutate` / rollback) and `useOptimistic`

### M6 — Proxy, metadata polish, OG images
- `proxy.ts`: normalize routes (e.g. `/owner/repo.git` → `/owner/repo`), attach headers
- `opengraph-image.tsx` for repo and user pages, sitemap, robots

### M7 — Quality & deploy
- Unit tests (Vitest) for the data layer, Playwright smoke tests
- GitHub Actions CI (lint, typecheck, build)
- Deploy to Vercel, README with screenshots and architecture notes
