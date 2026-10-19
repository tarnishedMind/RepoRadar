import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/**
 * Layer boundaries (docs/adr/0002, 0003): app → features → entities → shared.
 * Each block below repeats the shared patterns because a later
 * `no-restricted-imports` config replaces an earlier one instead of merging.
 */
const publicApiOnly = [
  {
    group: ["@/features/*/*", "!@/features/*/server"],
    message: "Import a feature through @/features/<name> or @/features/<name>/server.",
  },
  {
    group: ["@/entities/*/*", "!@/entities/*/server"],
    message: "Import an entity through @/entities/<name> or @/entities/<name>/server.",
  },
  {
    group: ["@/app", "@/app/**"],
    message: "Nothing imports from the app layer; move shared code down to features, entities or shared.",
  },
];

const noParentImports = {
  group: ["../*"],
  message: "Use an @/ import to reach another folder, so the layer rules can check it.",
};

const restrict = (...patterns) => ({
  "no-restricted-imports": ["error", { patterns: [...publicApiOnly, ...patterns] }],
});

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      ...restrict(),
      "import/no-cycle": "error",
    },
  },
  {
    files: ["src/features/**/*.{ts,tsx}"],
    rules: restrict(noParentImports),
  },
  {
    files: ["src/entities/**/*.{ts,tsx}"],
    rules: restrict(noParentImports, {
      group: ["@/features", "@/features/**"],
      message: "Entities must not import features (layers only import downward).",
    }),
  },
  {
    files: ["src/shared/**/*.{ts,tsx}"],
    rules: restrict(noParentImports, {
      group: ["@/features", "@/features/**", "@/entities", "@/entities/**"],
      message: "Shared code has no domain knowledge: it must not import features or entities.",
    }),
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
