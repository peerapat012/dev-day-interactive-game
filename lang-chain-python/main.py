import json

from dotenv import load_dotenv

load_dotenv()

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.agents import create_agent
from pydantic import BaseModel

SYSTEM_CLASSIFY_PROMPT = """You are a semantic classifier for a realtime interactive clustering game.

Assign each user sentence one short semantic category (1-2 words). Return ONLY the label as plain text (no JSON, no quotes).

# Specificity rules

* Pick the most specific category that still fits several similar inputs.
* NEVER use ultra-broad buckets when a narrower domain fits: avoid "Technology", "General", "Other", "Misc", "Things".
* Tech examples:
  - React, Vue, Angular, Django, Flask, Spring → "Frameworks"
  - Python, Java, JavaScript, Go, Rust, C++ → "Programming Languages"
  - APIs, databases, DevOps, cloud, Docker → "Backend" or "DevOps" (pick best fit)
  - HTML, CSS, UI, design systems → "Frontend"
  - "coding", "software engineering" (generic) → "Programming"
* Spoken / human languages (NOT programming): English, Spanish, French, Thai, Japanese, "learning English" → "Spoken Languages"
* NEVER use bare "Languages" — always "Programming Languages" or "Spoken Languages"
* Food, sports, animals, travel, emotions: use clear domain labels (Food, Sports, Animals, etc.)

# Balance

BAD (too broad): Technology, Entertainment, Lifestyle
BAD (too narrow): Messi Fans, Pepperoni Pizza Lovers
GOOD: Frameworks, Programming Languages, Spoken Languages, Programming, Food, Sports

# Examples

- "i love pizza" → Food
- "react hooks" → Frameworks
- "python asyncio" → Programming Languages
- "golang channels" → Programming Languages
- "learning English" → Spoken Languages
- "django rest api" → Frameworks
- "learning machine learning" → Programming

Prioritize semantic meaning over exact words.
"""

SYSTEM_CLASSIFY_BATCH_PROMPT = """You are a semantic classifier for a realtime interactive clustering game.

You receive a JSON object with many user sentences. Assign each sentence exactly one short semantic category (1-2 words).

# Specificity rules (critical)

* Use the most specific category that still fits similar inputs — NOT ultra-broad labels.
* NEVER default tech items to "Technology", "Tech", "General", "Other", or "Misc".
* Split software topics when possible:
  - Named libraries/frameworks (React, Django, Next.js, TensorFlow) → "Frameworks"
  - Programming languages (Python, Java, Go, Rust, SQL) → "Programming Languages"
  - Spoken/human languages (English, Spanish, French, Thai, Japanese) → "Spoken Languages"
  - NEVER use bare "Languages" — it mixes two different meanings
  - Generic coding / software / CS → "Programming"
  - Frontend / UI / CSS / design → "Frontend"
  - APIs, servers, databases, cloud, Docker, Kubernetes → "Backend" or "DevOps"
* Non-tech: Food, Sports, Animals, Travel, Music, Emotions, etc. — use clear domain names.

# Diversity rule (critical)

* When the batch has 3 or more inputs, use **at least 3 different group labels** whenever the content supports it.
* Do NOT collapse unrelated items into one bucket (e.g. react + python + django must NOT all become "Technology").
* Example batch: "react", "python", "django" → Frameworks, Languages, Frameworks (or Languages for python only) — at least 2 distinct labels, ideally 3 if inputs differ.

# Other rules

* Categories: SHORT (1-3 words), Title Case preferred (e.g. "Frameworks", "Programming Languages", "Spoken Languages")
* Same meaning → same label; different sub-domains → different labels
* Avoid overly narrow labels (no "Messi Fans", "Pepperoni Pizza")
* Return valid JSON only — no markdown, no explanation

# Input format

{
  "inputs": [
    { "id": "abc123", "input": "i love pizza" },
    { "id": "def456", "input": "messi is the goat" },
    { "id": "ghi789", "input": "react hooks" }
  ]
}

# Output format

{
  "results": [
    { "id": "abc123", "group": "Food" },
    { "id": "def456", "group": "Sports" },
    { "id": "ghi789", "group": "Frameworks" }
  ]
}

# Important

* Return one result per input id; preserve every id
* Use the "group" field for the category label only
"""

