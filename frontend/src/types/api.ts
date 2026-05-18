export interface ClassifyRequest {
  input: string;
}

export interface ClassifyResponse {
  input: string;
  group: string;
}

/** FastAPI /clarify request body */
export interface ChatRequest {
  message: string;
}

/** FastAPI /clarify response body */
export interface ChatResponse {
  message: string;
}

/** One group — `inputs` is all user phrases as one comma-separated plain text string */
export interface SummarizeGroupPayload {
  group: string;
  inputs: string;
}

/** Client → Next.js /api/summarize */
export interface SummarizeBatchRequest {
  groups: SummarizeGroupPayload[];
}

/** FastAPI /summarize request body */
export interface FastApiSummarizeRequest {
  groups: SummarizeGroupPayload[];
}

/** FastAPI /summarize response item */
export interface FastApiSummarizeItem {
  group: string;
  summarize: string;
}

/** FastAPI /summarize response body */
export interface FastApiSummarizeResponse {
  summarize: FastApiSummarizeItem[];
}

/** UI summary card */
export interface SummarizeResultItem {
  group: string;
  summary: string;
}

/** Client ← Next.js /api/summarize */
export interface SummarizeBatchResponse {
  summaries: SummarizeResultItem[];
}
