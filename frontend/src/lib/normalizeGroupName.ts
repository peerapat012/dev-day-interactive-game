const ALIASES: Record<string, string> = {
  tech: "technology",
  technologies: "technology",
  coding: "technology",
  programming: "technology",
  software: "technology",
  ai: "technology",
  ml: "technology",
  dog: "animal",
  dogs: "animal",
  cat: "animal",
  cats: "animal",
  pets: "animal",
  wildlife: "animal",
  meal: "food",
  meals: "food",
  cooking: "food",
  recipe: "food",
  recipes: "food",
  sport: "sports",
  fitness: "sports",
  travel: "travel",
  trip: "travel",
  music: "entertainment",
  movie: "entertainment",
  movies: "entertainment",
  film: "entertainment",
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
 * Normalizes LLM category strings so "Tech", "technology", and "coding"
 * collapse into one canonical group key for storage and visualization.
 */
export function normalizeGroupName(raw: string): string {
  const cleaned = raw
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, " ");

  if (!cleaned) return "uncategorized";

  const alias = ALIASES[cleaned];
  if (alias) return alias;

  const words = cleaned.split(" ").map(singularize);
  const normalized = words.join(" ").trim();
  return ALIASES[normalized] ?? normalized;
}
