"""Local FastAPI server for development. Appwrite uses main.py directly."""

from fastapi import FastAPI
from pydantic import BaseModel

from main import SummarizeRequest, SummarizeResponse, classify_message, summarize_groups

app = FastAPI()


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    message: str


class HealthResponse(BaseModel):
    status: str


@app.get("/health", response_model=HealthResponse)
def healthcheck() -> HealthResponse:
    return HealthResponse(status="ok")


@app.post("/clarify", response_model=ChatResponse)
def clarify(request: ChatRequest) -> ChatResponse:
    return ChatResponse(message=classify_message(request.message))


@app.post("/summarize", response_model=SummarizeResponse)
def summarize(request: SummarizeRequest) -> SummarizeResponse:
    return summarize_groups(request)
