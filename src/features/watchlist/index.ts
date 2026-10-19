// Client-safe public API of the watchlist feature.
export { setWatched, removeFromWatchlist } from "./actions";
export type { WatchlistResult } from "./list";
export { watchlistQueryOptions } from "./queries";
export { WatchButton } from "./watch-button";
export { WatchlistNavLink } from "./watchlist-nav-link";
