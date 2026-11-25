"""
Encoding Laboratory Router — API endpoints for analyzing encoding trade-offs.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from engines.encoding_engine import analyze_encoding_costs

router = APIRouter()

class EncodingComparisonRequest(BaseModel):
    features: List[float] = [0.5, 0.8]

@router.post("/compare")
async def api_compare_encodings(req: EncodingComparisonRequest):
    """Compare all 5 quantum encodings across qubits, gates, depth, and noise exposure."""
    try:
        return analyze_encoding_costs(req.features)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
