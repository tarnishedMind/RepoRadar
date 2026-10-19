# 0001. Record architecture decisions

**Status:** Accepted (2026-10-18)

## Context

RepoRadar is a portfolio project. Its structure is meant to be read and
judged, and it is also worked on with an AI assistant that needs stable rules.
Decisions that live only in chat get lost and re-argued.

## Decision

Keep Architecture Decision Records in `docs/adr/`, one short file per
decision. The working rules derived from them live in `.claude/skills/`
(`reporadar-architecture`, `reporadar-principles`, `reporadar-refactoring`),
and those skills link back to the records.

## Consequences

- A structural change that contradicts a record needs a new record first.
- Reviewers can see why the code looks the way it does, not only how.
