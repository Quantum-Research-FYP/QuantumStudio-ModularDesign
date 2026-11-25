"""
Ansatz Search Router — Evaluate and rank ansatz configurations.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from engines.qiskit_engine import build_ansatz, analyze_barren_plateau
import numpy as np

router = APIRouter()


class AnsatzSearchRequest(BaseModel):
    n_qubits: int = 4
    ansatze: List[str] = ["EfficientSU2", "RealAmplitudes", "TwoLocal"]
    reps_range: List[int] = [1, 2, 3]
    entanglements: List[str] = ["full", "linear", "circular"]
    n_samples: int = 30


@router.post("/search")
async def api_ansatz_search(req: AnsatzSearchRequest):
    """Search for the best ansatz configuration."""
    try:
        candidates = []

        for ansatz_name in req.ansatze:
            for reps in req.reps_range:
                for ent in req.entanglements:
                    try:
                        # Get ansatz info
                        info = build_ansatz(ansatz_name, req.n_qubits, reps, ent)

                        # Get trainability info
                        bp = analyze_barren_plateau(
                            req.n_qubits, ansatz_name, reps, req.n_samples, ent
                        )

                        # Compute scores
                        depth_score = max(0, 1.0 - info["depth"] / 50)
                        param_score = max(0, 1.0 - info["num_parameters"] / 100)
                        cx_count = info["gate_counts"].get("cx", 0)
                        hardware_score = max(0, 1.0 - cx_count / 30)
                        trainability = bp["trainability_score"]

                        # Composite score (weighted)
                        composite = (
                            0.35 * trainability +
                            0.25 * depth_score +
                            0.20 * hardware_score +
                            0.20 * param_score
                        )

                        candidates.append({
                            "ansatz": ansatz_name,
                            "reps": reps,
                            "entanglement": ent,
                            "n_parameters": info["num_parameters"],
                            "depth": info["depth"],
                            "cx_gates": cx_count,
                            "trainability_score": trainability,
                            "depth_score": float(depth_score),
                            "hardware_score": float(hardware_score),
                            "param_score": float(param_score),
                            "composite_score": float(composite),
                            "barren_plateau_risk": bp["barren_plateau_detected"],
                        })
                    except Exception:
                        continue

        # Sort by composite score
        candidates.sort(key=lambda c: c["composite_score"], reverse=True)

        return {
            "candidates": candidates,
            "best": candidates[0] if candidates else None,
            "n_evaluated": len(candidates),
            "n_qubits": req.n_qubits,
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
