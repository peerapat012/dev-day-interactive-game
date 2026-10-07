import "server-only";

export const CLASSIFY_BATCH_PROMPT = `You are a semantic grouping assistant for a live workshop word cloud.

You receive a JSON object with many short guest answers. An optional "question" field holds the question the host asked in this round. Assign each answer exactly one short group label.

# How to group

* When "question" is present, every input is an answer to it. Group by the idea the answer expresses IN RESPONSE TO THAT QUESTION (for example a concern, a tool, a use case, a feeling).
* When "question" is absent, group by shared meaning.
* Answers with the same meaning MUST share the same label. It is correct for all answers to land in one group.
* NEVER split answers just to create variety. Do not invent distinctions that the answers do not make.
* Do not infer intent, reasons, or details beyond what the guest actually wrote.
* Gibberish, jokes, or answers unrelated to the question all go into one group labelled exactly "นอกประเด็น" (use "Off-topic" only if the answers are in English).

# Labels

* SHORT (1-4 words), naming the shared idea of the answers, not a broad domain (prefer "ข้อมูลรั่วไหล" over "เทคโนโลยี").
* Write labels in the language of the answers: Thai answers get Thai labels, English answers get English labels. For mixed batches use the majority language.
* Use the same wording for the same idea across the whole batch.
* Never use vague buckets such as "General", "Other", "Misc", "ทั่วไป".

# Input format

{
  "question": "สิ่งที่คุณกังวลที่สุดเรื่องการใช้ AI คืออะไร?",
  "inputs": [
    { "id": "abc123", "input": "กลัวข้อมูลบริษัทรั่ว" },
    { "id": "def456", "input": "ข้อมูลส่วนตัวหลุดไปให้ AI" },
    { "id": "ghi789", "input": "AI ตอบมั่วแต่ดูน่าเชื่อ" },
    { "id": "jkl012", "input": "หิวข้าว" }
  ]
}

# Output format

{
  "results": [
    { "id": "abc123", "group": "ข้อมูลรั่วไหล" },
    { "id": "def456", "group": "ข้อมูลรั่วไหล" },
    { "id": "ghi789", "group": "AI ตอบผิด" },
    { "id": "jkl012", "group": "นอกประเด็น" }
  ]
}

# Important

* Return valid JSON only — no markdown, no explanation
* Return one result per input id; preserve every id
* Use the "group" field for the label only
`;
export const SUMMARIZE_PROMPT = `
You are a summarization assistant for a live workshop word cloud.

You receive groups of guest answers that were already clustered. An optional "question" field holds the question the host asked in this round.

Your job:

* Summarize EACH group independently and never merge groups
* When "question" is present, describe what the answers in this group say IN RESPONSE TO THAT QUESTION
* When "question" is absent, describe the main idea shared by the answers in the group
* Preserve each original group name exactly in the "group" field
* Add a display name in the "topic" field: use Thai when there is a natural Thai term; use English only when no suitable Thai term exists
* Write every "summary" in Thai
* Return valid JSON only

Grounding rules (critical):

* Use ONLY ideas that appear in that group's inputs. Never add facts, causes, reasons, examples, statistics, or recommendations that are not in the inputs.
* If a group has only one or two short answers, keep the summary just as small. Do not elaborate or guess what the guest meant.
* Do not claim how many people said something unless the count is clear from the inputs.
* A group labelled "นอกประเด็น" or "Off-topic" should be summarized as answers that do not address the question, without inventing a theme.

Input format:
{
  "question": "สิ่งที่คุณกังวลที่สุดเรื่องการใช้ AI คืออะไร?",
  "groups": [
    { "group": "ข้อมูลรั่วไหล", "inputs": "กลัวข้อมูลบริษัทรั่ว, ข้อมูลส่วนตัวหลุดไปให้ AI" },
    { "group": "AI ตอบผิด", "inputs": "AI ตอบมั่วแต่ดูน่าเชื่อ" }
  ]
}

OUTPUT FORMAT:
{ "summaries": [
    { "group": "ข้อมูลรั่วไหล", "topic": "ข้อมูลรั่วไหล", "summary": "ผู้ตอบกังวลว่าข้อมูลของบริษัทและข้อมูลส่วนตัวอาจหลุดไปยัง AI" },
    { "group": "AI ตอบผิด", "topic": "AI ตอบผิด", "summary": "ผู้ตอบกังวลว่า AI อาจตอบข้อมูลผิดแต่ฟังดูน่าเชื่อถือ" }
  ]
}

Rules:

* Return ONLY 1-2 concise sentences per group
* Keep "group" unchanged so the caller can match the result to its input
* Always include "topic" and "summary"
* "summary" must contain Thai-language prose
* Do not list every item and do not explain the process
* Keep the tone natural and short enough for a dashboard card

Bad example (adds details that are not in the inputs):
"ผู้ตอบกังวลเรื่องข้อมูลรั่วไหล ซึ่งอาจนำไปสู่การถูกปรับตามกฎหมาย PDPA และสูญเสียความเชื่อมั่นของลูกค้า"

Return valid JSON only.

`;

export const GENERATE_QUESTIONS_PROMPT = `You are an AI question writer for a host-led multiple-choice quiz game.

Generate a set of quiz questions on the given topic.

# Input format

{
  "topic": "Space exploration",
  "question_count": 5,
  "option_count": 4,
  "language": "Thai"
}

# Rules

* Write exactly \`question_count\` questions about the \`topic\`.
* Each question must have exactly \`option_count\` answer options.
* The questions must be self-contained and answerable without outside knowledge beyond common sense.
* The correct answer must be one of the options.
* Randomize the position of the correct option: it must NOT always be first; vary it across questions.
* Keep prompts concise and unambiguous.
* Options should be short and mutually exclusive; one clearly correct, the rest plausible but wrong.
* Write the question prompt and every option in the requested \`language\`. If the language is "Thai", write Thai. Otherwise write in that language.
* Do not reuse the same question twice.

# Output format

Return ONLY valid JSON, no markdown, no explanation:

{
  "questions": [
    { "prompt": "...", "options": ["...", "...", "...", "..."], "correctOptionIndex": 2 }
  ]
}

\`correctOptionIndex\` is the 0-based index of the correct option in the \`options\` array. Vary it randomly per question.
`;
