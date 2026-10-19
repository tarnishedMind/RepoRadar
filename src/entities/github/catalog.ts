/** Static lookup tables shared by server pages and client components. */

export const TRENDING_RANGES = {
  daily: { label: "Today", days: 1 },
  weekly: { label: "This week", days: 7 },
  monthly: { label: "This month", days: 30 },
} as const;

export type TrendingRange = keyof typeof TRENDING_RANGES;

export function isTrendingRange(value: string): value is TrendingRange {
  return Object.hasOwn(TRENDING_RANGES, value);
}

/** URL slug → GitHub `language:` qualifier value and display name. */
export const LANGUAGES = {
  typescript: "TypeScript",
  javascript: "JavaScript",
  python: "Python",
  go: "Go",
  rust: "Rust",
  java: "Java",
  kotlin: "Kotlin",
  swift: "Swift",
  cpp: "C++",
  csharp: "C#",
  ruby: "Ruby",
  php: "PHP",
} as const;

export type LanguageSlug = keyof typeof LANGUAGES;

export function isLanguageSlug(value: string): value is LanguageSlug {
  return Object.hasOwn(LANGUAGES, value);
}
