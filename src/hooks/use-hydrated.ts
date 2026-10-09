"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * false during SSR and the hydration render, true afterwards.
 *
 * Use it for UI that depends on browser-only data (here: the watchlist, which
 * the client fetches after load). If that data happens to be in the cache
 * already when a component hydrates, rendering it straight away would differ
 * from the server HTML, and React does not patch mismatched attributes such as
 * `disabled`. Rendering the server version first, then updating, avoids that.
 */
export function useHydrated() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
