# Architecture Decision Records

Short records of decisions that shape RepoRadar's structure: what we chose,
why, and what it costs. They explain the "why" behind the rules in
`.claude/skills/` and `docs/ARCHITECTURE.md`.

## Format

One file per decision, `NNNN-kebab-title.md`, numbered in order. Sections:
**Status** (Proposed, Accepted, Superseded by NNNN), **Context**, **Decision**,
**Consequences**. Accepted records are not rewritten; a change of mind is a new
record that supersedes the old one.

## Index

| # | Decision | Status |
| --- | --- | --- |
| [0001](0001-record-architecture-decisions.md) | Record architecture decisions | Accepted |
| [0002](0002-feature-folder-layers.md) | Feature folders with four import layers | Accepted |
| [0003](0003-cross-feature-imports.md) | Features may import each other through their public API | Accepted |
| [0004](0004-validation-at-trust-boundaries.md) | Hand-written type guards at trust boundaries (zod optional later) | Accepted |
| [0005](0005-typed-env-module.md) | One typed module for environment variables | Accepted |
| [0006](0006-unit-test-coverage-threshold.md) | 80% line coverage for entities and pure logic | Accepted |
