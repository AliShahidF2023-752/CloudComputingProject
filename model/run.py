import torch
import re
from fastapi import FastAPI
from pydantic import BaseModel
from transformers import pipeline
from typing import List

from utils import clean_text

# =========================
# Device
# =========================
DEVICE = 0 if torch.cuda.is_available() else -1

# =========================
# Model
# =========================
classifier = pipeline(
    "text-classification",
    model="fakespot-ai/roberta-base-ai-text-detection-v1",
    device=DEVICE
)

# =========================
# FastAPI
# =========================
app = FastAPI()


class DetectRequest(BaseModel):
    text: str


class LineResult(BaseModel):
    text: str
    start: int
    end: int
    confidence: float   # AI confidence


class DetectResponse(BaseModel):
    lines: List[LineResult]


# =========================
# Utilities
# =========================
def split_lines_with_offsets(text: str):
    pattern = re.compile(r'[^.!?]+[.!?]?', re.MULTILINE)
    for m in pattern.finditer(text):
        s = m.group().strip()
        if s:
            yield s, m.start(), m.end()


def is_ai(out: dict) -> bool:
    """
    Determine if model classified line as AI.
    """
    label = out["label"].lower()
    return label.startswith("ai")


def ai_probability(out: dict) -> float:
    """
    Normalize confidence so it always means AI probability.
    """
    label = out["label"].lower()
    score = out["score"]

    if label.startswith("ai"):
        return score
    else:
        return 1 - score


# =========================
# Endpoint
# =========================
@app.post("/detect", response_model=DetectResponse)
def detect(req: DetectRequest):
    text = req.text.strip()
    lines = list(split_lines_with_offsets(text))

    if not lines:
        return {"lines": []}

    cleaned = [clean_text(l[0]) for l in lines]
    outputs = classifier(cleaned)

    results = []

    for (line, start, end), out in zip(lines, outputs):
        if not is_ai(out):
            continue  # ✅ only return AI-highlighted lines

        results.append({
            "text": line,
            "start": start,
            "end": end,
            "confidence": round(ai_probability(out), 4)
        })

    return {"lines": results}
