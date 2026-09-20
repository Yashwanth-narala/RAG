from fastapi import FastAPI # type: ignore
from pydantic import BaseModel # type: ignore
from sentence_transformers import CrossEncoder # type: ignore

app = FastAPI()

# Load model once (important)
model = CrossEncoder("BAAI/bge-reranker-base")

class RequestModel(BaseModel):
    query: str
    chunks: list[str]

@app.post("/rerank")
def rerank(req: RequestModel):
    pairs = [(req.query, chunk) for chunk in req.chunks]

    scores = model.predict(pairs)

    # Keep original index for mapping
    indexed_scores = list(enumerate(scores))

    ranked = sorted(indexed_scores, key=lambda x: x[1], reverse=True)

    return {
        "results": [
            {"index": idx, "score": float(score)}
            for idx, score in ranked
        ]
    }