"""
Hardware Lab Router — Circuit transpilation, noise models, hardware analysis.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import numpy as np

router = APIRouter()


class TranspileRequest(BaseModel):
    feature_map: str = "ZZFeatureMap"
    ansatz: str = "RealAmplitudes"
    n_qubits: int = 2
    reps: int = 2
    optimization_level: int = 1


class NoiseAnalysisRequest(BaseModel):
    feature_map: str = "ZZFeatureMap"
    ansatz: str = "RealAmplitudes"
    n_qubits: int = 2
    reps: int = 2
    noise_level: float = 0.01  # single-qubit gate error rate


@router.post("/transpile")
async def api_transpile(req: TranspileRequest):
    """Transpile a QML circuit and report hardware metrics."""
    try:
        from engines.qiskit_engine import build_feature_map, build_ansatz

        fm_info = build_feature_map(req.feature_map, req.n_qubits, req.reps)
        az_info = build_ansatz(req.ansatz, req.n_qubits, req.reps)

        try:
            from qiskit.circuit.library import ZFeatureMap, ZZFeatureMap, PauliFeatureMap
            from qiskit.circuit.library import RealAmplitudes, EfficientSU2, TwoLocal
            from qiskit import transpile
            from qiskit.transpiler.preset_passmanagers import generate_preset_pass_manager

            fm_map = {"ZFeatureMap": ZFeatureMap, "ZZFeatureMap": ZZFeatureMap, "PauliFeatureMap": PauliFeatureMap}
            az_map = {"RealAmplitudes": RealAmplitudes, "EfficientSU2": EfficientSU2, "TwoLocal": TwoLocal}

            fm = fm_map.get(req.feature_map, ZZFeatureMap)(feature_dimension=req.n_qubits, reps=req.reps)
            az = az_map.get(req.ansatz, RealAmplitudes)(req.n_qubits, reps=req.reps)
            qc = fm.compose(az)

            # Transpile at different optimization levels
            levels = {}
            for level in range(4):
                tc = transpile(qc, optimization_level=level, basis_gates=['cx', 'id', 'rz', 'sx', 'x'])
                levels[str(level)] = {
                    "depth": tc.depth(),
                    "gate_counts": dict(tc.count_ops()),
                    "total_gates": sum(tc.count_ops().values()),
                    "cx_count": tc.count_ops().get('cx', 0),
                }

            return {
                "original": {
                    "depth": qc.depth(),
                    "gate_counts": dict(qc.count_ops()),
                    "total_gates": sum(qc.count_ops().values()),
                },
                "transpiled_levels": levels,
                "n_qubits": req.n_qubits,
                "feature_map": req.feature_map,
                "ansatz": req.ansatz,
                "real_qiskit": True,
            }
        except ImportError:
            # Simulated transpilation
            original_depth = fm_info["depth"] + az_info["depth"]
            original_gates = sum(fm_info["gate_counts"].values()) + sum(az_info["gate_counts"].values())
            levels = {}
            for level in range(4):
                reduction = 1.0 - level * 0.08
                levels[str(level)] = {
                    "depth": max(1, int(original_depth * reduction)),
                    "total_gates": max(1, int(original_gates * reduction)),
                    "cx_count": max(0, int((fm_info["gate_counts"].get("cx", 0) + az_info["gate_counts"].get("cx", 0)) * reduction)),
                }
            return {
                "original": {"depth": original_depth, "total_gates": original_gates},
                "transpiled_levels": levels,
                "n_qubits": req.n_qubits,
                "real_qiskit": False,
            }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/noise-analysis")
async def api_noise_analysis(req: NoiseAnalysisRequest):
    """Analyze the impact of noise on a QML circuit."""
    try:
        from engines.qiskit_engine import build_feature_map, build_ansatz

        fm_info = build_feature_map(req.feature_map, req.n_qubits, req.reps)
        az_info = build_ansatz(req.ansatz, req.n_qubits, req.reps)

        total_gates = sum(fm_info["gate_counts"].values()) + sum(az_info["gate_counts"].values())
        cx_gates = fm_info["gate_counts"].get("cx", 0) + az_info["gate_counts"].get("cx", 0)
        single_gates = total_gates - cx_gates
        depth = fm_info["depth"] + az_info["depth"]

        # Estimate error rates
        single_q_error = req.noise_level
        two_q_error = req.noise_level * 10  # typical: 2Q error ~ 10x 1Q error
        readout_error = req.noise_level * 5

        # Circuit fidelity estimation
        gate_fidelity = (1 - single_q_error) ** single_gates * (1 - two_q_error) ** cx_gates
        readout_fidelity = (1 - readout_error) ** req.n_qubits
        total_fidelity = gate_fidelity * readout_fidelity

        # Noise impact at different error rates
        noise_sweep = []
        for rate in np.linspace(0.0001, 0.05, 20):
            sq_e = rate
            tq_e = rate * 10
            ro_e = rate * 5
            fid = (1 - sq_e) ** single_gates * (1 - tq_e) ** cx_gates * (1 - ro_e) ** req.n_qubits
            noise_sweep.append({
                "error_rate": float(rate),
                "estimated_fidelity": float(fid),
            })

        return {
            "n_qubits": req.n_qubits,
            "feature_map": req.feature_map,
            "ansatz": req.ansatz,
            "total_gates": total_gates,
            "single_qubit_gates": single_gates,
            "two_qubit_gates": cx_gates,
            "depth": depth,
            "noise_level": req.noise_level,
            "single_qubit_error": single_q_error,
            "two_qubit_error": two_q_error,
            "readout_error": readout_error,
            "gate_fidelity": float(gate_fidelity),
            "readout_fidelity": float(readout_fidelity),
            "total_fidelity": float(total_fidelity),
            "noise_sweep": noise_sweep,
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/backends")
async def list_backends():
    """List available simulation backends."""
    backends = [
        {"id": "statevector", "name": "Statevector Simulator", "type": "ideal",
         "description": "Exact statevector simulation (no noise)"},
        {"id": "qasm", "name": "QASM Simulator", "type": "sampling",
         "description": "Shot-based sampling simulator"},
    ]
    try:
        from qiskit_aer import AerSimulator
        backends.append({"id": "aer", "name": "Aer Simulator", "type": "noise_capable",
                         "description": "Full noise model support"})
    except ImportError:
        pass
    return backends
