import { beforeEach, describe, expect, it, vi } from "vitest";
import { readHistory, subscribeHistory, writeHistory } from "./history-store";

// Unit tests run in plain Node: give the module a minimal window + localStorage.
const items = new Map<string, string>();
const localStorage = {
  getItem: (k: string) => items.get(k) ?? null,
  setItem: (k: string, v: string) => void items.set(k, v),
  removeItem: (k: string) => void items.delete(k),
};

beforeEach(() => {
  items.clear();
  vi.stubGlobal("localStorage", localStorage);
  vi.stubGlobal("window", new EventTarget());
});

describe("history store", () => {
  it("round-trips entries and returns the same array while nothing changed", () => {
    writeHistory([{ query: "dates", at: 1 }]);
    const first = readHistory();
    expect(first).toEqual([{ query: "dates", at: 1 }]);
    expect(readHistory()).toBe(first);
  });

  it("removes the key when the history is cleared", () => {
    writeHistory([{ query: "dates", at: 1 }]);
    writeHistory([]);
    expect(items.size).toBe(0);
    expect(readHistory()).toEqual([]);
  });

  it("treats corrupt or blocked storage as empty", () => {
    items.set("reporadar:find-history", "{not json");
    expect(readHistory()).toEqual([]);
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    });
    expect(readHistory()).toEqual([]);
    expect(() => writeHistory([{ query: "x", at: 1 }])).not.toThrow();
  });

  it("notifies subscribers of writes in this tab and of other tabs", () => {
    const onChange = vi.fn();
    const unsubscribe = subscribeHistory(onChange);
    writeHistory([{ query: "a", at: 1 }]);
    window.dispatchEvent(new Event("storage"));
    expect(onChange).toHaveBeenCalledTimes(2);
    unsubscribe();
    writeHistory([]);
    expect(onChange).toHaveBeenCalledTimes(2);
  });
});

describe("history actions", () => {
  it("adds, removes and clears entries", async () => {
    const { addHistoryEntry, clearHistory, removeHistoryEntry } = await import("./history-store");
    addHistoryEntry("dates");
    addHistoryEntry("scrapers");
    expect(readHistory().map((e) => e.query)).toEqual(["scrapers", "dates"]);
    removeHistoryEntry("SCRAPERS");
    expect(readHistory().map((e) => e.query)).toEqual(["dates"]);
    clearHistory();
    expect(readHistory()).toEqual([]);
  });
});
