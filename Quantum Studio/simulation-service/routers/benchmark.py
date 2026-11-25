"""
Benchmark Router — Quantum vs Classical ML comparison.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from engines.classical_engine import run_benchmark, train_classical_model, get_available_models
from engines.qiskit_engine import compute_quantum_kernel, train_vqc
import numpy as np
import time

router = APIRouter()


class BenchmarkRequest(BaseModel):
    X_train: List[List[float]]
    y_train: List[int]
    X_test: List[List[float]]
    y_test: List[int]
    quantum_model: str = "vqc"  # "vqc" or "qke"
    feature_map: str = "ZZFeatureMap"
    ansatz: str = "RealAmplitudes"
    optimizer: str = "COBYLA"
    max_iter: int = 50
    reps: int = 2
    classical_models: Optional[List[str]] = None


@router.post("/run")
@router.post("/compare")
async def api_run_benchmark(req: BenchmarkRequest):
    """Run full quantum vs classical benchmark."""
    try:
        results = {"quantum": {}, "classical": {}, "comparison": {}}

        # Run quantum model
        q_start = time.time()
        if req.quantum_model == "vqc":
            q_result = train_vqc(
                req.X_train, req.y_train, req.X_test, req.y_test,
                req.feature_map, req.ansatz, req.optimizer,
                req.max_iter, req.reps
            )
        elif req.quantum_model == "qke":
            from sklearn.svm import SVC
            from sklearn.metrics import accuracy_score, f1_score

            kernel_result = compute_quantum_kernel(
                req.X_train, req.X_test, req.feature_map, req.reps
            )
            K_train = np.array(kernel_result["kernel_matrix_train"])
            y_train = np.array(req.y_train)
            svm = SVC(kernel="precomputed")
            svm.fit(K_train, y_train)

            train_pred = svm.predict(K_train)
            q_result = {
                "train_accuracy": float(accuracy_score(y_train, train_pred)),
                "feature_map": req.feature_map,
                "real_qiskit": kernel_result.get("real_qiskit", False),
            }
            if "kernel_matrix_test" in kernel_result:
                K_test = np.array(kernel_result["kernel_matrix_test"])
                y_test = np.array(req.y_test)
                test_pred = svm.predict(K_test)
                q_result["test_accuracy"] = float(accuracy_score(y_test, test_pred))
                q_result["test_f1"] = float(f1_score(y_test, test_pred, average="weighted"))
                q_result["predictions"] = test_pred.tolist()
        else:
            raise ValueError(f"Unknown quantum model: {req.quantum_model}")

        q_result["total_time"] = time.time() - q_start
        q_result["model_type"] = req.quantum_model
        results["quantum"] = q_result

        # Run classical models
        c_result = run_benchmark(
            req.X_train, req.y_train, req.X_test, req.y_test,
            req.classical_models
        )
        results["classical"] = c_result

        # Comparison
        q_acc = q_result.get("test_accuracy", q_result.get("train_accuracy", 0))
        best_c_acc = c_result.get("best_accuracy", 0)
        results["comparison"] = {
            "quantum_accuracy": q_acc,
            "best_classical_accuracy": best_c_acc,
            "quantum_advantage": q_acc > best_c_acc,
            "advantage_margin": q_acc - best_c_acc,
            "best_classical_model": c_result.get("best_model"),
            "quantum_model": req.quantum_model,
            "quantum_time": q_result.get("total_time", 0),
        }

        return results
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/classical-models")
async def api_list_classical_models():
    """List available classical models for benchmarking."""
    return get_available_models()
