import { expect, test } from "@playwright/test";

test("home page searches with next/form", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "RepoRadar" })).toBeVisible();

  await page.getByPlaceholder("Search repositories…").fill("tanstack query");
  await page.getByRole("button", { name: "Search" }).click();

  await expect(page).toHaveURL(/\/search\?q=tanstack\+query/);
  await expect(page.getByText(/^[\d.,]+[KMB]? repositories$/)).toBeVisible();
  await expect(page.locator("main a[href^='/']").first()).toBeVisible();
});

test("repo page renders server data and streams the README", async ({ page }) => {
  await page.goto("/vercel/next.js");
  await expect(page).toHaveTitle("vercel/next.js · RepoRadar");
  // The README can contain its own <h1>, so scope to the page header.
  await expect(page.locator("main header h1")).toContainText("next.js");
  await expect(page.getByText("Stars", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "README" })).toBeVisible();
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    "content",
    /\/vercel\/next\.js\/opengraph-image/,
  );
});

test("search result opens in an intercepted modal and closes on Escape", async ({ page }) => {
  await page.goto("/search?q=react");
  const firstResult = page.locator("main a.rounded-lg").first();
  const href = await firstResult.getAttribute("href");
  await firstResult.click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(page).toHaveURL(href!);
  await expect(page.locator("main a.rounded-lg").first()).toBeAttached(); // results stay underneath

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(page).toHaveURL(/\/search\?q=react/);
});

test("opening a repo URL directly renders the full page, not the modal", async ({ page }) => {
  await page.goto("/facebook/react");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "README" })).toBeVisible();
});

test("watchlist: watch optimistically, list it, remove it", async ({ page }) => {
  await page.goto("/vercel/next.js");
  const watch = page.getByRole("button", { name: "☆ Watch" });
  await expect(watch).toBeEnabled();
  await watch.click();

  await expect(page.getByRole("button", { name: "★ Watching" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Watchlist\s*1/ })).toBeVisible();

  await page.getByRole("link", { name: /Watchlist/ }).click();
  await expect(page.getByText("vercel/next.js", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Remove" }).click();
  await expect(page.getByText(/Nothing here yet/)).toBeVisible();
});

test("proxy cleans up GitHub-style URLs", async ({ page }) => {
  await page.goto("/github.com/vercel/next.js/tree/canary");
  await expect(page).toHaveURL(/\/vercel\/next\.js$/);

  await page.goto("/@vercel");
  await expect(page).toHaveURL(/\/@vercel$/); // rewrite keeps the URL
  await expect(page.getByText("@vercel", { exact: true })).toBeVisible();
});

test("unknown repositories show the not-found page", async ({ page }) => {
  await page.goto("/this-owner-does-not-exist-xyz/nope");
  await expect(page.getByRole("heading", { name: "Not found" })).toBeVisible();
});

test("fields: pick a field and see its ranked repositories", async ({ page }) => {
  await page.goto("/fields");
  await page.getByRole("link", { name: /^Frontend/ }).click();

  await expect(page).toHaveURL("/fields/frontend");
  await expect(page.getByRole("heading", { name: "Top Frontend repositories" })).toBeVisible();
  await expect(page.locator("main ol li").first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Backend", exact: true })).toHaveAttribute(
    "href",
    "/fields/backend",
  );
});

test("describe it: a plain-language request returns repositories", async ({ page }) => {
  await page.goto("/find");
  await page.getByRole("link", { name: "Fast state management for React" }).click();

  await expect(page).toHaveURL(/\/find\?q=Fast\+state\+management\+for\+React/);
  await expect(page.getByLabel("Describe what you need")).toHaveValue(
    "Fast state management for React",
  );
  // With GROQ_API_KEY: "Best matches"; without it (CI): plain keyword "Results". Up to three
  // GitHub searches run one after another (plus a model call), so allow more than the default.
  await expect(page.getByRole("heading", { name: /^(Best matches|Results)$/ })).toBeVisible({
    timeout: 20_000,
  });
  await expect(page.locator("main section a[href^='/']").first()).toBeVisible();
});

test("describe it: history keeps recent requests and can remove them", async ({ page }) => {
  const recent = page.getByRole("region", { name: "Recent requests" });
  // A request is recorded by an effect after hydration, which can come after the
  // load event on a slow machine (CI). Wait for its chip before navigating on.
  for (const query of ["Fast state management for React", "A Python tool to scrape websites"]) {
    await page.goto(`/find?q=${encodeURIComponent(query)}`);
    await expect(recent.getByRole("link", { name: query })).toBeVisible();
  }
  await page.goto("/find");

  await expect(recent.getByRole("link")).toHaveText([
    "A Python tool to scrape websites",
    "Fast state management for React",
  ]);

  await recent
    .getByRole("button", { name: "Remove “A Python tool to scrape websites” from history" })
    .click();
  await expect(recent.getByRole("link")).toHaveText(["Fast state management for React"]);

  await recent.getByRole("button", { name: "Clear all" }).click();
  await expect(recent).toBeHidden();

  // Survives a reload: it lives in localStorage, not in React state.
  await page.reload();
  await expect(page.getByRole("region", { name: "Recent requests" })).toBeHidden();
});
