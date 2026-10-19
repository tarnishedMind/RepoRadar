import { describe, expect, it } from "vitest";
import { hasBearerToken } from "./bearer-token";

describe("hasBearerToken", () => {
  it("accepts the right token", () => {
    expect(hasBearerToken("Bearer s3cret", "s3cret")).toBe(true);
  });

  it.each([
    ["a wrong token", "Bearer nope", "s3cret"],
    ["a token of a different length", "Bearer s3cret!", "s3cret"],
    ["another scheme", "Basic s3cret", "s3cret"],
    ["no header", null, "s3cret"],
    ["no secret configured", "Bearer ", undefined],
    ["an empty secret", "Bearer ", ""],
  ])("rejects %s", (_, header, secret) => {
    expect(hasBearerToken(header, secret)).toBe(false);
  });
});
