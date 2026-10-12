# Switch the AI provider to self-hosted Azure OpenAI

Next.js API routes now call a self-hosted Azure OpenAI deployment instead of Gemini.
This supersedes the provider choice in ADR 0033; everything else from that ADR
(server-only execution, Zod structured output, lazy configuration, explicit mock
mode, 120-second deadline, sanitized errors, configuration-only health) is unchanged.

The adapter is `openaiCompatibleText` from `@tanstack/ai-openai/compatible`, using the
Responses API. `@tanstack/ai-openai` is pinned to `0.22.5` because later releases
require a newer `@tanstack/ai` than the `^0.53` the app uses. The typed
`createOpenaiChat` is not used because it only accepts OpenAI model names, while
Azure addresses models by deployment name.

Server configuration reads `AZURE_OPENAI_BASE_URL`, `AZURE_OPENAI_API_KEY`, and a
required `AI_MODEL` (the deployment name; there is no default). The base URL may be
the full `.../openai/responses?api-version=...` endpoint or its `/openai` base; the
`api-version` query is extracted and forwarded on every request. The key is sent as
the `api-key` header and the SDK's Bearer `Authorization` header is removed.

`GOOGLE_API_KEY` is no longer read. `@tanstack/ai-gemini` stays installed but unused,
so switching back is a code change in `llmServerConfig.ts` and `structuredOutput.ts`.
