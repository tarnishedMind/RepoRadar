import { describe, expect, it } from "vitest";
import { addToHistory, HISTORY_LIMIT, parseHistory, removeFromHistory } from "./history";

describe("addToHistory", () => {
  it("puts the newest query first", () => {
    const history = addToHistory([{ query: "old", at: 1 }], "new", 2);
    expect(history.map((e) => e.query)).toEqual(["new", "old"]);
  });

  it("moves a repeated query up instead of copying it", () => {
    const history = addToHistory(
      [
        { query: "a", at: 2 },
        { query: "Dates in  JS", at: 1 },
      ],
      " dates in js ",
      3,
    );
    expect(history).toEqual([
      { query: "dates in js", at: 3 },
      { query: "a", at: 2 },
    ]);
  });

  it("keeps at most the limit and ignores empty queries", () => {
    let history = parseHistory([]);
    for (let i = 0; i < HISTORY_LIMIT + 5; i++) history = addToHistory(history, `q${i}`, i);
    expect(history).toHaveLength(HISTORY_LIMIT);
    expect(history[0].query).toBe(`q${HISTORY_LIMIT + 4}`);
    expect(addToHistory(history, "   ", 99)).toBe(history);
  });
});

describe("removeFromHistory", () => {
  it("removes regardless of case and spacing", () => {
    expect(removeFromHistory([{ query: "Dates in JS", at: 1 }], "dates  in js")).toEqual([]);
  });
});

describe("parseHistory", () => {
  it("keeps valid entries, newest first, without duplicates", () => {
    expect(
      parseHistory([
        { query: "a", at: 1 },
        { query: "b", at: 3 },
        { query: "A", at: 2 },
        { query: "", at: 4 },
        { query: 5, at: 5 },
        { query: "c", at: Number.NaN },
        null,
        "d",
      ]),
    ).toEqual([
      { query: "b", at: 3 },
      { query: "A", at: 2 },
    ]);
  });

  it.each([null, "x", {}, 42])("returns an empty list for %j", (raw) => {
    expect(parseHistory(raw)).toEqual([]);
  });

  it("caps entries and their length", () => {
    const raw = Array.from({ length: 20 }, (_, i) => ({ query: `${i}`.padEnd(300, "x"), at: i }));
    const history = parseHistory(raw);
    expect(history).toHaveLength(HISTORY_LIMIT);
    expect(history[0].query).toHaveLength(200);
  });
});
