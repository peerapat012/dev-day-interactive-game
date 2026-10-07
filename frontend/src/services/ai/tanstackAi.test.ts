import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

vi.mock("server-only", () => ({}));
vi.mock("@tanstack/ai", () => ({ chat: vi.fn() }));

import { chat } from "@tanstack/ai";
import { generateStructuredOutput } from "@/services/ai/structuredOutput";
import { classifyBatchWithLlm } from "@/services/ai/classifyBatch";
import { summarizeWithLlm } from "@/services/ai/summarizeLlm";
import { generateQuestionsWithLlm } from "@/services/ai/generateQuestionsLlm";
import { POST as classify } from "@/app/api/classify/route";
import { POST as summarize } from "@/app/api/summarize/route";
import { POST as questions } from "@/app/api/generate-questions/route";
import { POST as hostSummary } from "@/app/api/host-summary/generate/route";
import { GET as health } from "@/app/api/llm-health/route";

const chatMock = vi.mocked(chat);
const items = [{ id: "a", input: "React" }, { id: "b", input: "Vue" }];
const classification = { results: items.map(({ id }) => ({ id, group: "Frameworks" })) };
const summaries = [{ group: "Frameworks", topic: "เฟรมเวิร์ก", summary: "สนใจการพัฒนาเว็บด้วย React และ Vue" }];
const questionRequest = { topic: "Web", questionCount: 1, optionCount: 2, language: "Thai" };
const question = { prompt: "ข้อใดเป็นเฟรมเวิร์ก", options: ["React", "Python"], correctOptionIndex: 0 };
const sentPayloads = () => chatMock.mock.calls.map(([options]) => {
  const message = options.messages![0] as { content: string };
  return JSON.parse(message.content) as Record<string, unknown>;
});
const request = (body: unknown) => new Request("http://localhost/api/test", {
  method: "POST", body: JSON.stringify(body), headers: { "Content-Type": "application/json" },
});

