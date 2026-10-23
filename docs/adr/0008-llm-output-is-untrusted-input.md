# 0008. LLM output is untrusted input, behind one small client

**Status:** Accepted (2026-10-22), implemented in M12

## Context

`/find` (M12) asks a language model to turn a plain-language request into
GitHub searches and to pick the best results with a reason each. The model
is a free Groq model (`openai/gpt-oss-20b`). Its output depends on text we
don't control: the visitor's request and repository descriptions written by
strangers, either of which can try to steer the model ("ignore your
instructions…"). Free plans also have tight quotas and can fail at any time.

## Decision

- Model output is treated like any other untrusted input (ADR 0004). Groq is
  asked for strict JSON-schema output, and the result still goes through pure
  `parseIntent` / `parsePicks` guards: unknown languages and malformed topics
  are dropped, keywords can't contain `:` (so they can't become search
  qualifiers), sizes are capped, and picks are kept only for repositories we
  actually showed the model. Reasons render as plain text.
- The model never gets tools, secrets or the ability to act: it only returns
  data that our code turns into GitHub searches.
- Groq is called with plain `fetch` from one server-only module
  (`features/find/groq.ts`); its API is OpenAI-compatible, so no SDK. Swapping
  providers means rewriting that one file.
- Every model failure (no key, kill switch, 429, timeout, invalid output)
  falls back to plain keyword search. Failures throw inside the `"use cache"`
  functions, so they are never cached; `unstable_rethrow` lets Next's own
  prerender-abort errors through the fallback `catch`.

## Consequences

- A manipulated request or description can at worst change which public
  repositories are shown and what the reason text says, and the page labels
  picks as AI-generated.
- No new dependency, at the cost of a hand-written request and response shape.
- Quota is protected by caching (days, keyed on the normalized request),
  input and token caps, `FIND_AI_ENABLED=false` as a kill switch, and a
  Vercel Firewall rate-limit rule on `/find`.
