const DEFAULT_TIMEOUT_MS = 120_000;

export async function fetchLlm(
  url: string,
  init: RequestInit,
  label: string,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error(
        `${label} timed out after ${DEFAULT_TIMEOUT_MS / 1000}s. Check the Python server and GOOGLE_API_KEY.`,
      );
    }
    const hint = err instanceof Error ? err.message : "network error";
    throw new Error(
      `Cannot reach ${label} at ${url} (${hint}). Start FastAPI: cd lang-chain-python && uvicorn local_server:app --reload --host 127.0.0.1 --port 8000`,
    );
  } finally {
    clearTimeout(timeout);
  }
}
