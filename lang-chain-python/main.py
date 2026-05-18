import json
import re

from fastapi import FastAPI
from pydantic import BaseModel
from langchain_google_genai import ChatGoogleGenerativeAI
from dotenv import load_dotenv
from langchain.agents import create_agent
load_dotenv()

app = FastAPI()

SYSTEM_CLASSIFY_PROMPT = """You are a semantic classifier for a realtime interactive clustering game.

Your job:

1. Understand the meaning of a user sentence
2. Clarify ambiguous intent if needed
3. Generate a short semantic category
4. Keep categories broad and reusable
5. Return ONLY the category label as plain text (no JSON, no quotes, no extra words)

# Rules

* Categories must be SHORT
* Prefer 1-2 words
* Normalize similar meanings into same category

Examples:

* pizza, burger, fries → "Food"
* football, basketball, Messi → "Sports"
* coding, React, JavaScript → "Programming"
* cat, dog, bird → "Animals"

# Important

DO NOT create overly specific categories.

BAD:

* "Pepperoni Pizza Lovers"
* "Messi Fans"
* "Frontend JavaScript Frameworks"

GOOD:

* "Food"
* "Sports"
* "Programming"

# Clarification Rules

If the sentence is unclear, vague, or too short:

* infer likely meaning
* generate reasonable keywords
* avoid asking questions unless impossible to infer

# Output Format

Return exactly one category label, nothing else.

Examples:
- "i love pizza" → Food
- "i am sad today" → Emotions
- "learning React" → Programming

# Final Rule

Always prioritize semantic meaning over exact words.
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

classifyAgent = create_agent(
    model=ChatGoogleGenerativeAI(model="gemini-3.1-flash-lite"),
    tools=[],
    system_prompt=SYSTEM_CLASSIFY_PROMPT,
)

summarizeAgent = create_agent(
    model=ChatGoogleGenerativeAI(model="gemini-3.1-flash-lite"),
    tools=[],
    system_prompt=SYSTEM_SUMMARIZE_PROMPT,
)


class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    message: str

class HealthResponse(BaseModel):
    status: str

class Group(BaseModel):
    group: str
    inputs: str

class SummarizeRequest(BaseModel):
    groups: list[Group]

class Summary(BaseModel):
    group: str
    summary: str

class SummarizeResponse(BaseModel):
    summaries: list[Summary]


@app.get("/health", response_model=HealthResponse)
def healthcheck() -> HealthResponse:
    return HealthResponse(status="ok")


@app.post("/clarify", response_model=ChatResponse)
def chat(request: ChatRequest) -> ChatResponse:
    response = classifyAgent.invoke({
        "messages": [{"role": "user", "content": request.message}]
    })
    print(json.dumps(response, indent=4))
    return ChatResponse(message=response["messages"][-1].text)

@app.post("/summarize", response_model=SummarizeResponse)
def summarize(request: SummarizeRequest) -> SummarizeResponse:
    response = summarizeAgent.invoke({
        "messages": [{"role": "user", "content": request.model_dump_json()}]
    })
    print(json.dumps(response, indent=4, default=str))
    return SummarizeResponse.model_validate_json(response["messages"][-1].text)