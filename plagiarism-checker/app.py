import random
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional

app = FastAPI()

class CheckRequest(BaseModel):
    text: str

class Highlight(BaseModel):
    text: str
    start: int
    end: int
    confidence: float
    sources: List[str]

class CheckResponse(BaseModel):
    plagiarism_score: float
    highlights: List[Highlight]

@app.get("/")
def health_check():
    return {"status": "ok", "service": "plagiarism-checker"}

@app.post("/plagiarism", response_model=CheckResponse)
def check_plagiarism(req: CheckRequest):
    text = req.text.strip()
    if not text:
        return {"plagiarism_score": 0.0, "highlights": []}

    # Mock Logic for Plagiarism Detection
    # In a real production scenario, this would call a search API (Google/Bing)
    # or check against a vector database of indexed content.
    
    # For demonstration/MVP purposes, we will return a random "low" score
    # unless specific keywords are found, to simulate functionality without fees.
    
    # Simple heuristic: if text matches known "plagiarized" patterns or is very generic
    # (Here we just use random for demo if text is long enough)
    
    highlights = []
    score = 0.0
    
    # Simulate processing time
    # import time; time.sleep(1)

    # Mock detection: randomly flag one sentence if text is long enough
    if len(text) > 50 and "copy" in text.lower(): 
         # Artificial trigger for testing: if word "copy" is in text
        score = 0.85
        highlights.append({
            "text": text,
            "start": 0,
            "end": len(text),
            "confidence": 0.95,
            "sources": ["https://example.com/source-article"]
        })
    elif len(text) > 100:
        # Random small chance of "accidental" plagiarism for long text
        if random.random() < 0.1:
            score = 0.15
            # Highlight first 20 chars
            highlights.append({
                "text": text[:20],
                "start": 0,
                "end": 20,
                "confidence": 0.60,
                "sources": ["https://wikipedia.org/wiki/Generic_Topic"]
            })
    
    return {
        "plagiarism_score": score,
        "highlights": highlights
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)
