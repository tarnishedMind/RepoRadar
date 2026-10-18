# RepoRadar architecture: Next.js for SPA developers

This guide explains everything built in milestones M0 to M7, written for someone who
knows single-page apps (React + a router + `useEffect` fetching) but is new to the
Next.js App Router. Each section starts with the SPA habit, then shows what Next.js
does instead, and where to see it in this repo.

> Diagrams use Mermaid. They render on GitHub and in VS Code's Markdown preview.

## Contents

1. [The big shift](#1-the-big-shift)
2. [Folders are routes](#2-folders-are-routes)
3. [What happens on a request](#3-what-happens-on-a-request)
4. [Server Components and Client Components](#4-server-components-and-client-components)
5. [Fetching data without useEffect](#5-fetching-data-without-useeffect)
6. [Caching, static pages and ISR](#6-caching-static-pages-and-isr)
7. [Streaming with Suspense](#7-streaming-with-suspense)
8. [Errors, 404s and loading states](#8-errors-404s-and-loading-states)
9. [Route Handlers: the backend inside the app](#9-route-handlers-the-backend-inside-the-app)
10. [TanStack Query on top of Server Components](#10-tanstack-query-on-top-of-server-components)
11. [Navigation: soft, hard, and preserved pages](#11-navigation-soft-hard-and-preserved-pages)
12. [Parallel and intercepting routes: the preview modal](#12-parallel-and-intercepting-routes-the-preview-modal)
13. [Server Actions and optimistic updates: the watchlist](#13-server-actions-and-optimistic-updates-the-watchlist)
14. [Proxy: code that runs before every page](#14-proxy-code-that-runs-before-every-page)
15. [Metadata, share images, sitemap and robots](#15-metadata-share-images-sitemap-and-robots)
16. [Reading the build output](#16-reading-the-build-output)
17. [Testing, CI and deployment](#17-testing-ci-and-deployment)
18. [Cheat sheet: SPA habit → Next.js equivalent](#18-cheat-sheet-spa-habit--nextjs-equivalent)

---

## 1. The big shift

In an SPA the server sends an empty `index.html` and a JavaScript bundle. The browser
runs React, which fetches data from an API with `useEffect` and renders everything.

```mermaid
flowchart LR
  subgraph SPA["Classic SPA"]
    direction LR
    B1[Browser] -- "GET /" --> S1[Static host]
    S1 -- "empty index.html + app.js" --> B1
    B1 -- "useEffect → fetch /api" --> API1[API]
    API1 -- JSON --> B1
    B1 -- "React renders everything" --> UI1[UI]
  end
```

In Next.js, **React runs on the server first**. Components fetch their own data on the
server, and the browser receives finished HTML. Only the interactive parts ship
JavaScript and become live React in the browser.

```mermaid
flowchart LR
  subgraph NEXT["Next.js App Router"]
    direction LR
    B2[Browser] -- "GET /vercel/next.js" --> N[Next.js server]
    N -- "Server Components fetch data" --> GH[GitHub API]
    GH -- JSON --> N
    N -- "streamed HTML + RSC payload + small JS" --> B2
    B2 -- "hydrate only Client Components" --> UI2[UI]
  end
```

Three consequences you will see everywhere in this codebase:

- **Components are async and can `await` data directly.** No loading state boilerplate,
  no `useEffect`.
- **Secrets stay on the server.** `GITHUB_TOKEN` is read in `src/lib/github/client.ts`
  and never reaches the browser.
- **Less JavaScript.** The README renderer, language bar, stats and cards are plain
  HTML. They ship zero component JS.

---

## 2. Folders are routes

There is no `<Routes>` config. The folder structure under `src/app` *is* the router.
A folder becomes a URL segment, and a `page.tsx` inside it makes that URL reachable.

```mermaid
flowchart TD
  proxy["src/proxy.ts<br/>runs before routing (redirects, rewrites, headers)"]
  proxy --> root
  root["app/<br/>layout.tsx · page.tsx · error.tsx · not-found.tsx<br/>opengraph-image.tsx · sitemap.ts · robots.ts"]
  root --> home["/ <br/>page.tsx"]
  root --> repo["[owner]/[repo]/<br/>page.tsx · opengraph-image.tsx<br/>→ /vercel/next.js"]
  root --> user["u/[login]/<br/>page.tsx · loading.tsx · opengraph-image.tsx<br/>→ /u/torvalds"]
  root --> trending["trending/[[...range]]/<br/>page.tsx<br/>→ /trending, /trending/daily"]
  root --> langs["languages/<br/>page.tsx → /languages"]
  langs --> lang["[lang]/page.tsx<br/>→ /languages/rust"]
  root --> search["search/<br/>layout.tsx · page.tsx<br/>→ /search?q=…"]
  search --> modal["@modal/ (parallel slot, not a URL)<br/>default.tsx · page.tsx"]
  modal --> intercept["(..)[owner]/[repo]/page.tsx<br/>intercepts /owner/repo"]
  root --> watch["watchlist/<br/>page.tsx<br/>→ /watchlist"]
  root --> actions["actions/watchlist.ts<br/>(Server Actions, not a route)"]
  root --> api["api/ (Route Handlers, JSON)"]
  api --> apiSearch["search/route.ts<br/>GET /api/search"]
  api --> apiRepo["repos/[owner]/[repo]/route.ts<br/>GET /api/repos/…"]
  api --> apiReval["revalidate/route.ts<br/>POST /api/revalidate"]
  api --> apiWatch["watchlist/route.ts<br/>GET /api/watchlist"]
```

Folder naming conventions used here:

| Folder | Meaning | Example in repo |
| --- | --- | --- |
| `name/` | Static segment | `trending/`, `languages/`, `search/` |
| `[param]/` | Dynamic segment, value arrives in `params` | `[owner]/[repo]/`, `u/[login]/` |
| `[[...param]]/` | Optional catch-all: zero or more segments | `trending/[[...range]]/` matches `/trending` and `/trending/weekly` |
| `@slot/` | Parallel route slot. Not part of the URL; passed to the layout as a prop | `search/@modal/` |
| `(..)name/` | Intercepting route: "catch navigations to `../name`" | `@modal/(..)[owner]/[repo]/` |

Static segments win over dynamic ones, so `/u/torvalds` goes to `u/[login]`, not to
`[owner]/[repo]` with owner `u`.

Special files inside a route folder:

| File | Role |
| --- | --- |
| `page.tsx` | The UI for that URL. Without it the folder is not routable |
| `layout.tsx` | Wraps the page and all child routes. Stays mounted across navigations |
| `loading.tsx` | Automatic `<Suspense>` fallback for the segment |
| `error.tsx` | Error boundary for the segment (must be a Client Component) |
| `not-found.tsx` | UI for `notFound()` |
| `default.tsx` | Fallback for a parallel slot when Next can't tell what it should show |
| `route.ts` | An HTTP endpoint (GET, POST…) instead of a page |
| `opengraph-image.tsx` | Generates the share image for that route (section 15) |
| `sitemap.ts`, `robots.ts` | Generate `/sitemap.xml` and `/robots.txt` (root only) |

One file sits outside `app/`: `src/proxy.ts`, which runs before any of these
(section 14).

Layouts nest. Every page here is rendered inside the root layout:

```mermaid
flowchart TD
  html["app/layout.tsx<br/>&lt;html&gt;, fonts, &lt;Providers&gt;, &lt;SiteHeader&gt;"]
  html --> p1["app/page.tsx"]
  html --> p2["app/[owner]/[repo]/page.tsx"]
  html --> sl["app/search/layout.tsx"]
  sl --> sp["children = search/page.tsx"]
  sl --> sm["modal = @modal/… (null or the preview)"]
```

---

## 3. What happens on a request

Here is a first visit to `/TanStack/query`, a repo that was **not** prerendered at build
time.

```mermaid
sequenceDiagram
  autonumber
  participant B as Browser
  participant P as proxy.ts
  participant N as Next.js server
  participant C as "use cache" store
  participant G as GitHub API

  B->>P: GET /TanStack/query
  P->>N: URL is already clean, continue
  N-->>B: Static shell right away: layout, header, skeletons
  Note over N: Inside <Suspense>: await params, getRepo()
  N->>C: getRepo("TanStack","query")
  C-->>N: miss
  N->>G: GET /repos/TanStack/query (with token)
  G-->>N: JSON
  N->>C: store (cacheLife "hours", tag repo:tanstack/query)
  N-->>B: Stream header HTML into the page
  par Each section in its own Suspense
    N->>G: README, languages, contributors
    N-->>B: Stream each section as it finishes
  end
  N-->>B: RSC payload + JS for Client Components
  B->>B: Hydrate Client Components (Providers, error boundary…)
```

On the next visit the cache answers instead of GitHub, and Next stores the finished
page, so it is served like a static file.

What is the **RSC payload**? Besides HTML, the server sends a compact description of
the Server Component tree. The browser uses it to hydrate and, on later client-side
navigations, to update the page without full HTML.

---

## 4. Server Components and Client Components

Every component in `app/` is a **Server Component** by default. It runs only on the
server (at build time or per request), can be `async`, can read secrets, and ships no
JS. You cannot use `useState`, `useEffect`, event handlers or browser APIs in it.

A file starting with `"use client"` is a **Client Component**. It is rendered to HTML on
the server too, then hydrated in the browser so hooks and events work. It behaves like
the React you know.

The rule of thumb used here: **keep data fetching and layout on the server, push
interactivity to small client leaves.**

| Server Components (no JS shipped) | Client Components (`"use client"`) |
| --- | --- |
| `app/layout.tsx`, every `page.tsx` | `app/providers.tsx` (QueryClientProvider) |
| `[owner]/[repo]/readme.tsx`, `languages.tsx`, `contributors.tsx` | `app/error.tsx` (error boundaries must be client) |
| `components/repo-card.tsx`, `stat.tsx`, `site-header.tsx`, `updated-at.tsx` | `search/search-view.tsx` (input, infinite scroll) |
| `search/page.tsx` (prefetches data) | `search/search-result-card.tsx` (hover prefetch) |
| `@modal/(..)[owner]/[repo]/page.tsx` | `components/modal.tsx` (`<dialog>`, router.back) |
| `watchlist/page.tsx` (reads the cookie) | `@modal/…/repo-preview.tsx` (useQuery) |
| | `components/watch-button.tsx` (useMutation) |
| | `components/watchlist-nav-link.tsx` (header count) |
| | `watchlist/watchlist-items.tsx` (useOptimistic + form action) |

Server Components can render Client Components and pass them props (which must be
serializable) or even other Server Components as `children`. That is how the root
layout puts the server-rendered `<SiteHeader>` inside the client `<Providers>`:

```mermaid
flowchart TD
  L["RootLayout (server)"] --> P["Providers (client)<br/>QueryClientProvider"]
  P --> H["SiteHeader (server, passed as children)"]
  P --> PG["page (server)"]
  PG --> SV["SearchView (client)"]
  SV --> RC["SearchResultCard (client)"]
```

`import "server-only"` at the top of `src/lib/github/client.ts` turns an accidental
import from a Client Component into a build error, so the token can't leak.

---

## 5. Fetching data without useEffect

SPA:

```tsx
const [repo, setRepo] = useState(null);
useEffect(() => { fetch(`/api/repos/${id}`).then(r => r.json()).then(setRepo) }, [id]);
if (!repo) return <Spinner />;
```

Next.js Server Component (`src/app/[owner]/[repo]/page.tsx`):

```tsx
async function RepoView({ params }) {
  const { owner, repo } = await params;
  const data = await getRepo(owner, repo); // runs on the server, talks to GitHub
  if (!data) notFound();
  return <h1>{data.full_name}</h1>;
}
```

Notes:

- `params` and `searchParams` are **Promises** in Next 16. You `await` them.
- Independent requests run in parallel with `Promise.all`. See `src/app/u/[login]/page.tsx`,
  which fetches the user and their repos together instead of one after another.
- The loading state comes from `<Suspense fallback>` or `loading.tsx` (section 7), not
  from a `useState` flag.

The data layer lives in `src/lib/github/`:

```mermaid
flowchart LR
  pages["Pages & components"] --> idx["github/index.ts<br/>getRepo, getUser, getTrendingRepos,<br/>getLanguageLeaderboard, searchRepositories<br/>('use cache' + cacheLife + cacheTag)"]
  idx --> client["github/client.ts<br/>fetch wrapper: token header,<br/>404 → null, rate limit → error<br/>(server-only)"]
  client --> gh[(GitHub REST API)]
  types["github/types.ts, catalog.ts<br/>(safe to import anywhere)"] -.-> pages
```

---

## 6. Caching, static pages and ISR

This project uses **Cache Components** (`cacheComponents: true` in `next.config.ts`), the
default for new Next 16 apps. The rule is simple: **nothing is cached unless you say so.**

### `"use cache"`

Put `"use cache"` at the top of an async function and its return value is cached. The
arguments become the cache key.

```ts
export async function getRepo(owner: string, repo: string) {
  "use cache";
  cacheLife("hours");                  // how long the result stays fresh
  cacheTag(tags.repo(owner, repo));     // a label for targeted invalidation
  return githubJson(`/repos/${owner}/${repo}`);
}
```

| Function | `cacheLife` | Tags |
| --- | --- | --- |
| `getRepo`, `getRepoReadmeHtml` | hours | `repo:<owner>/<name>` |
| `getRepoLanguages`, `getRepoContributors` | days | `repo:<owner>/<name>` |
| `getUser`, `getUserRepos` | hours | `user:<login>` |
| `getTrendingRepos(range)` | hours | `trending`, `trending:<range>` |
| `getLanguageLeaderboard(lang)` | days | `leaderboard`, `leaderboard:<lang>` |
| `searchRepositories` | minutes | none |

### Prerendering and ISR

At `pnpm build`, Next renders every page it can **ahead of time**. A page is fully static
when all of its data is cached and it doesn't read per-request data (cookies, headers,
search params).

`generateStaticParams` lists which dynamic URLs to build ahead of time:

- `[owner]/[repo]` builds `vercel/next.js` and `facebook/react`.
- `u/[login]` builds `vercel`.
- `trending/[[...range]]` builds `/trending`, `/daily`, `/weekly`, `/monthly`.
- `languages/[lang]` builds the 4 most popular languages. The other 8 are built on
  their first visit. Building all 12 at once fired a burst of GitHub search requests and
  tripped GitHub's "secondary" rate limit, which failed the build. The GitHub client also
  runs search requests one at a time and retries briefly when that limit hits.

Any other URL is rendered on its first visit and then stored, so later visitors get it
instantly. When the `cacheLife` window passes, the next visitor still gets the stored
page while Next rebuilds it in the background. That whole behavior is **ISR**
(Incremental Static Regeneration).

### On-demand revalidation

`POST /api/revalidate` (`src/app/api/revalidate/route.ts`) calls
`revalidateTag(tag, "max")`. That marks every cached result with that tag as stale. The
next visit serves the old page and triggers a rebuild; the visit after gets the new one.

```mermaid
sequenceDiagram
  participant Admin as curl / cron
  participant N as Next.js
  participant V as Visitor
  Admin->>N: POST /api/revalidate {tags:["trending"]} + secret
  N->>N: revalidateTag("trending","max") → mark stale
  V->>N: GET /trending
  N-->>V: old page (instant)
  N->>N: rebuild in background
  V->>N: GET /trending (later)
  N-->>V: new page
```

The "Generated … UTC" line on Trending and leaderboard pages shows when the cached data
was produced, so you can watch this happen with `pnpm build && pnpm start`. (In
`pnpm dev` caching is not representative.)

---

## 7. Streaming with Suspense

In an SPA, the page waits for all data or shows spinners managed by state. Here the
server sends HTML **in pieces**: everything outside a `<Suspense>` boundary goes out at
once, and each boundary's content streams in when its data is ready.

The repo page uses this deliberately:

```mermaid
flowchart TD
  page["RepoPage (static shell: layout + skeleton)"]
  page --> s0["Suspense: RepoView<br/>awaits params + getRepo → header, stats"]
  s0 --> s1["Suspense: Readme"]
  s0 --> s2["Suspense: Languages"]
  s0 --> s3["Suspense: Contributors"]
```

A slow README never blocks the stats or the sidebar. Each skeleton is replaced
independently.

Two ways to declare a boundary, both used here:

- **Inline `<Suspense>`**: `[owner]/[repo]/page.tsx`, `trending`, `languages/[lang]`,
  `search/page.tsx`. Fine-grained.
- **`loading.tsx`**: `u/[login]/loading.tsx`. Next wraps the whole page in a
  `<Suspense>` using this file as the fallback.

Why pages pass `params` *down* unawaited: with Cache Components, the part of a page that
doesn't depend on the URL can be prerendered once as an **App Shell** and reused for
every URL. Awaiting `params` inside the boundary keeps the shell generic.

---

## 8. Errors, 404s and loading states

| Situation | What handles it | File |
| --- | --- | --- |
| Repo or user doesn't exist | GitHub returns 404 → our client returns `null` → page calls `notFound()` | `app/not-found.tsx` |
| GitHub rate limit or outage | `GitHubRateLimitError` / `GitHubError` thrown → nearest `error.tsx` | `app/error.tsx` (has a "Try again" button that calls `retry()`) |
| Unknown trending range or language | page calls `notFound()` | `app/not-found.tsx` |
| Data still loading | Suspense fallback / `loading.tsx` | skeleton components |

Because the page is already streaming when a missing repo is discovered, the HTTP
status stays 200. Next adds `<meta name="robots" content="noindex">` so search engines
skip it.

---

## 9. Route Handlers: the backend inside the app

`route.ts` files are HTTP endpoints, like a small Express server living next to the
pages. This app has three:

| Endpoint | Used by | Why it exists |
| --- | --- | --- |
| `GET /api/search` | `SearchView` infinite scroll | Browser code can't hold the GitHub token, so it asks our server |
| `GET /api/repos/[owner]/[repo]` | hover prefetch, preview modal | Same reason |
| `POST /api/revalidate` | you, cron jobs, webhooks | Clears cache by tag; protected by `REVALIDATE_SECRET` |
| `GET /api/watchlist` | `WatchButton`, header count | The watchlist cookie is `httpOnly`, so browser JS can't read it directly |

For *writes* from the browser this app uses Server Actions instead of Route Handlers
(section 13).

Server Components don't need these endpoints. They call `src/lib/github` directly.
Route Handlers are only for code running in the browser or for outside callers.

---

## 10. TanStack Query on top of Server Components

If Server Components fetch data, why TanStack Query? Because some data needs to change
**after** the page loads without a server round trip: typing in search, loading the
next page on scroll, and the preview modal.

### One QueryClient per request on the server, one in the browser

`src/lib/get-query-client.ts`:

- On the server, every request gets a fresh `QueryClient`, so one user's data never
  leaks into another's.
- In the browser, a single client is reused for the session.
- `staleTime: 60s` stops the browser from refetching data the server just sent.

### Server prefetch → dehydrate → hydrate

```mermaid
sequenceDiagram
  autonumber
  participant B as Browser
  participant SP as search/page.tsx (server)
  participant QC as QueryClient (per request)
  participant G as GitHub
  B->>SP: GET /search?q=tanstack
  SP->>QC: prefetchInfiniteQuery(key ["search",{q,sort,lang}])
  QC->>G: page 1 (direct call, token on server)
  G-->>QC: 30 repos
  SP->>SP: dehydrate(QC) → plain JSON
  SP-->>B: HTML with results + <HydrationBoundary state=…>
  B->>B: SearchView useInfiniteQuery(same key) finds data in cache, no fetch
  B->>B: Scroll near bottom → fetchNextPage()
  B->>SP: GET /api/search?q=tanstack&page=2 (Route Handler)
```

The key that makes this work is `src/lib/queries/`: the **same query key and options**
are imported by the server page and the client component. The server overrides only
`queryFn` so it can call GitHub directly instead of its own API.

### URL as state, without server round trips

`SearchView` writes `q`, `sort` and `lang` into the URL with `window.history.replaceState`.
Next keeps `useSearchParams()` in sync, so the component re-renders with new params,
TanStack Query sees a new key and fetches. `keepPreviousData` keeps the old results on
screen (dimmed) while the new ones load. Sharing or refreshing the URL reproduces the
same search, and that path goes through the server prefetch again.

### Prefetch on hover and placeholder data

- `SearchResultCard` calls `queryClient.prefetchQuery(repoQueryOptions(...))` on hover
  and focus. The data lands in the cache before the click.
- `RepoPreview` (the modal) reads the same key with `useQuery`, so it opens instantly.
  If you clicked without hovering, `placeholderData` pulls the repo out of the cached
  search results until the full record arrives.

---

## 11. Navigation: soft, hard, and preserved pages

- **`<Link>`** performs a **soft navigation**: no full reload. Next fetches the RSC payload
  for the new route and swaps only what changed. Layouts (header, providers) stay mounted
  and keep their state.
- Links are **prefetched** when they scroll into view, so most clicks feel instant.
- **`next/form`** (home page search box) is a `<form>` that does a soft navigation to
  `/search?q=…` instead of a full page submit.
- A plain `<a>` or a refresh is a **hard navigation**: the server renders the page from
  scratch. The preview modal's "Open full page" uses `<a>` on purpose, so the route isn't
  intercepted again.
- **Pages you leave are kept, not destroyed.** With Cache Components, Next hides the
  previous route with React `<Activity>` (it's `display: none`, state intact). Pressing
  Back restores it exactly: scroll position, input text, results. Up to 3 routes are kept.
  This is why `components/modal.tsx` opens the `<dialog>` in a layout effect and closes it
  in the cleanup: hiding a route runs cleanup, showing it again runs the effect.

---

## 12. Parallel and intercepting routes: the preview modal

Goal: clicking a search result shows the repo in a modal **with its own URL**, but
opening that URL directly shows the full page.

Pieces:

- `search/layout.tsx` receives two props: `children` (the search page) and `modal` (the
  `@modal` slot). It renders both.
- `@modal/(..)[owner]/[repo]/page.tsx` **intercepts** navigations to `/owner/repo` that
  start inside `/search`. `(..)` means "one segment up from `/search`", i.e. the root
  `[owner]/[repo]` route.
- `@modal/page.tsx` matches `/search` itself and renders nothing, so going back closes
  the modal.
- `@modal/default.tsx` renders nothing when Next can't recover the slot's state (fresh
  page loads).

```mermaid
flowchart TD
  click["Click result inside /search<br/>(soft navigation to /TanStack/query)"] --> intercept{"Started inside /search?"}
  intercept -- yes --> both["search/layout renders<br/>children = search results (kept)<br/>modal = (..)[owner]/[repo] preview"]
  intercept -- "no (refresh, shared link, link from /trending)" --> full["app/[owner]/[repo]/page.tsx<br/>full repo page"]
  both --> close["×, Escape, backdrop, Back button"]
  close --> back["router.back() → /search?q=…<br/>@modal/page.tsx renders null"]
```

Because the URL is `/TanStack/query` while the modal is open, `useSearchParams()` returns
nothing. `SearchView` remembers the last `/search` params so the results underneath stay.

---

## 13. Server Actions and optimistic updates: the watchlist

### The SPA way vs Server Actions

In an SPA, saving something means writing a `POST /api/...` endpoint and calling it with
`fetch`. A **Server Action** skips the endpoint: you write an `async` function in a file
that starts with `"use server"`, import it into a Client Component and call it like any
function. Next turns each one into a POST endpoint behind the scenes and handles the
serialization.

`src/app/actions/watchlist.ts`:

```ts
"use server";

export async function setWatched(fullName: string, watched: boolean) {
  const list = await readWatchlist();      // reads the cookie
  // …validate, add or remove…
  await writeWatchlist(next);             // sets the cookie
  return { ok: true, list: next };
}
```

Things to know:

- **It's a public endpoint.** Anyone can call it with any arguments, so it validates
  `fullName` against a pattern and caps the list at 50 entries.
- **Return errors, don't throw them.** In production Next hides thrown error messages.
  The action returns `{ ok: false, error }` so the "watchlist is full" message reaches
  the user.
- **Cookies can only be written here** (or in Route Handlers). A Server Component can read
  them but not set them, because by the time it renders, the response is already streaming.

### Where the data lives

The watchlist is a JSON array of `"owner/repo"` names in an `httpOnly` cookie
(`src/lib/watchlist.ts`). No database or login needed, and every request carries it, so
Server Components can read it with `cookies()`. Reading `cookies()` makes that part of
the page per-request, so it must be inside `<Suspense>`.

### Two optimistic patterns, side by side

Optimistic UI means updating the screen before the server confirms, and undoing it if
the server fails. The app shows both ways to do it.

**1. TanStack Query mutation** (`components/watch-button.tsx`, used on the repo page,
search cards and the preview modal):

```mermaid
sequenceDiagram
  autonumber
  participant U as User
  participant WB as WatchButton
  participant QC as TanStack cache ["watchlist"]
  participant SA as setWatched (Server Action)
  U->>WB: click ☆ Watch
  WB->>QC: onMutate: snapshot old list, write new list
  QC-->>WB: every WatchButton + header count re-render (★)
  WB->>SA: mutationFn → setWatched(name, true)
  alt success
    SA-->>WB: { ok: true, list }
    WB->>QC: onSuccess: store server list
  else failure (network, list full)
    SA-->>WB: error
    WB->>QC: onError: restore snapshot (rollback)
    WB-->>U: show error message
  end
```

All watch buttons and the header counter read the same cache key, so a click anywhere
updates all of them at once.

**2. React `useOptimistic` with a form** (`watchlist/watchlist-items.tsx`, the Remove
buttons on `/watchlist`):

```mermaid
sequenceDiagram
  autonumber
  participant U as User
  participant WI as WatchlistItems
  participant SA as removeFromWatchlist (Server Action)
  participant P as /watchlist (Server Component)
  U->>WI: submit <form action={remove}>
  WI->>WI: removeOptimistic(name): row disappears now
  WI->>SA: removeFromWatchlist(formData)
  SA->>SA: write cookie
  SA-->>P: Next re-renders the page in the same response
  P-->>WI: new `repos` prop
  WI->>WI: optimistic state settles on the new props
  Note over WI: If the action fails, the transition ends with the old props and the row comes back by itself
```

Rule of thumb: `useOptimistic` fits when the truth comes from server-rendered props;
TanStack's `onMutate` fits when the truth lives in the client cache.

### Keeping server-rendered and cached data in sync

`/watchlist` is rendered on the server, but buttons elsewhere change the list through the
client cache. Because Next keeps visited pages alive (section 11), going Back to
`/watchlist` could show an old list. `WatchlistItems` compares the names the server
rendered with the cached list and calls `router.refresh()` when they differ, which asks
the server for a fresh render of the current page.

`/watchlist` also seeds the client cache (`setQueryData` + `HydrationBoundary`), so the
header count doesn't need its own request on that page.

### A hydration trap and the fix

The watch button is disabled until the watchlist has loaded. Sometimes the list was
already in the cache by the time a button hydrated (another component had fetched it).
The first client render then said "enabled" while the server HTML said "disabled".
React doesn't fix mismatched attributes during hydration, so the button stayed disabled
forever.

The fix is `src/hooks/use-hydrated.ts`: it returns `false` during SSR and the hydration
render, `true` afterwards. Components that depend on browser-only data render the server
version first, then update. Use the same trick for anything based on `localStorage`,
the current time, or other data the server can't know.

---

## 14. Proxy: code that runs before every page

### The SPA way vs Proxy

In an SPA, redirects and URL cleanup live in the router config or in your web server
(nginx, Netlify `_redirects`). In Next.js, `src/proxy.ts` is a function that runs on the
server **before routing**, for every request that matches its `matcher`. It sees the
URL, headers and cookies, and can:

- **Redirect**: tell the browser to go to another URL (the address bar changes).
- **Rewrite**: serve a different route's content while the address bar keeps the
  original URL.
- **Add headers** to the response, or just let the request continue.

Before Next 16 this file was called `middleware.ts`. It's meant for fast decisions based
on the request itself, not for fetching data.

### What RepoRadar's proxy does

```mermaid
flowchart TD
  req["Incoming request"] --> m{"Matches the matcher?<br/>(skips /api, /_next, images,<br/>OG images, sitemap, robots)"}
  m -- no --> route["Normal routing"]
  m -- yes --> gh{"Starts with github.com<br/>or https:/github.com?"}
  gh -- yes --> strip["Strip that prefix"]
  gh -- no --> at
  strip --> at{"Single segment<br/>starting with @?"}
  at -- "yes: /@torvalds" --> rw["Rewrite to /u/torvalds<br/>(URL stays /@torvalds)"]
  at -- no --> own{"First segment is an owner<br/>(not u, trending, search…)?"}
  own -- "/torvalds" --> r1["308 → /u/torvalds"]
  own -- "/vercel/next.js.git<br/>/vercel/next.js/tree/canary" --> r2["308 → /vercel/next.js"]
  own -- "already clean" --> hdr
  own -- "reserved section" --> hdr["Continue; add X-Robots-Tag: noindex<br/>for /search and /watchlist"]
  hdr --> route
```

So you can take any GitHub URL, put the RepoRadar domain in front of it, and land on
the right page: `/github.com/vercel/next.js/issues` redirects to `/vercel/next.js`.

Things to know:

- **The matcher matters.** Without it, the proxy would also run for JS chunks, images and
  the generated OG images (`/vercel/next.js/opengraph-image` has three segments and would
  get "cleaned up" into a redirect).
- **Redirects only for GET/HEAD.** Server Actions arrive as POST requests to the current
  page's URL and must pass through untouched.
- **Reserved names** (`u`, `trending`, `languages`, `search`, `watchlist`, `api`) live in
  `src/lib/site.ts`. A GitHub user literally named `trending` can't get a short URL, but
  `/u/trending` still works.
- `X-Robots-Tag: noindex` is a response header that tells search engines not to index
  search results or someone's personal watchlist.

---

## 15. Metadata, share images, sitemap and robots

### Titles and descriptions

Instead of managing `<title>` with a library, pages export metadata:

- `app/layout.tsx` exports a static `metadata` object: a title template
  (`%s · RepoRadar`), a default description, `openGraph.siteName`,
  `twitter.card: "summary_large_image"`, and `metadataBase`.
- Dynamic pages export `generateMetadata({ params })`, which fetches the same cached data
  as the page (no extra GitHub call, thanks to `"use cache"`) and returns title,
  description and Open Graph tags. Examples: repo, user, trending, leaderboard and search
  pages.
- Child metadata is merged over parent metadata, but nested objects like `openGraph` are
  replaced, not deep-merged.

`metadataBase` (from `src/lib/site.ts`) turns relative URLs into absolute ones, which
social networks require. It uses `NEXT_PUBLIC_SITE_URL`, then Vercel's production
domain, then `http://localhost:3000`.

### Generated share images

When someone pastes a RepoRadar link into Slack, X or LinkedIn, the preview card shows
the `og:image`. Instead of designing static PNGs, `opengraph-image.tsx` files generate
them with JSX:

| File | Image |
| --- | --- |
| `app/opengraph-image.tsx` | Default RepoRadar card for every page without its own |
| `app/[owner]/[repo]/opengraph-image.tsx` | Owner avatar, repo name, description, stars, forks, language |
| `app/u/[login]/opengraph-image.tsx` | Avatar, name, bio, followers, public repos |

```mermaid
sequenceDiagram
  participant S as Slack / X crawler
  participant N as Next.js
  participant C as "use cache" (getRepo)
  S->>N: GET /vercel/next.js
  N-->>S: HTML with <meta property="og:image" content=".../vercel/next.js/opengraph-image?…">
  S->>N: GET /vercel/next.js/opengraph-image
  N->>C: getRepo("vercel","next.js") (usually a cache hit)
  N->>N: ImageResponse: JSX → 1200×630 PNG (next/og)
  N-->>S: image/png
```

Next adds the `og:image` and `twitter:image` tags automatically because the file exists;
pages don't reference it. `ImageResponse` uses a different renderer than the browser
(Satori): only flexbox layout and inline `style` objects, no Tailwind classes. The shared
layout is `src/components/og/og-card.tsx`.

### Sitemap and robots

`app/sitemap.ts` and `app/robots.ts` are functions that return plain objects. Next turns
them into `/sitemap.xml` and `/robots.txt` at build time. The sitemap lists the home,
trending and leaderboard pages; robots allows everything except `/api/`, `/search` and
`/watchlist`, and points to the sitemap.

---

## 16. Reading the build output

`pnpm build` prints a symbol per route:

| Symbol | Meaning | Examples |
| --- | --- | --- |
| `○` Static | Fully built ahead of time, served as a file | `/`, `/languages`, `/trending/daily`, `/vercel/next.js` |
| `◐` Partial Prerender | Static shell built ahead of time, the rest streams per request | `/[owner]/[repo]` for unknown repos, `/search`, `/watchlist` |
| `ƒ` Dynamic | Runs on every request | `/api/search`, `/api/revalidate`, `/[owner]/[repo]/opengraph-image` |

The output also ends with `ƒ Proxy (Middleware)`, confirming `src/proxy.ts` is active.
The repo OG image is `ƒ` because it depends on the URL, but the GitHub data behind it is
still cached, so each render is cheap.

`/search` is `◐` because results depend on `?q=`, and `/watchlist` because it reads a
cookie. Both call `await connection()` before using TanStack's `dehydrate()`, which
explicitly says "this part only runs at request time".

---

## 17. Testing, CI and deployment

### Two kinds of tests

In an SPA you might test components with Jest and a fake DOM. Here most logic lives in
plain server-side functions, so the unit tests target those directly, and a handful of
browser tests check that the Next.js features work together in a real production build.

| | Unit tests (Vitest) | Smoke tests (Playwright) |
| --- | --- | --- |
| Where | `src/**/*.test.ts` next to the code | `e2e/smoke.spec.ts` |
| Runs against | Plain functions in Node | `next start` serving a production build, in Chrome |
| Network | None: `fetch` and `next/headers` are mocked | Real GitHub API |
| Covers | GitHub client (404, rate limits, retries, one-at-a-time search), search param parsing, infinite-scroll paging, watchlist cookie validation, every proxy redirect and rewrite | Home search via `next/form`, repo page + OG tag, intercepted modal open/close, full page on direct load, watchlist add/remove, proxy URLs, 404 |
| Command | `pnpm test` | `pnpm build && pnpm test:e2e` |

Three details worth knowing:

- `server-only` throws outside a Next.js server bundle, so `vitest.config.mts` swaps it
  for an empty module in tests.
- The proxy is just a function that takes a `NextRequest` and returns a `NextResponse`,
  so its tests build requests and inspect the response: `status` and `location` for
  redirects, the `x-middleware-rewrite` header for rewrites.
- Smoke tests run against a **production** build on purpose. Caching, ISR, prerendering
  and Activity behave differently in `next dev`.

### From push to production

```mermaid
flowchart LR
  dev["git push / pull request"] --> gh[(GitHub repo)]
  gh --> ci["GitHub Actions (.github/workflows/ci.yml)"]
  ci --> j1["Job 1: lint · typecheck · unit tests"]
  ci --> j2["Job 2: next build · Playwright smoke tests"]
  gh --> v["Vercel GitHub integration"]
  v -- "pull request / branch" --> prev["Preview deployment<br/>(own URL, linked on the PR)"]
  v -- "push to main" --> prod["Production deployment"]
  j1 -. "optional: Deployment Checks" .-> prod
  j2 -.-> prod
```

- CI and Vercel both react to the same push independently. Vercel can be told to wait
  for the CI checks before promoting a deployment (Vercel → Settings → Deployment Checks).
- The CI build needs a GitHub token because `next build` prerenders pages from the GitHub
  API. It uses the token GitHub gives every workflow run (`secrets.GITHUB_TOKEN`), so no
  secret has to be configured.

### What Vercel does with the build

```mermaid
flowchart TD
  b["next build output"] --> st["○ static pages, JS, CSS, images<br/>→ Vercel CDN"]
  b --> fn["Server Components, Route Handlers,<br/>Server Actions, OG images<br/>→ serverless functions"]
  b --> px["proxy.ts<br/>→ runs before every matching request"]
  b --> cache["'use cache' entries, ISR pages<br/>→ Vercel's data cache, refreshed in the background"]
```

Environment variables (`GITHUB_TOKEN`, `REVALIDATE_SECRET`, optionally
`NEXT_PUBLIC_SITE_URL`) are set in the Vercel dashboard, never committed. The README has
the step-by-step setup.

---

## 18. Cheat sheet: SPA habit → Next.js equivalent

| SPA habit | In this project |
| --- | --- |
| `react-router` route config | Folders in `src/app` |
| `useEffect` + `fetch` + loading state | `async` Server Component + `<Suspense>` |
| API keys in `.env` exposed to the bundle | `process.env.GITHUB_TOKEN` read only on the server (`server-only`) |
| Global spinner | `loading.tsx` or a `<Suspense fallback>` per section |
| `<ErrorBoundary>` | `error.tsx` |
| 404 route | `notFound()` + `not-found.tsx` |
| `react-helmet` | `metadata` / `generateMetadata` |
| Backend for the frontend | `route.ts` Route Handlers |
| HTTP caching / SWR on the client only | `"use cache"` + `cacheLife` + `cacheTag` on the server, TanStack Query on the client |
| Rebuild and redeploy to update static pages | ISR + `revalidateTag` |
| Modal state in `useState` | Parallel + intercepting routes, state in the URL |
| Page unmounts when you navigate away | Page is hidden with `<Activity>` and restored on Back |
| `POST /api/...` endpoint + `fetch` for mutations | Server Action (`"use server"`) called like a function or used as `<form action>` |
| localStorage for user prefs | Cookie set in a Server Action, readable by Server Components |
| Optimistic update by hand | TanStack `onMutate` + rollback, or React `useOptimistic` |
| Redirect rules in nginx / Netlify `_redirects` | `src/proxy.ts` (redirect, rewrite, headers) |
| Static `og-image.png` per page | `opengraph-image.tsx` generating images from data |
| Hand-written `sitemap.xml` / `robots.txt` | `app/sitemap.ts` / `app/robots.ts` |
| Jest + jsdom for everything | Vitest for server-side logic, Playwright against a production build |
| Upload `dist/` to a static host | Vercel builds from GitHub: CDN for static pages, functions for the rest |
