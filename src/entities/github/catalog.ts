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

/**
 * URL slug → a developer field: display name, one-line blurb and the GitHub
 * topics that define it. Each topic costs one search request per refresh, so
 * keep it to four.
 */
export const FIELDS = {
  frontend: {
    label: "Frontend",
    description: "UI frameworks and the tooling around them.",
    topics: ["react", "vue", "svelte", "angular"],
  },
  backend: {
    label: "Backend",
    description: "Servers, APIs and the frameworks behind them.",
    topics: ["backend", "rest-api", "microservices", "web-framework"],
  },
  mobile: {
    label: "Mobile",
    description: "Native and cross-platform apps for phones.",
    topics: ["android", "ios", "react-native", "flutter"],
  },
  devops: {
    label: "DevOps",
    description: "Containers, orchestration and infrastructure as code.",
    topics: ["devops", "kubernetes", "docker", "terraform"],
  },
  "ai-ml": {
    label: "AI / ML",
    description: "Machine learning, deep learning and LLM tooling.",
    topics: ["machine-learning", "deep-learning", "llm", "nlp"],
  },
  data: {
    label: "Data",
    description: "Databases, pipelines and analytics.",
    topics: ["database", "data-engineering", "etl", "analytics"],
  },
  gamedev: {
    label: "Game dev",
    description: "Engines, frameworks and games.",
    topics: ["game-engine", "gamedev", "godot", "unity"],
  },
  security: {
    label: "Security",
    description: "Offensive and defensive security, cryptography.",
    topics: ["security", "pentesting", "cryptography", "ctf"],
  },
  embedded: {
    label: "Embedded",
    description: "Microcontrollers, IoT and real-time systems.",
    topics: ["embedded", "iot", "arduino", "rtos"],
  },
} as const;

export type FieldSlug = keyof typeof FIELDS;

export function isFieldSlug(value: string): value is FieldSlug {
  return Object.hasOwn(FIELDS, value);
}
