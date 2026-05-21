const KEYWORD_GROUPS: Array<{ keywords: string[]; group: string }> = [
  {
    keywords: [
      "react",
      "vue",
      "angular",
      "django",
      "flask",
      "next",
      "nextjs",
      "spring",
      "tensorflow",
    ],
    group: "frameworks",
  },
  {
    keywords: [
      "english",
      "spanish",
      "french",
      "german",
      "mandarin",
      "japanese",
      "korean",
      "thai",
      "vietnamese",
      "arabic",
      "portuguese",
      "italian",
    ],
    group: "spoken languages",
  },
  {
    keywords: [
      "python",
      "java",
      "javascript",
      "typescript",
      "rust",
      "golang",
      "ruby",
      "php",
      "sql",
      "kotlin",
      "swift",
    ],
    group: "programming languages",
  },
  {
    keywords: [
      "code",
      "software",
      "ai",
      "tech",
      "computer",
      "app",
      "data",
      "cloud",
      "programming",
      "coding",
    ],
    group: "programming",
  },
  {
    keywords: ["dog", "cat", "pet", "animal", "bird", "fish", "wild"],
    group: "animal",
  },
  {
    keywords: ["food", "eat", "pizza", "coffee", "recipe", "cook", "meal"],
    group: "food",
  },
  {
    keywords: ["run", "gym", "sport", "fitness", "soccer", "game"],
    group: "sports",
  },
  {
    keywords: ["trip", "travel", "flight", "beach", "hotel"],
    group: "travel",
  },
  {
    keywords: ["music", "movie", "film", "show", "concert"],
    group: "entertainment",
  },
];

export function mockClassifyGroup(input: string): string {
  const lower = input.toLowerCase();
  for (const rule of KEYWORD_GROUPS) {
    if (rule.keywords.some((kw) => lower.includes(kw))) {
      return rule.group;
    }
  }
  const firstWord = lower.split(/\s+/)[0]?.replace(/[^a-z]/g, "");
  return firstWord && firstWord.length > 2 ? firstWord : "general";
}

export function mockClassifyBatch(
  items: Array<{ id: string; input: string }>,
): Array<{ id: string; group: string }> {
  return items.map((item) => ({
    id: item.id,
    group: mockClassifyGroup(item.input),
  }));
}

export function mockSummarize(group: string, inputsPlainText: string): string {
  const sample = inputsPlainText.slice(0, 200);
  return `Mock summary for "${group}": participants mentioned themes like ${sample || "varied topics"}.`;
}

export function mockSummarizeBatch(
  groups: Array<{ group: string; inputs: string }>,
): Array<{ group: string; summary: string }> {
  return groups.map(({ group, inputs }) => ({
    group,
    summary: mockSummarize(group, inputs),
  }));
}
