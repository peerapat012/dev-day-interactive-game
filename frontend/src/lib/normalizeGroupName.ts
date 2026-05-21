/**
 * Canonical group labels after classification.
 *
 * Used only in Next.js POST /api/classify (server route), after the LLM returns
 * labels — regardless of backend:
 *   - FastAPI local (LLM_CLASSIFY_BATCH_URL)
 *   - Appwrite function (/classify-batch)
 *   - mock (LLM_USE_MOCK=true)
 *
 * Not used inside Python/FastAPI or Appwrite function code.
 */

const ALIASES: Record<string, string> = {
  // --- Tech: keep Frameworks / Languages / Programming separate (never "technology") ---
  tech: "programming",
  technologies: "programming",
  technology: "programming",
  technological: "programming",
  coding: "programming",
  software: "programming",
  code: "programming",
  developer: "programming",
  developers: "programming",
  development: "programming",
  program: "programming",
  programs: "programming",
  programming: "programming",
  cs: "programming",
  "computer science": "programming",
  it: "programming",

  framework: "frameworks",
  frameworks: "frameworks",
  library: "frameworks",
  libraries: "frameworks",
  toolkit: "frameworks",
  react: "frameworks",
  reactjs: "frameworks",
  vue: "frameworks",
  angular: "frameworks",
  django: "frameworks",
  flask: "frameworks",
  nextjs: "frameworks",
  "next.js": "frameworks",
  spring: "frameworks",
  node: "frameworks",
  nodejs: "frameworks",
  "node.js": "frameworks",

  "programming language": "programming languages",
  "programming languages": "programming languages",
  "spoken language": "spoken languages",
  "spoken languages": "spoken languages",
  "natural languages": "spoken languages",
  "natural language": "spoken languages",
  "world languages": "spoken languages",
  "human languages": "spoken languages",
  "language learning": "spoken languages",
  english: "spoken languages",
  spanish: "spoken languages",
  french: "spoken languages",
  german: "spoken languages",
  italian: "spoken languages",
  portuguese: "spoken languages",
  chinese: "spoken languages",
  mandarin: "spoken languages",
  japanese: "spoken languages",
  korean: "spoken languages",
  thai: "spoken languages",
  vietnamese: "spoken languages",
  hindi: "spoken languages",
  arabic: "spoken languages",
  python: "programming languages",
  javascript: "programming languages",
  typescript: "programming languages",
  java: "programming languages",
  rust: "programming languages",
  golang: "programming languages",
  ruby: "programming languages",
  php: "programming languages",
  sql: "programming languages",
  go: "programming languages",
  csharp: "programming languages",
  "c++": "programming languages",
  kotlin: "programming languages",
  swift: "programming languages",
  scala: "programming languages",

  frontend: "frontend",
  "front end": "frontend",
  "front-end": "frontend",
  front: "frontend",
  ui: "frontend",
  ux: "frontend",
  web: "frontend",
  webdev: "frontend",
  "web dev": "frontend",
  "web development": "frontend",
  html: "frontend",
  css: "frontend",

  backend: "backend",
  "back end": "backend",
  "back-end": "backend",
  api: "backend",
  apis: "backend",
  server: "backend",
  servers: "backend",
  database: "backend",
  databases: "backend",
  db: "backend",

  devops: "devops",
  "dev ops": "devops",
  cloud: "devops",
  infrastructure: "devops",
  docker: "devops",
  kubernetes: "devops",
  k8s: "devops",

  ai: "programming",
  ml: "programming",
  "machine learning": "programming",
  datascience: "programming",
  "data science": "programming",

  // --- Other domains ---
  dog: "animal",
  dogs: "animal",
  cat: "animal",
  cats: "animal",
  pets: "animal",
  pet: "animal",
  wildlife: "animal",
  animals: "animal",
  animal: "animal",

  meal: "food",
  meals: "food",
  cooking: "food",
  cook: "food",
  recipe: "food",
  recipes: "food",
  food: "food",
  restaurant: "food",
  restaurants: "food",

  sport: "sports",
  sports: "sports",
  fitness: "sports",
  exercise: "sports",
  gym: "sports",

  travel: "travel",
  trip: "travel",
  trips: "travel",
  vacation: "travel",
  holidays: "travel",

  music: "entertainment",
  movie: "entertainment",
  movies: "entertainment",
  film: "entertainment",
  films: "entertainment",
  entertainment: "entertainment",
  game: "entertainment",
  games: "entertainment",
  gaming: "entertainment",

  emotion: "emotions",
  emotions: "emotions",
  feeling: "emotions",
  feelings: "emotions",

  // --- Overly broad LLM fallbacks → uncategorized (re-classify or edit) ---
  general: "uncategorized",
  other: "uncategorized",
  misc: "uncategorized",
  miscellaneous: "uncategorized",
  unknown: "uncategorized",
  various: "uncategorized",
  lifestyle: "uncategorized",
};

function singularize(word: string): string {
  if (word.length <= 3) return word;
  if (word.endsWith("ies") && word.length > 4) {
    return `${word.slice(0, -3)}y`;
  }
  if (word.endsWith("ses") || word.endsWith("xes") || word.endsWith("zes")) {
    return word.slice(0, -2);
  }
  if (word.endsWith("s") && !word.endsWith("ss")) {
    return word.slice(0, -1);
  }
  return word;
}

/**
 * Normalizes LLM category strings into canonical group keys for storage and visualization.
 */
export function normalizeGroupName(raw: string): string {
  const cleaned = raw
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, " ");

  if (!cleaned) return "uncategorized";

  const direct = ALIASES[cleaned];
  if (direct) return direct;

  const words = cleaned.split(" ").map(singularize);
  const normalized = words.join(" ").trim();
  return ALIASES[normalized] ?? normalized;
}
