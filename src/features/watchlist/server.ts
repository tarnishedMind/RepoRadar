import "server-only";

// Server-only public API of the watchlist feature (reads the cookie).
export { readWatchlist } from "./storage";
export { WatchlistContent, WatchlistSkeleton } from "./watchlist-content";