SYSTEM_SUMMARIZE_PROMPT = """
You are an AI summarization agent for an interactive semantic word cloud game.

Your job:

* Read all user sentences from the same semantic group/category
* Detect the main interests, repeated themes, and dominant topics
* Generate a short natural summary describing what users in this group are especially interested in
* Summarize EACH group independently
* Never merge groups together
* Preserve original group names
* Return valid JSON only
* Keep summary concise for dashboard UI
* One summary per group

Input format:
{
  "groups": [
    {
      "group": "technology",
      "inputs": "I want to learn Next.js scalable architecture. How to structure frontend enterprise apps. Realtime dashboard with websocket."
    },
    {
      "group": "animal",
      "inputs": "My dog keeps barking at night. Best food for golden retriever. How to train puppies."
    },
    {
      "group": "food",
      "inputs": "Best ramen in Tokyo. I love spicy Korean food. Easy air fryer recipes."
    }
  ]
}

OUTPUT FORMAT:
{ "summaries": [
        { "group": "group_name", "summary": "This group is heavily focused on scalable frontend architecture, realtime systems, and modern web development using Next.js." },
        { "group": "group_name", "summary": "Interest in this group centers around dog behavior, pet care, and training techniques for puppies." },
        { "group": "group_name", "summary": "This group mainly discusses Asian cuisine, especially ramen, spicy food, and simple home cooking ideas." }
        ...
    ]
}

Rules:

* Return ONLY 1-2 concise sentences
* Focus on dominant interests and recurring themes
* Do not list every item
* Do not explain the process
* Do not mention "users said"
* Keep the tone natural and insight-oriented
* Avoid generic summaries
* Prefer semantic understanding over keyword repetition
* If multiple subtopics exist, mention only the strongest ones
* Output must be short enough for a dashboard card UI

Good example:
"This group is mainly focused on frontend development, especially Next.js architecture, scalable folder structures, and realtime interactive UI systems."

Another example:
"Interest in this group centers around animals and pets, particularly dogs, cat behavior, and pet care topics."

Bad example:
"The users talked about many things including coding, frontend, backend, JavaScript, React, architecture, and deployment."

Return valid JSON only.

"""

classify_agent = create_agent(
    model=ChatGoogleGenerativeAI(model="gemini-3.1-flash-lite"),
    tools=[],
    system_prompt=SYSTEM_CLASSIFY_PROMPT,
)

classify_batch_agent = create_agent(
    model=ChatGoogleGenerativeAI(model="gemini-3.1-flash-lite"),
    tools=[],
    system_prompt=SYSTEM_CLASSIFY_BATCH_PROMPT,
)

summarize_agent = create_agent(
    model=ChatGoogleGenerativeAI(model="gemini-3.1-flash-lite"),
    tools=[],
    system_prompt=SYSTEM_SUMMARIZE_PROMPT,
)


class Group(BaseModel):
    group: str
    inputs: str


class SummarizeRequest(BaseModel):
    groups: list[Group]


class SummarizeResponse(BaseModel):
    summaries: list[dict]


class ClassifyInputItem(BaseModel):
    id: str
    input: str


class ClassifyBatchRequest(BaseModel):
    inputs: list[ClassifyInputItem]


class ClassifyBatchResultItem(BaseModel):
    id: str
    group: str


class ClassifyBatchResponse(BaseModel):
    results: list[ClassifyBatchResultItem]


def classify_message(message: str) -> str:
    response = classify_agent.invoke({
        "messages": [{"role": "user", "content": message}],
    })
    return response["messages"][-1].text


def classify_inputs_batch(payload: ClassifyBatchRequest) -> ClassifyBatchResponse:
    if not payload.inputs:
        return ClassifyBatchResponse(results=[])

    response = classify_batch_agent.invoke({
        "messages": [{"role": "user", "content": payload.model_dump_json()}],
    })
    return ClassifyBatchResponse.model_validate_json(response["messages"][-1].text)


def summarize_groups(payload: SummarizeRequest) -> SummarizeResponse:
    response = summarize_agent.invoke({
        "messages": [{"role": "user", "content": payload.model_dump_json()}],
    })
    print(json.dumps(response, indent=4, default=str))
    return SummarizeResponse.model_validate_json(response["messages"][-1].text)


def _normalize_path(path: str) -> str:
    normalized = (path or "/").split("?")[0].rstrip("/")
    return normalized or "/"


def main(context):
    path = _normalize_path(context.req.path)
    method = context.req.method.upper()

    if method == "GET" and path in ("/health", "/"):
        return context.res.json({"status": "ok"})

    if method == "OPTIONS":
        return context.res.empty()

    if method == "POST" and path == "/clarify":
        body = context.req.body_json or {}
        message = body.get("message", "")
        if not message:
            return context.res.json({"error": "message is required"}, 400)
        try:
            category = classify_message(message)
            return context.res.json({"message": category})
        except Exception as exc:
            context.error(str(exc))
            return context.res.json({"error": str(exc)}, 502)

    if method == "POST" and path == "/classify-batch":
        body = context.req.body_json or {}
        try:
            payload = ClassifyBatchRequest.model_validate(body)
        except Exception as exc:
            return context.res.json({"error": f"invalid request: {exc}"}, 400)
        try:
            result = classify_inputs_batch(payload)
            return context.res.json(result.model_dump())
        except Exception as exc:
            context.error(str(exc))
            return context.res.json({"error": str(exc)}, 502)

    if method == "POST" and path == "/summarize":
        body = context.req.body_json or {}
        try:
            payload = SummarizeRequest.model_validate(body)
        except Exception as exc:
            return context.res.json({"error": f"invalid request: {exc}"}, 400)
        try:
            result = summarize_groups(payload)
            return context.res.json(result.model_dump())
        except Exception as exc:
            context.error(str(exc))
            return context.res.json({"error": str(exc)}, 502)

    return context.res.json({"error": "Not found"}, 404)
