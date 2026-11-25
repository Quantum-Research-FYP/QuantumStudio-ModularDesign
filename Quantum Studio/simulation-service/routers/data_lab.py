"""
Data Laboratory Router — API endpoints for data generation, normalization, CSV ingestion, and encoding.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from engines.dataset_generator import (
    generate_dataset, get_available_datasets, parse_custom_csv, preview_csv
)
from engines.qiskit_engine import (
    normalize_data, encode_data_angle, encode_data_angle_rx, encode_data_angle_rz,
    encode_data_amplitude, encode_data_basis, encode_data_phase, encode_data_dense,
    encode_data_zz_feature_map, encode_data_z_feature_map, encode_data_pauli_feature_map,
    encode_data_iqp, encode_data_hamiltonian,
    build_feature_map,
)

router = APIRouter()


class CSVPreviewRequest(BaseModel):
    csv_content: str


class CSVUploadRequest(BaseModel):
    csv_content: str
    target_column: Optional[str] = None
    feature_columns: Optional[List[str]] = None
    normalization: str = "minmax"
    dim_reduction: str = "pca"
    n_components: int = 2
    test_split: float = 0.3


class DatasetRequest(BaseModel):
    dataset_type: str = "moons"
    n_samples: int = 100
    noise: float = 0.1
    n_features: int = 2
    n_classes: int = 2
    test_split: float = 0.3
    normalization: str = "minmax"
    random_seed: int = 42


class NormalizeRequest(BaseModel):
    data: List[List[float]]
    method: str = "min-max"


class EncodeRequest(BaseModel):
    data_point: List[float]
    encoding: str = "angle"


class FeatureMapRequest(BaseModel):
    name: str = "ZZFeatureMap"
    n_qubits: int = 2
    reps: int = 2


@router.get("/datasets")
async def list_datasets():
    """List available dataset types."""
    return get_available_datasets()


@router.post("/preview-csv")
async def api_preview_csv(req: CSVPreviewRequest):
    """Parse CSV header and sample rows to enable interactive column selection."""
    try:
        return preview_csv(req.csv_content)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/generate")
async def api_generate_dataset(req: DatasetRequest):
    """Generate a toy dataset or load standard benchmarks (iris, breast_cancer, wine, digits)."""
    try:
        return generate_dataset(
            dataset_type=req.dataset_type,
            n_samples=req.n_samples,
            noise=req.noise,
            n_features=req.n_features,
            n_classes=req.n_classes,
            test_split=req.test_split,
            normalization=req.normalization,
            random_seed=req.random_seed,
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/upload-csv")
async def api_upload_csv(req: CSVUploadRequest):
    """Parse custom CSV data, select features/target, apply PCA/normalization, and split."""
    try:
        return parse_custom_csv(
            csv_text=req.csv_content,
            target_column=req.target_column,
            feature_columns=req.feature_columns,
            normalization=req.normalization,
            dim_reduction=req.dim_reduction,
            n_components=req.n_components,
            test_split=req.test_split
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/normalize")
async def api_normalize(req: NormalizeRequest):
    """Normalize data."""
    try:
        return normalize_data(req.data, req.method)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/encodings")
async def api_list_encodings():
    """Return catalog of all supported quantum feature maps and data encoding strategies."""
    return {
        "encodings": [
            {
                "id": "angle",
                "name": "Angle Encoding (Ry)",
                "category": "Single-Qubit Rotations",
                "qubit_scaling": "O(N)",
                "depth": 1,
                "two_qubit_gates": 0,
                "formula": "|ψ(x)⟩ = ⨂ (cos(x_i/2)|0⟩ + sin(x_i/2)|1⟩)",
                "description": "Standard Bloch sphere rotation around Y axis. Preserves real-valued amplitudes."
            },
            {
                "id": "angle_rx",
                "name": "Angle Encoding (Rx)",
                "category": "Single-Qubit Rotations",
                "qubit_scaling": "O(N)",
                "depth": 1,
                "two_qubit_gates": 0,
                "formula": "|ψ(x)⟩ = ⨂ (cos(x_i/2)|0⟩ - i sin(x_i/2)|1⟩)",
                "description": "Bloch sphere rotation around X axis with complex phase components."
            },
            {
                "id": "angle_rz",
                "name": "Angle Encoding (Rz on |+⟩)",
                "category": "Single-Qubit Rotations",
                "qubit_scaling": "O(N)",
                "depth": 2,
                "two_qubit_gates": 0,
                "formula": "|ψ(x)⟩ = ⨂ (1/√2)(e^{-i x_i/2}|0⟩ + e^{i x_i/2}|1⟩)",
                "description": "Equatorial rotation around Z axis following Hadamard initialization."
            },
            {
                "id": "amplitude",
                "name": "Amplitude Encoding",
                "category": "Hilbert Compression",
                "qubit_scaling": "O(log₂ N)",
                "depth": "O(2ⁿ)",
                "two_qubit_gates": "O(2ⁿ)",
                "formula": "|ψ(x)⟩ = ∑ x_i |i⟩ / ||x||₂",
                "description": "Encodes vector into state amplitudes. Achieves exponential compression."
            },
            {
                "id": "dense",
                "name": "Dense Angle Encoding",
                "category": "Hilbert Compression",
                "qubit_scaling": "O(N/2)",
                "depth": 2,
                "two_qubit_gates": 0,
                "formula": "|ψ(x)⟩ = ⨂ Rz(x_{2j+1}) Ry(x_{2j}) |0⟩",
                "description": "Encodes two classical features per physical qubit using polar and azimuthal angles."
            },
            {
                "id": "basis",
                "name": "Basis Encoding",
                "category": "Discrete Mapping",
                "qubit_scaling": "O(N)",
                "depth": 1,
                "two_qubit_gates": 0,
                "formula": "|ψ(x)⟩ = |b₁ b₂ ... b_N⟩",
                "description": "Direct binary mapping into computational basis via Pauli-X bit flips."
            },
            {
                "id": "phase",
                "name": "Phase Encoding",
                "category": "Phase Superposition",
                "qubit_scaling": "O(N)",
                "depth": 2,
                "two_qubit_gates": 0,
                "formula": "|ψ(x)⟩ = (1/√2ⁿ) ∑ e^{i x_k} |k⟩",
                "description": "Encodes data into relative phases of equal superposition for Fourier methods."
            },
            {
                "id": "zz_feature_map",
                "name": "ZZ Feature Map (Entangled)",
                "category": "Quantum Kernels",
                "qubit_scaling": "O(N)",
                "depth": "O(N · reps)",
                "two_qubit_gates": "O(N² · reps)",
                "formula": "U(x) = exp(i ∑ x_j Z_j + i ∑ (π - x_j)(π - x_k) Z_j Z_k) H^{⊗n}",
                "description": "Havlíček et al. (Nature 2019) second-order non-linear entangled kernel."
            },
            {
                "id": "z_feature_map",
                "name": "Z Feature Map (First-Order)",
                "category": "Quantum Kernels",
                "qubit_scaling": "O(N)",
                "depth": "O(reps)",
                "two_qubit_gates": 0,
                "formula": "U(x) = exp(i ∑ x_j Z_j) H^{⊗n}",
                "description": "First-order Pauli-Z kernel generating non-entangled product states."
            },
            {
                "id": "pauli_feature_map",
                "name": "Pauli Feature Map (Multi-Basis)",
                "category": "Quantum Kernels",
                "qubit_scaling": "O(N)",
                "depth": "O(N · reps)",
                "two_qubit_gates": "O(N² · reps)",
                "formula": "Multi-basis Pauli rotations with cross-qubit entanglement",
                "description": "Generalized multi-basis Pauli rotation feature map with cross-qubit entanglement."
            },
            {
                "id": "iqp",
                "name": "IQP Feature Map",
                "category": "Quantum Kernels",
                "qubit_scaling": "O(N)",
                "depth": "O(N)",
                "two_qubit_gates": "O(N²)",
                "formula": "H^{⊗n} exp(i ∑ x_i Z_i + i ∑ x_i x_j Z_i Z_j) H^{⊗n}",
                "description": "Instantaneous Quantum Polynomial architecture with diagonal commuting phases."
            },
            {
                "id": "hamiltonian",
                "name": "Hamiltonian Evolution",
                "category": "Quantum Simulation",
                "qubit_scaling": "O(N)",
                "depth": "O(N · steps)",
                "two_qubit_gates": "O(N² · steps)",
                "formula": "U(x, t) = exp(-i [∑ x_i X_i + ∑ x_i x_j Z_i Z_j] t)",
                "description": "Trotterized continuous-time evolution under transverse Ising data Hamiltonian."
            }
        ]
    }


@router.post("/encode")
async def api_encode(req: EncodeRequest):
    """Encode a data point into a quantum state."""
    try:
        encoders = {
            "angle": encode_data_angle,
            "angle_ry": encode_data_angle,
            "angle_rx": encode_data_angle_rx,
            "angle_rz": encode_data_angle_rz,
            "amplitude": encode_data_amplitude,
            "basis": encode_data_basis,
            "phase": encode_data_phase,
            "dense": encode_data_dense,
            "zz_feature_map": encode_data_zz_feature_map,
            "z_feature_map": encode_data_z_feature_map,
            "pauli_feature_map": encode_data_pauli_feature_map,
            "iqp": encode_data_iqp,
            "hamiltonian": encode_data_hamiltonian,
        }
        enc_key = req.encoding.lower().replace("-", "_").replace(" ", "_")
        if enc_key not in encoders:
            # Fallback matching
            if "zz" in enc_key:
                enc_key = "zz_feature_map"
            elif "pauli" in enc_key:
                enc_key = "pauli_feature_map"
            elif "z_" in enc_key or enc_key == "z":
                enc_key = "z_feature_map"
            elif "rx" in enc_key:
                enc_key = "angle_rx"
            elif "rz" in enc_key:
                enc_key = "angle_rz"
            elif "iqp" in enc_key:
                enc_key = "iqp"
            elif "hamiltonian" in enc_key:
                enc_key = "hamiltonian"
            else:
                raise ValueError(f"Unknown encoding: {req.encoding}. Available: {list(encoders.keys())}")
        return encoders[enc_key](req.data_point)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/feature-map")
async def api_feature_map(req: FeatureMapRequest):
    """Build and analyze a feature map."""
    try:
        return build_feature_map(req.name, req.n_qubits, req.reps)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
