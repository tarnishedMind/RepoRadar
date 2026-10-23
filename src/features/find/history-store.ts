import { useSyncExternalStore } from "react";
import { addToHistory, type HistoryEntry, parseHistory, removeFromHistory } from "./history";

/**
 * /find history in localStorage, exposed to React through useSyncExternalStore:
 * the store lives outside React, React subscribes to it and re-renders on
 * change, including changes made in other tabs (the `storage` event).
 * Browser-only: on the server (and during hydration) the history is empty.
 */

const STORAGE_KEY = "reporadar:find-history";
/** `storage` only fires in *other* tabs, so this tab announces its own writes. */
const CHANGE_EVENT = "reporadar:find-history-change";
const EMPTY: HistoryEntry[] = [];

// useSyncExternalStore needs the same array back while nothing changed.
let lastRaw: string | null = null;
let lastParsed: HistoryEntry[] = EMPTY;

export function readHistory(): HistoryEntry[] {
  let raw: string | null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    return EMPTY; // storage blocked (privacy settings)
  }
  if (raw === lastRaw) return lastParsed;
  lastRaw = raw;
  try {
    lastParsed = raw ? parseHistory(JSON.parse(raw)) : EMPTY;
  } catch {
    lastParsed = EMPTY; // hand-edited or corrupt
  }
  return lastParsed;
}

export function writeHistory(history: HistoryEntry[]) {
  try {
    if (history.length) localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage full or blocked: history is a convenience, so fail quietly.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function subscribeHistory(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

export const addHistoryEntry = (query: string) =>
  writeHistory(addToHistory(readHistory(), query, Date.now()));
export const removeHistoryEntry = (query: string) =>
  writeHistory(removeFromHistory(readHistory(), query));
export const clearHistory = () => writeHistory([]);

export function useFindHistory() {
  return useSyncExternalStore(subscribeHistory, readHistory, () => EMPTY);
}
