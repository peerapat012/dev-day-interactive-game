import type { SummarizeResultItem } from "@/types/api";

function itemToResult(item: unknown, index: number): SummarizeResultItem {
  if (!item || typeof item !== "object") {
    throw new Error(`LLM summarize: invalid item at index ${index}`);
  }
  const row = item as Record<string, unknown>;
  const group = String(row.group ?? row.name ?? row.category ?? "").trim();
  const summary = String(
    row.summarize ?? row.summary ?? row.text ?? row.message ?? row.content ?? "",
  ).trim();

  if (!group) {
    throw new Error(`LLM summarize: item at index ${index} is missing "group"`);
  }

  return { group, summary };
}

function listFromRecord(record: Record<string, unknown>): unknown {
  return (
    record.summarize ??
    record.summaries ??
    record.summary ??
    record.results ??
    record.data
  );
}

/**
 * Accepts common FastAPI response shapes:
 * - { summarize: [{ group, summarize|summary }] }
 * - { summaries: [...] }
 * - [{ group, summarize|summary }]
 * - { summarize: { "technology": "text..." } }
 */
export function parseSummarizeResponse(data: unknown): SummarizeResultItem[] {
  if (data === null || data === undefined) {
    throw new Error("LLM summarize: empty response body");
  }

  if (Array.isArray(data)) {
    return data.map((item, i) => itemToResult(item, i));
  }

  if (typeof data !== "object") {
    throw new Error(
      `LLM summarize: expected JSON object or array, got ${typeof data}`,
    );
  }

  const root = data as Record<string, unknown>;
  let list = listFromRecord(root);

  if (list && typeof list === "object" && !Array.isArray(list)) {
    const nested = list as Record<string, unknown>;
    if ("group" in nested || "summarize" in nested || "summary" in nested) {
      list = [list];
    } else {
      return Object.entries(nested).map(([group, value]) => {
        if (typeof value === "string") {
          return { group, summary: value.trim() };
        }
        if (value && typeof value === "object") {
          return itemToResult({ group, ...(value as object) }, 0);
        }
        return { group, summary: String(value ?? "").trim() };
      });
    }
  }

  if (!Array.isArray(list) || list.length === 0) {
    const keys = Object.keys(root).join(", ") || "(none)";
    const preview = JSON.stringify(root).slice(0, 400);
    throw new Error(
      `LLM summarize: could not find results array. Top-level keys: ${keys}. Body: ${preview}`,
    );
  }

  return list.map((item, i) => itemToResult(item, i));
}
