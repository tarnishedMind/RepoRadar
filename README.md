# RepoRadar

Explore GitHub repositories, developers and what's trending, powered by the public GitHub API.

A portfolio project showcasing the Next.js App Router: Server Components, SSR, ISR with
on-demand revalidation, streaming with Suspense, parallel and intercepting routes, Server
Actions, proxy (middleware), `generateMetadata` and OG images, plus TanStack Query v5 for
infinite scroll, hover prefetching, server-to-client cache hydration and optimistic updates.

See [docs/PLAN.md](docs/PLAN.md) for the feature map and milestones, and
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for a guided tour of how it all works.

## Stack

Next.js 16 · React 19 · TypeScript · Tailwind CSS v4 · TanStack Query v5 · pnpm · Node 22

## Getting started

```bash
nvm use            # Node 22 (see .nvmrc)
pnpm install
cp .env.example .env.local   # optional: add a GITHUB_TOKEN
pnpm dev
```

Open http://localhost:3000.

## Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Start the dev server (Turbopack) |
| `pnpm build` | Production build |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | TypeScript check |

## On-demand revalidation

Trending pages regenerate hourly and leaderboards daily. To refresh them immediately,
set `REVALIDATE_SECRET` and call the route handler with one or more cache tags:

```bash
curl -X POST http://localhost:3000/api/revalidate \
  -H "Authorization: Bearer $REVALIDATE_SECRET" \
  -d '{"tags":["trending","leaderboard:rust","repo:vercel/next.js"]}'
```

Tags: `trending`, `trending:<daily|weekly|monthly>`, `leaderboard`, `leaderboard:<lang>`,
`repo:<owner>/<name>`, `user:<login>`. Stale pages keep being served while the fresh
version regenerates in the background.
