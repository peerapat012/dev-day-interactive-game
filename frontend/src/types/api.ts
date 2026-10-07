/** One row pending classification (Appwrite document id + user text). */
export interface ClassifyBatchItem {
  id: string;
  input: string;
}

/** Host summary generate payload — includes guest display name for Round Summary chips. */
export interface HostSummaryGenerateItem extends ClassifyBatchItem {
  /** Guest display name; omitted or empty falls back to "Guest" in saved contributors. */
  name?: string;
}

/** Client → Next.js POST /api/classify */
export interface ClassifyBatchRequest {
  items: ClassifyBatchItem[];
  /** Optional host-authored round question the entries answer. */
  question?: string;
}

export interface ClassifyBatchResultItem {
  id: string;
  input: string;
  group: string;
}

export interface ClassifyBatchResponse {
  results: ClassifyBatchResultItem[];
}

/** Server-side AI classification result. */
export interface AiClassifyBatchResponse {
  results: Array<{ id: string; group: string }>;
}

/** One group — `inputs` is all user phrases as one comma-separated plain text string */
export interface SummarizeGroupPayload {
  group: string;
  inputs: string;
}

/** Client → Next.js /api/summarize */
export interface SummarizeBatchRequest {
  groups: SummarizeGroupPayload[];
  /** Optional host-authored round question the entries answer. */
  question?: string;
}

/** UI summary card */
export interface SummarizeResultItem {
  /** Stable classification key used to match persisted groups. */
  group: string;
  /** Display name: Thai when natural, otherwise English. */
  topic?: string;
  /** Thai topic description. */
  summary: string;
}

/** Client ← Next.js /api/summarize */
export interface SummarizeBatchResponse {
  summaries: SummarizeResultItem[];
}

/** Client → Next.js POST /api/host-summary/generate */
export interface HostSummaryGenerateRequest {
  items: HostSummaryGenerateItem[];
  /** Optional host-authored round question captured with the entry snapshot. */
  question?: string;
}

/** Classification data returned only so the client can persist the room snapshot. */
export interface HostSummaryEntryGroup {
  id: string;
  group: string;
}

/** Client ← Next.js POST /api/host-summary/generate */
export interface HostSummaryGenerateResponse {
  entryGroups: HostSummaryEntryGroup[];
  groups: import("@/types/entry").GroupStat[];
  summaries: SummarizeResultItem[];
}

/** Client → Next.js POST /api/generate-questions */
export interface GenerateQuestionsRequest {
  /** Subject the questions should cover (e.g. "Space exploration"). */
  topic: string;
  /** How many questions to generate. */
  questionCount: number;
  /** How many options each question should have. */
  optionCount: number;
  /** Prompt/options language, e.g. "Thai" or "English". */
  language: string;
}

/** One AI-generated quiz question. */
export interface GeneratedQuestion {
  prompt: string;
  options: string[];
  /** 0-based index of the correct option in `options`. */
  correctOptionIndex: number;
}

/** Next.js POST /api/generate-questions response body. */
export interface GenerateQuestionsResponse {
  questions: GeneratedQuestion[];
}
