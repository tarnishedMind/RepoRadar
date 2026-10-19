# 0007. Biome as the code formatter, ESLint stays the linter

**Status:** Accepted (2026-10-19)

## Context

The repo has no formatter. Style is consistent only because it was written
carefully: lines run from 80 to well past 100 characters, and wrapping
differs from file to file. Nothing checks it in CI.

Prettier and Biome were considered. Prettier has `prettier-plugin-tailwindcss`
for sorting class names; Biome's equivalent (`useSortedClasses`) is still a
nursery lint rule. Biome is a single dependency with no plugins, formats TS,
TSX, JSON and CSS (including Tailwind directives), and its output is close to
Prettier's.

Replacing ESLint with Biome's linter was also considered and rejected for now:
`eslint-config-next` carries the Next.js and React Hooks rules, and the layer
boundaries (ADR 0002, 0003) depend on `no-restricted-imports` with negated
globs and `import/no-cycle`.

## Decision

- Biome formats; its linter and assist (import sorting) are off. ESLint keeps
  every lint rule.
- `biome.json`: 2-space indent, line width 100 (the width most of the code
  already uses), otherwise Biome defaults (double quotes, semicolons, trailing
  commas). Files ignored by git, `.vscode/` and `pnpm-lock.yaml` are skipped.
- `@biomejs/biome` is pinned to an exact version, because formatter output can
  change between releases. Upgrading it is a reformat commit of its own.
- `pnpm format` writes, `pnpm format:check` verifies; CI runs the check before
  lint.
- The first reformat lands as one commit with no other change, listed in
  `.git-blame-ignore-revs`.

## Consequences

- No style discussion in review; CI fails on unformatted code.
- Tailwind classes stay in hand-written order. Revisit if Biome's class
  sorting becomes stable, or switch to Prettier with a new record.
- Two tools instead of one. Moving linting to Biome later needs equivalents for
  the boundary rules and a new record.
