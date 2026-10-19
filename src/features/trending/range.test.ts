import { describe, expect, it } from "vitest";
import { parseRange } from "./range";

describe("parseRange", () => {
  it("defaults to weekly", () => {
    expect(parseRange(undefined)).toBe("weekly");
    expect(parseRange([])).toBe("weekly");
  });

  it("accepts a known range", () => {
    expect(parseRange(["daily"])).toBe("daily");
  });

  it("rejects unknown or extra segments", () => {
    expect(parseRange(["yearly"])).toBeNull();
    expect(parseRange(["daily", "extra"])).toBeNull();
  });
});
