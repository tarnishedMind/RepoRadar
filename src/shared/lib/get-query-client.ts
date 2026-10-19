import {
  QueryClient,
  defaultShouldDehydrateQuery,
  isServer,
} from "@tanstack/react-query";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // With SSR, avoid refetching immediately on the client after hydration.
        staleTime: 60 * 1000,
      },
      dehydrate: {
        // Also dehydrate pending queries so server prefetches can stream to the client.
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) ||
          query.state.status === "pending",
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

export function getQueryClient() {
  // Server: always a fresh client per request so data never leaks between users.
  if (isServer) return makeQueryClient();
  // Browser: reuse one client so React suspending during render doesn't recreate it.
  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
}
