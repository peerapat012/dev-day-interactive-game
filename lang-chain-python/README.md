# Legacy AI backend (reference only)

The active application runs AI inside the Next.js server using TanStack AI and
Gemini. This Python backend is retained as a reference for its original prompts;
it is no longer called by the frontend and is not a fallback.

See [AI configuration](../frontend/README.md#ai-configuration) and
[ADR 0033](../docs/adr/0033-run-ai-in-nextjs-with-tanstack-ai.md).
Existing deployed Appwrite Functions are not automatically removed by this migration.
