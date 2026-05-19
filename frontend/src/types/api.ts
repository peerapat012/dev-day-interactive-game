/** One row pending classification (Appwrite document id + user text). */
export interface ClassifyBatchItem {
  id: string;
  input: string;
}

/** Client → Next.js POST /api/classify */
export interface ClassifyBatchRequest {
  items: ClassifyBatchItem[];
}

export interface ClassifyBatchResultItem {
  id: string;
  input: string;
  group: string;
}

export interface ClassifyBatchResponse {
  results: ClassifyBatchResultItem[];
}

/** FastAPI POST /classify-batch */
export interface FastApiClassifyBatchRequest {
  inputs: ClassifyBatchItem[];
}

export interface FastApiClassifyBatchResultItem {
  id: string;
  group: string;
}

export interface FastApiClassifyBatchResponse {
  results: FastApiClassifyBatchResultItem[];
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
