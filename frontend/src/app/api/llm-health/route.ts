import { NextResponse } from "next/server";
import {
  getLlmHealthUrl,
  useAppwriteLlmFunction,
} from "@/lib/llmServerConfig";
import { fetchLlm } from "@/lib/llmFetch";

/** GET /api/llm-health — verify Next.js can reach the local FastAPI LLM server. */
export async function GET() {
  if (useAppwriteLlmFunction()) {
    return NextResponse.json({
      mode: "appwrite",
      ok: true,
      message: "LLM_USE_APPWRITE_FUNCTION=true (not probing local FastAPI)",
    });
  }

  const url = getLlmHealthUrl();

  try {
    const res = await fetchLlm(url, { method: "GET", cache: "no-store" }, "LLM health");
    const text = await res.text();

    if (!res.ok) {
      return NextResponse.json(
        {
          mode: "local",
          ok: false,
          url,
          status: res.status,
          detail: text || res.statusText,
        },
        { status: 502 },
      );
    }

    let body: unknown = text;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      /* plain text health is fine */
    }

    return NextResponse.json({
      mode: "local",
      ok: true,
      url,
      body,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Health check failed";
    return NextResponse.json(
      { mode: "local", ok: false, url, error: message },
      { status: 502 },
    );
  }
}
