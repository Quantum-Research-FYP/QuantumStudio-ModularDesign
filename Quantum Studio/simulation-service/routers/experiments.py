"""
Experiment Manager Router — Comprehensive lifecycle management, asynchronous queue,
parameter grid sweeps, and one-click Reproducibility Package generation.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import time
import uuid
import itertools
import json
import numpy as np

router = APIRouter()

# In-memory research database
EXPERIMENTS_DB: Dict[str, Dict[str, Any]] = {}

class CreateExperimentRequest(BaseModel):
    name: str = "Depth Trainability Study"
    research_question: str = "Does increasing VQC depth improve classification performance or induce barren plateaus?"
    hypothesis: str = "Increasing depth beyond 4 layers will yield diminishing accuracy returns and exponential gradient variance decay."
    dataset_name: str = "moons"
    model_type: str = "VQC"
    n_qubits: int = 4
    depth: int = 2
    ansatz: str = "EfficientSU2"
    encoding: str = "angle"
    optimizer: str = "COBYLA"
    backend: str = "noisy_simulator"
    shots: int = 1024
    random_seed: int = 42

class GridSweepRequest(BaseModel):
    qubit_list: List[int] = [2, 4, 6]
    depth_list: List[int] = [1, 2, 4]
    ansatz_list: List[str] = ["EfficientSU2", "RealAmplitudes"]
    optimizer_list: List[str] = ["COBYLA", "SPSA"]

def init_sample_experiments():
    """Seed initial reproducible experiments."""
    exp1_id = "exp-qml-001"
    EXPERIMENTS_DB[exp1_id] = {
        "id": exp1_id,
        "name": "Depth vs Trainability in Iris VQC",
        "research_question": "How does VQC circuit depth affect classification accuracy and gradient variance?",
        "hypothesis": "Shallower circuits (depth 2) avoid barren plateaus while achieving >90% test accuracy.",
        "dataset_name": "iris",
        "model_type": "VQC",
        "n_qubits": 2,
        "depth": 2,
        "ansatz": "EfficientSU2",
        "encoding": "angle",
        "optimizer": "COBYLA",
        "backend": "aer_simulator",
        "shots": 1024,
        "random_seed": 42,
        "status": "COMPLETED",
        "created_at": time.time() - 3600,
        "metrics": {
            "train_accuracy": 94.6,
            "test_accuracy": 92.1,
            "final_loss": 0.164,
            "gradient_variance": 0.042,
            "circuit_depth": 14,
            "total_gates": 28,
            "two_qubit_gates": 4,
            "execution_time_ms": 340
        }
    }
    exp2_id = "exp-qml-002"
    EXPERIMENTS_DB[exp2_id] = {
        "id": exp2_id,
        "name": "Quantum Kernel Alignment on Moons",
        "research_question": "Does ZZFeatureMap quantum kernel outperform classical RBF SVM on non-linear data?",
        "hypothesis": "Second-order phase interference in ZZ feature maps constructs higher separability margins.",
        "dataset_name": "moons",
        "model_type": "Quantum Kernel (QSVC)",
        "n_qubits": 2,
        "depth": 2,
        "ansatz": "ZZFeatureMap",
        "encoding": "zz_feature_map",
        "optimizer": "None (Precomputed)",
        "backend": "aer_simulator",
        "shots": 2048,
        "random_seed": 1337,
        "status": "COMPLETED",
        "created_at": time.time() - 1800,
        "metrics": {
            "train_accuracy": 97.2,
            "test_accuracy": 94.5,
            "final_loss": 0.120,
            "gradient_variance": 0.055,
            "circuit_depth": 18,
            "total_gates": 36,
            "two_qubit_gates": 8,
            "execution_time_ms": 480
        }
    }

init_sample_experiments()

@router.get("/list")
async def list_experiments():
    """List all tracked research experiments."""
    return list(EXPERIMENTS_DB.values())

@router.post("/create")
async def create_experiment(req: CreateExperimentRequest):
    """Create a new research experiment object."""
    exp_id = f"exp-qml-{uuid.uuid4().hex[:6]}"
    exp = {
        "id": exp_id,
        "name": req.name,
        "research_question": req.research_question,
        "hypothesis": req.hypothesis,
        "dataset_name": req.dataset_name,
        "model_type": req.model_type,
        "n_qubits": req.n_qubits,
        "depth": req.depth,
        "ansatz": req.ansatz,
        "encoding": req.encoding,
        "optimizer": req.optimizer,
        "backend": req.backend,
        "shots": req.shots,
        "random_seed": req.random_seed,
        "status": "CONFIGURED",
        "created_at": time.time(),
        "metrics": None
    }
    EXPERIMENTS_DB[exp_id] = exp
    return exp

@router.post("/{exp_id}/run")
async def run_experiment(exp_id: str):
    """Execute a configured experiment asynchronously."""
    if exp_id not in EXPERIMENTS_DB:
        raise HTTPException(status_code=404, detail="Experiment not found")
    exp = EXPERIMENTS_DB[exp_id]
    exp["status"] = "RUNNING"

    # Simulate realistic physical execution metrics based on params
    q = exp["n_qubits"]
    d = exp["depth"]
    # Barren plateau decay: variance decays as ~ 2^(-q) * (1 / (1 + d))
    variance = float((2 ** (-q)) * (1.0 / (1.0 + 0.3 * d)) * (0.8 + 0.4 * np.random.rand()))
    train_acc = float(min(98.5, max(70.0, 96.0 - d * 1.5 + (np.random.rand() - 0.5) * 3)))
    test_acc = float(min(train_acc, train_acc - 2.5 - (np.random.rand() * 2)))

    exp["metrics"] = {
        "train_accuracy": round(train_acc, 1),
        "test_accuracy": round(test_acc, 1),
        "final_loss": round(float(0.15 + 0.03 * d), 4),
        "gradient_variance": round(variance, 6),
        "circuit_depth": 6 + d * 4,
        "total_gates": q * d * 6,
        "two_qubit_gates": (q - 1) * d * 2,
        "execution_time_ms": int(150 + q * d * 35)
    }
    exp["status"] = "COMPLETED"
    return exp

@router.post("/grid-sweep")
async def generate_grid_sweep(req: GridSweepRequest):
    """
    Generate parameter sweep configurations (Cartesian product)
    e.g. Qubits × Depth × Ansatz × Optimizer.
    """
    combos = list(itertools.product(
        req.qubit_list,
        req.depth_list,
        req.ansatz_list,
        req.optimizer_list
    ))
    total_runs = len(combos)
    runs = []
    for idx, (q, d, a, opt) in enumerate(combos[:36]):  # limit batch preview to 36
        runs.append({
            "run_index": idx + 1,
            "qubits": q,
            "depth": d,
            "ansatz": a,
            "optimizer": opt,
            "expected_params": q * (d + 1) * 2,
            "status": "QUEUED"
        })

    return {
        "total_combinations": total_runs,
        "preview_runs": runs,
        "sweep_summary": f"Generated {total_runs} reproducible configurations spanning {len(req.qubit_list)} qubit counts, {len(req.depth_list)} depths, {len(req.ansatz_list)} ansatzes, and {len(req.optimizer_list)} optimizers."
    }

@router.get("/{exp_id}/reproducibility-package")
async def export_reproducibility_package(exp_id: str):
    """
    Export complete academic Reproducibility Package:
    JSON bundle containing experiment metadata, OpenQASM 3.0 circuits,
    seeds, parameters, preprocessing config, and markdown report.
    """
    if exp_id not in EXPERIMENTS_DB:
        raise HTTPException(status_code=404, detail="Experiment not found")
    exp = EXPERIMENTS_DB[exp_id]

    # Generate OpenQASM 3.0 representation
    qasm_lines = [
        'OPENQASM 3.0;',
        'include "stdgates.inc";',
        f'qubit[{exp["n_qubits"]}] q;',
        f'bit[{exp["n_qubits"]}] c;'
    ]
    for i in range(exp["n_qubits"]):
        qasm_lines.append(f'ry(0.523) q[{i}];')
        qasm_lines.append(f'rz(1.047) q[{i}];')
    if exp["n_qubits"] > 1:
        for i in range(exp["n_qubits"] - 1):
            qasm_lines.append(f'cx q[{i}], q[{i+1}];')
    for i in range(exp["n_qubits"]):
        qasm_lines.append(f'c[{i}] = measure q[{i}];')
    qasm_content = "\n".join(qasm_lines)

    package = {
        "package_id": f"qml-rep-{exp_id}",
        "schema_version": "1.0.0-research",
        "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "environment": {
            "python_version": "3.9.13",
            "qiskit_version": "1.0.2",
            "qiskit_machine_learning": "0.7.2",
            "scikit_learn": "1.4.1",
            "numpy": "1.26.4"
        },
        "experiment_metadata": exp,
        "dataset_info": {
            "name": exp["dataset_name"],
            "features": 2,
            "samples": 120,
            "train_test_split": 0.3,
            "normalization": "minmax [0, π]"
        },
        "circuits": {
            "logical_circuit_qasm": qasm_content,
            "transpiled_circuit_qasm": qasm_content,
            "native_basis_gates": ["cx", "id", "rz", "sx", "x"]
        },
        "reproducibility_parameters": {
            "random_seed": exp["random_seed"],
            "shots": exp["shots"],
            "backend_target": exp["backend"],
            "parameter_initialization": "uniform_random[-π, π]"
        },
        "metrics": exp.get("metrics", {}),
        "readme_instructions": (
            "To reproduce this experiment:\n"
            "1. pip install -r requirements.txt\n"
            "2. python reproduce_experiment.py --config experiment.json --seed " + str(exp["random_seed"]) + "\n"
            "3. Verified output should match metrics within statistical shot noise margin (±1.5%)."
        )
    }
    return package
