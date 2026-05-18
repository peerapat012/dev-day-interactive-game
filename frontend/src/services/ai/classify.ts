import type { ClassifyResponse } from "@/types/api";

/** Client → Next.js /api/classify → FastAPI /clarify */
export async function classifyInput(input: string): Promise<ClassifyResponse> {
  const res = await fetch("/api/classify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ input }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || "Classification failed");
  }

  return res.json() as Promise<ClassifyResponse>;
}
