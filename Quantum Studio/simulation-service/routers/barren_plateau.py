"""
Barren Plateau Analyzer Router — Gradient variance analysis.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from engines.qiskit_engine import analyze_barren_plateau

router = APIRouter()


class BarrenPlateauRequest(BaseModel):
    n_qubits: int = 4
    ansatz: str = "EfficientSU2"
    reps: int = 2
    n_samples: int = 50
    entanglement: str = "full"


class BarrenPlateauSweepRequest(BaseModel):
    qubit_range: list = [2, 3, 4, 5, 6, 7, 8]
    ansatz: str = "EfficientSU2"
    reps: int = 2
    n_samples: int = 30
    entanglement: str = "full"


@router.post("/analyze")
async def api_barren_plateau(req: BarrenPlateauRequest):
    """Analyze barren plateau for a given ansatz configuration."""
    try:
        return analyze_barren_plateau(
            req.n_qubits, req.ansatz, req.reps, req.n_samples, req.entanglement
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/sweep")
async def api_barren_plateau_sweep(req: BarrenPlateauSweepRequest):
    """Sweep over qubit counts to observe barren plateau onset."""
    try:
        results = []
        for n_q in req.qubit_range:
            r = analyze_barren_plateau(
                n_q, req.ansatz, req.reps, req.n_samples, req.entanglement
            )
            results.append({
                "n_qubits": n_q,
                "overall_variance": r["overall_variance"],
                "trainability_score": r["trainability_score"],
                "barren_plateau_detected": r["barren_plateau_detected"],
                "n_parameters": r["n_parameters"],
            })
        return {
            "sweep_results": results,
            "ansatz": req.ansatz,
            "reps": req.reps,
            "entanglement": req.entanglement,
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


class QubitSweepRequest(BaseModel):
    min_qubits: int = 2
    max_qubits: int = 8
    n_samples: int = 30
    ansatz: str = "EfficientSU2"
    reps: int = 2
    entanglement: str = "full"


@router.post("/qubit-sweep")
async def api_qubit_sweep(req: QubitSweepRequest):
    """Qubit sweep endpoint (frontend-compatible)."""
    try:
        results = []
        for n_q in range(req.min_qubits, req.max_qubits + 1):
            r = analyze_barren_plateau(
                n_q, req.ansatz, req.reps, req.n_samples, req.entanglement
            )
            results.append({
                "qubits": n_q,
                "variance": r["overall_variance"],
                "gradient_mean": r.get("gradient_means", [0.0])[0] if r.get("gradient_means") else 0.0,
            })
        return {"results": results}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

