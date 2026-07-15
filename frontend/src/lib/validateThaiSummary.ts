import type { SummarizeResultItem } from "@/types/api";

const THAI_CHARACTER = /[\u0E00-\u0E7F]/;

export function assertThaiSummaryContract(
  summaries: SummarizeResultItem[],
): void {
  if (summaries.length === 0) {
    throw new Error("Summary response must contain at least one topic");
  }

  summaries.forEach((item, index) => {
    if (!item.group.trim()) {
      throw new Error(`Summary topic ${index + 1} is missing its group key`);
    }
    if (!item.topic?.trim()) {
      throw new Error(`Summary topic ${index + 1} is missing its display name`);
    }
    if (!item.summary.trim() || !THAI_CHARACTER.test(item.summary)) {
      throw new Error(
        `Summary topic ${index + 1} must have a Thai description`,
      );
    }
  });
}
