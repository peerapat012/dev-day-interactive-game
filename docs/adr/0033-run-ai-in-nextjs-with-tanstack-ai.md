# Run AI in Next.js with TanStack AI and Gemini

Next.js API routes now execute classification, summary generation, and question-deck
generation directly through `@tanstack/ai` and `@tanstack/ai-gemini`. This supersedes
the FastAPI/Appwrite-execution transport decision in ADR 0031; the question-deck UI
and review/edit/save behavior from that ADR remain unchanged.

The default model remains `gemini-3.1-flash-lite`. Server-only configuration reads
`GOOGLE_API_KEY` and optional `AI_MODEL` lazily, allowing builds without credentials.
`LLM_USE_MOCK=true` is an explicit development mode, never an error fallback.
Missing configuration returns 503; provider and invalid-output errors return 502.
Each model call has a 120-second deadline. Health reports configuration readiness
only and never makes a billable provider request.

Zod structured output replaces tolerant Python-response parsing. Every entry ID and
summary group must be present exactly once. Summaries retain Thai descriptions and
stable group keys; generated questions must match requested counts and valid answer
indices. Browser-facing generation APIs remain JSON request/response operations.

Summary orchestration and persistence retain their existing lifecycle rules,
including captured snapshots, explicit refresh, last-known-good output, and stale
operation rejection. Appwrite database, auth, and realtime remain in use without
schema changes. No React AI hooks or streaming UI are introduced.

Python source is retained as reference only. The running app no longer invokes
Appwrite Functions or local Python URLs, and old transport environment variables
are ignored. This change does not delete any deployed Appwrite Function.
