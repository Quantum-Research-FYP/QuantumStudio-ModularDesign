"""
Model Laboratory Router — VQC, QNN, and Quantum Kernel endpoints.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from engines.qiskit_engine import (
    compute_quantum_kernel, train_vqc, build_ansatz, build_feature_map, analyze_circuit
)

router = APIRouter()


class KernelRequest(BaseModel):
    X_train: List[List[float]]
    X_test: Optional[List[List[float]]] = None
    feature_map: str = "ZZFeatureMap"
    reps: int = 2


class VQCRequest(BaseModel):
    X_train: List[List[float]]
    y_train: List[int]
    X_test: Optional[List[List[float]]] = None
    y_test: Optional[List[int]] = None
    feature_map: str = "ZZFeatureMap"
    ansatz: str = "RealAmplitudes"
    optimizer: str = "COBYLA"
    max_iter: int = 100
    reps: int = 2


class AnsatzRequest(BaseModel):
    name: str = "EfficientSU2"
    n_qubits: int = 2
    reps: int = 2
    entanglement: str = "full"


class CircuitAnalysisRequest(BaseModel):
    feature_map: str = "ZZFeatureMap"
    ansatz: str = "RealAmplitudes"
    n_qubits: int = 2
    reps: int = 2


@router.post("/kernel")
async def api_quantum_kernel(req: KernelRequest):
    """Compute quantum kernel matrix."""
    try:
        return compute_quantum_kernel(
            req.X_train, req.X_test, req.feature_map, req.reps
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/vqc")
async def api_train_vqc(req: VQCRequest):
    """Train a Variational Quantum Classifier."""
    try:
        return train_vqc(
            req.X_train, req.y_train, req.X_test, req.y_test,
            req.feature_map, req.ansatz, req.optimizer,
            req.max_iter, req.reps
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/ansatz")
async def api_build_ansatz(req: AnsatzRequest):
    """Build and analyze an ansatz."""
    try:
        return build_ansatz(req.name, req.n_qubits, req.reps, req.entanglement)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/circuit-analysis")
async def api_circuit_analysis(req: CircuitAnalysisRequest):
    """Analyze a full QML circuit."""
    try:
        return analyze_circuit(req.feature_map, req.ansatz, req.n_qubits, req.reps)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/feature-maps")
async def list_feature_maps():
    """List available feature maps."""
    return [
        {"id": "ZFeatureMap", "name": "Z Feature Map", "has_entanglement": False,
         "description": "Uses only RZ rotations. No entangling gates."},
        {"id": "ZZFeatureMap", "name": "ZZ Feature Map", "has_entanglement": True,
         "description": "Uses ZZ interactions between qubits with entangling gates."},
        {"id": "PauliFeatureMap", "name": "Pauli Feature Map", "has_entanglement": True,
         "description": "General Pauli feature map with configurable Pauli operators."},
    ]


@router.get("/ansatze")
async def list_ansatze():
    """List available ansatz types."""
    return [
        {"id": "EfficientSU2", "name": "EfficientSU2",
         "description": "Hardware-efficient ansatz with RY and RZ rotations."},
        {"id": "RealAmplitudes", "name": "Real Amplitudes",
         "description": "Ansatz with only RY rotations (real amplitudes)."},
        {"id": "TwoLocal", "name": "Two-Local",
         "description": "Configurable two-local ansatz with rotation and entanglement blocks."},
    ]


@router.get("/optimizers")
async def list_optimizers():
    """List available optimizers."""
    return [
        {"id": "COBYLA", "name": "COBYLA", "type": "gradient-free",
         "description": "Constrained Optimization BY Linear Approximation."},
        {"id": "SPSA", "name": "SPSA", "type": "gradient-free",
         "description": "Simultaneous Perturbation Stochastic Approximation."},
    ]