beforeEach(() => {
  vi.stubEnv("GOOGLE_API_KEY", "test-key-not-real");
  vi.stubEnv("AI_MODEL", "gemini-3.1-flash-lite");
  vi.stubEnv("LLM_USE_MOCK", "false");
  chatMock.mockReset();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

describe("TanStack structured generation", () => {
  it("uses structured output and preserves classification IDs", async () => {
    chatMock.mockResolvedValue(classification);
    expect(await classifyBatchWithLlm(items)).toEqual(classification);
    expect(chatMock).toHaveBeenCalledWith(expect.objectContaining({
      messages: [{ role: "user", content: JSON.stringify({ inputs: items }) }],
      outputSchema: expect.anything(), abortController: expect.any(AbortController),
      debug: false,
    }));
  });

  it("sends the round question to the classifier when provided", async () => {
    chatMock.mockResolvedValue(classification);
    await classifyBatchWithLlm(items, "ใช้ AI ตัวไหนบ่อยที่สุด");
    expect(chatMock).toHaveBeenCalledWith(expect.objectContaining({
      messages: [{
        role: "user",
        content: JSON.stringify({ question: "ใช้ AI ตัวไหนบ่อยที่สุด", inputs: items }),
      }],
    }));
  });

  it("sends the round question to the summarizer when provided", async () => {
    chatMock.mockResolvedValue({ summaries });
    const groups = [{ group: "Frameworks", inputs: "React, Vue" }];
    await summarizeWithLlm(groups, "ใช้ AI ตัวไหนบ่อยที่สุด");
    expect(chatMock).toHaveBeenCalledWith(expect.objectContaining({
      messages: [{
        role: "user",
        content: JSON.stringify({ question: "ใช้ AI ตัวไหนบ่อยที่สุด", groups }),
      }],
    }));
  });

  it.each([
    [{ id: "a", group: "Frameworks" }],
    [{ id: "a", group: "Frameworks" }, { id: "a", group: "Frameworks" }],
    [{ id: "a", group: "Frameworks" }, { id: "invented", group: "Food" }],
  ])("rejects missing, duplicate or invented IDs: %j", async (...results) => {
    chatMock.mockResolvedValue({ results });
    await expect(classifyBatchWithLlm(items)).rejects.toThrow("result keys");
  });

  it("skips empty batches", async () => {
    expect(await classifyBatchWithLlm([])).toEqual({ results: [] });
    expect(await summarizeWithLlm([])).toEqual([]);
    expect(chatMock).not.toHaveBeenCalled();
  });

  it("preserves group keys and Thai summaries", async () => {
    chatMock.mockResolvedValue({ summaries });
    expect(await summarizeWithLlm([{ group: "Frameworks", inputs: "React, Vue" }])).toEqual(summaries);
  });

  it.each([
    [],
    [summaries[0], summaries[0]],
    [{ ...summaries[0], group: "changed" }],
  ])("rejects incomplete summary groups: %j", async (...results) => {
    chatMock.mockResolvedValue({ summaries: results });
    await expect(summarizeWithLlm([{ group: "Frameworks", inputs: "React" }])).rejects.toThrow("result keys");
  });

  it("rejects non-Thai descriptions", async () => {
    chatMock.mockResolvedValue({ summaries: [{ ...summaries[0], summary: "Only English" }] });
    await expect(summarizeWithLlm([{ group: "Frameworks", inputs: "React" }])).rejects.toThrow("Thai description");
  });

  it("generates typed quiz questions", async () => {
    chatMock.mockResolvedValue({ questions: [question] });
    expect(await generateQuestionsWithLlm(questionRequest)).toEqual({ questions: [question] });
  });

  it.each([
    { questions: [] },
    { questions: [question, question] },
    { questions: [{ ...question, options: ["only one"] }] },
    { questions: [{ ...question, correctOptionIndex: 2 }] },
    { questions: [{ ...question, correctOptionIndex: -1 }] },
    { questions: [{ ...question, correctOptionIndex: 0.5 }] },
  ])("rejects invalid quiz output instead of repairing the answer", async (output) => {
    chatMock.mockResolvedValue(output);
    await expect(generateQuestionsWithLlm(questionRequest)).rejects.toThrow("invalid response");
  });

  it.each([
    ["403 API_KEY_INVALID secret-value", "rejected the API key"],
    ["429 RESOURCE_EXHAUSTED secret-value", "rate limit"],
    ["Failed to parse structured output as JSON. secret-value", "invalid response"],
    ["network secret-value", "request failed"],
    ["deadline exceeded secret-value", "timed out"],
  ])("sanitizes provider failure %s", async (raw, expected) => {
    chatMock.mockRejectedValue(new Error(raw));
    const response = await questions(request(questionRequest));
    expect(response.status).toBe(502);
    const body = await response.text();
    expect(body).toContain(expected);
    expect(body).not.toContain("secret-value");
  });

  it("maps TanStack's structured-output validation error to a safe response", async () => {
    const error = Object.assign(new Error("Validation failed: secret schema details"), {
      code: "structured-output-validation-failed",
    });
    chatMock.mockRejectedValue(error);
    const response = await questions(request(questionRequest));
    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({
      error: "AI returned an invalid response. Please retry.",
    });
  });

  it("bounds a hung provider call and aborts it after 120 seconds", async () => {
    vi.useFakeTimers();
    chatMock.mockReturnValue(new Promise(() => {}));
    const pending = generateStructuredOutput("test", {}, z.object({ ok: z.boolean() }));
    const assertion = expect(pending).rejects.toThrow("timed out after 120 seconds");
    await vi.advanceTimersByTimeAsync(120_000);
    await assertion;
    expect(chatMock.mock.calls[0][0].abortController?.signal.aborted).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe("existing API contracts", () => {
  const endpoints = [
    { handler: classify, payload: { items } },
    { handler: summarize, payload: { groups: [{ group: "Frameworks", inputs: ["React", "Vue"] }] } },
    { handler: questions, payload: questionRequest },
    { handler: hostSummary, payload: { items } },
  ];

  it.each(endpoints)("returns 400 for invalid JSON and malformed input", async ({ handler }) => {
    for (const body of [null, {}, { items: [null], groups: [null], topic: 42 }]) {
      expect((await handler(request(body))).status).toBe(400);
    }
    expect((await handler(new Request("http://localhost", { method: "POST", body: "{" }))).status).toBe(400);
    expect(chatMock).not.toHaveBeenCalled();
  });

  it.each(endpoints)("returns 503 without a key and never silently mocks", async ({ handler, payload }) => {
    vi.stubEnv("GOOGLE_API_KEY", "");
    const response = await handler(request(payload));
    expect(response.status).toBe(503);
    expect(await response.text()).toContain("GOOGLE_API_KEY");
    expect(chatMock).not.toHaveBeenCalled();
  });

  it.each(endpoints)("runs explicit mock mode without a key", async ({ handler, payload }) => {
    vi.stubEnv("GOOGLE_API_KEY", "");
    vi.stubEnv("LLM_USE_MOCK", "true");
    expect((await handler(request(payload))).status).toBe(200);
    expect(chatMock).not.toHaveBeenCalled();
  });

  it("returns classification with the original input", async () => {
    chatMock.mockResolvedValue(classification);
    expect(await (await classify(request({ items }))).json()).toEqual({
      results: items.map((item) => ({ ...item, group: "Frameworks" })),
    });
  });

  it("returns summary cards through the existing summary route", async () => {
    chatMock.mockResolvedValue({ summaries });
    const response = await summarize(request({ groups: [{ group: "Frameworks", inputs: ["React", "Vue"] }] }));
    expect(await response.json()).toEqual({ summaries });
  });

  it("classifies then summarizes a captured snapshot", async () => {
    chatMock.mockResolvedValueOnce(classification).mockResolvedValueOnce({ summaries });
    const response = await hostSummary(request({ items }));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.entryGroups).toEqual(classification.results);
    expect(body.groups[0]).toMatchObject({ group: "Frameworks", count: 2, inputs: ["React", "Vue"] });
    expect(body.summaries).toEqual(summaries);
    expect(chatMock).toHaveBeenCalledTimes(2);
  });

  it("forwards the round question through the host summary route", async () => {
    chatMock.mockResolvedValueOnce(classification).mockResolvedValueOnce({ summaries });
    const response = await hostSummary(request({ items, question: "  ชอบเครื่องมืออะไร  " }));
    expect(response.status).toBe(200);
    expect(sentPayloads()).toHaveLength(2);
    for (const payload of sentPayloads()) {
      expect(payload.question).toBe("ชอบเครื่องมืออะไร");
    }
  });

  it("omits a blank round question", async () => {
    chatMock.mockResolvedValueOnce(classification).mockResolvedValueOnce({ summaries });
    await hostSummary(request({ items, question: "   " }));
    expect(sentPayloads()).toHaveLength(2);
    for (const payload of sentPayloads()) {
      expect(payload).not.toHaveProperty("question");
    }
  });

  it.each([
    { handler: classify, payload: { items } },
    { handler: summarize, payload: { groups: [{ group: "Frameworks", inputs: ["React"] }] } },
    { handler: hostSummary, payload: { items } },
  ])("rejects an overlong round question", async ({ handler, payload }) => {
    const response = await handler(request({ ...payload, question: "ก".repeat(501) }));
    expect(response.status).toBe(400);
    expect(chatMock).not.toHaveBeenCalled();
  });

  it("returns the requested number of mock questions, including more than five", async () => {
    vi.stubEnv("LLM_USE_MOCK", "true");
    const response = await questions(request({ ...questionRequest, questionCount: 20, optionCount: 8 }));
    const body = await response.json();
    expect(body.questions).toHaveLength(20);
    expect(body.questions[0].options).toHaveLength(8);
  });

  it.each([21, 1.5])("rejects invalid question counts %s", async (questionCount) => {
    expect((await questions(request({ ...questionRequest, questionCount }))).status).toBe(400);
    expect(chatMock).not.toHaveBeenCalled();
  });

  it("checks configuration without probing Gemini or exposing the key", async () => {
    const response = await health();
    expect(await response.json()).toMatchObject({ mode: "tanstack", ok: true, providerChecked: false });
    vi.stubEnv("GOOGLE_API_KEY", "");
    expect((await health()).status).toBe(503);
    vi.stubEnv("LLM_USE_MOCK", "true");
    expect(await (await health()).json()).toEqual({ mode: "mock", ok: true, providerChecked: false });
    expect(chatMock).not.toHaveBeenCalled();
  });

  it("rejects unsupported model configuration without calling Gemini", async () => {
    vi.stubEnv("AI_MODEL", "unknown-model");
    expect((await questions(request(questionRequest))).status).toBe(503);
    expect(chatMock).not.toHaveBeenCalled();
  });
});
