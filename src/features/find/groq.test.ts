import { beforeEach, describe, expect, it, vi } from "vitest";
import { GROQ_MODEL, GroqError, groqJson } from "./groq";

const schema = { name: "test", schema: { type: "object" } };
const reply = (content: unknown, status = 200) =>
  new Response(JSON.stringify({ choices: [{ message: { content } }] }), { status });

const fetchMock = vi.fn<typeof fetch>();
beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock.mockReset());
  vi.stubEnv("GROQ_API_KEY", "test-key");
});

describe("groqJson", () => {
  it("sends a strict JSON-schema request and parses the answer", async () => {
    fetchMock.mockResolvedValueOnce(reply('{"ok":true}'));
    await expect(groqJson("sys", "user", schema, 500)).resolves.toEqual({ ok: true });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.groq.com/openai/v1/chat/completions");
    expect(new Headers(init?.headers).get("authorization")).toBe("Bearer test-key");
    expect(JSON.parse(String(init?.body))).toMatchObject({
      model: GROQ_MODEL,
      temperature: 0,
      max_completion_tokens: 500,
      response_format: { type: "json_schema", json_schema: { name: "test", strict: true } },
    });
  });

  it("throws without a key and never calls Groq", async () => {
    vi.stubEnv("GROQ_API_KEY", "");
    await expect(groqJson("s", "u", schema, 1)).rejects.toBeInstanceOf(GroqError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("throws with the status on HTTP errors such as an exhausted quota", async () => {
    fetchMock.mockResolvedValueOnce(new Response("slow down", { status: 429 }));
    await expect(groqJson("s", "u", schema, 1)).rejects.toMatchObject({ status: 429 });
  });

  it.each([
    ["no content", reply(null)],
    ["invalid JSON", reply("{not json")],
  ])("throws on %s", async (_, response) => {
    fetchMock.mockResolvedValueOnce(response);
    await expect(groqJson("s", "u", schema, 1)).rejects.toMatchObject({ status: 502 });
  });
});
