"""
Encoding Engine — Rigorous cost analysis and state preparation metrics
across Basis, Angle, Amplitude, Phase, and Dense quantum encodings.
"""
import math
import numpy as np
from typing import List, Dict, Any

def analyze_encoding_costs(features: List[float]) -> Dict[str, Any]:
    """
    Calculate required qubits, gate counts, depth, two-qubit gates,
    state-prep overhead, and noise exposure for all 5 encodings.
    """
    n = max(1, len(features))
    
    # 1. Basis Encoding
    # Maps binary string of length n to computational basis state |x>
    # Features are binarized (threshold at median or 0.5)
    basis_qubits = n
    basis_single_gates = sum(1 for x in features if x > 0.5)
    basis_depth = 1 if basis_single_gates > 0 else 0
    basis_two_qubit_gates = 0
    
    # 2. Angle Encoding
    # Uses Ry(x_i) or Rz(x_i) on n individual qubits
    angle_qubits = n
    angle_single_gates = n
    angle_depth = 1
    angle_two_qubit_gates = 0
    
    # 3. Amplitude Encoding
    # Encodes N=2^n features into amplitudes of n qubits: sum x_i |i>
    # State preparation requires general unitaries: O(2^n) CNOTs (Mottonen algorithm)
    amp_qubits = max(1, math.ceil(math.log2(max(2, n))))
    amp_N = 2 ** amp_qubits
    # Mottonen state prep requires 2^(n+1) - 2 CNOT gates and rotation gates
    amp_two_qubit_gates = max(0, 2 ** (amp_qubits + 1) - 2) if amp_qubits > 1 else 0
    amp_single_gates = 2 ** amp_qubits
    amp_depth = max(1, 2 ** amp_qubits * 2)
    
    # 4. Phase Encoding
    # Encodes features into phases via Rz or Pauli-Z gates, often after Hadamards
    phase_qubits = n
    phase_single_gates = n * 2  # H followed by Rz
    phase_depth = 2
    phase_two_qubit_gates = 0
    
    # 5. Dense Angle Encoding
    # Encodes 2 classical features per qubit using Ry and Rz: Ry(x1)Rz(x2)|0>
    dense_qubits = max(1, math.ceil(n / 2))
    dense_single_gates = n
    dense_depth = 2
    dense_two_qubit_gates = 0

    # 6. Angle RX Encoding
    angle_rx_qubits = n
    angle_rx_single_gates = n
    angle_rx_depth = 1
    angle_rx_two_qubit_gates = 0

    # 7. Angle RZ Encoding (H then Rz)
    angle_rz_qubits = n
    angle_rz_single_gates = n * 2
    angle_rz_depth = 2
    angle_rz_two_qubit_gates = 0

    # 8. ZZ Feature Map (Havlíček et al., reps=2)
    zz_qubits = n
    zz_pairs = n * (n - 1) // 2
    zz_reps = 2
    zz_single_gates = n * 2 * zz_reps
    zz_two_qubit_gates = zz_pairs * 2 * zz_reps
    zz_depth = max(1, zz_reps * (2 + max(1, n - 1) * 2))

    # 9. Z Feature Map (First-order, reps=2)
    z_qubits = n
    z_reps = 2
    z_single_gates = n * 2 * z_reps
    z_two_qubit_gates = 0
    z_depth = 2 * z_reps

    # 10. Pauli Feature Map (reps=2)
    pauli_qubits = n
    pauli_reps = 2
    pauli_single_gates = n * 3 * pauli_reps
    pauli_two_qubit_gates = zz_pairs * 2 * pauli_reps
    pauli_depth = max(1, pauli_reps * (3 + max(1, n - 1) * 2))

    # 11. IQP Feature Map
    iqp_qubits = n
    iqp_single_gates = n * 3
    iqp_two_qubit_gates = zz_pairs * 2
    iqp_depth = max(1, 3 + max(1, n - 1) * 2)

    # 12. Hamiltonian Evolution Encoding
    ham_qubits = n
    ham_single_gates = n * 3
    ham_two_qubit_gates = zz_pairs * 2
    ham_depth = max(1, 4 + max(1, n - 1) * 2)

    encodings = [
        {
            "id": "angle",
            "name": "Angle Encoding (Ry)",
            "qubits": angle_qubits,
            "depth": angle_depth,
            "single_qubit_gates": angle_single_gates,
            "two_qubit_gates": angle_two_qubit_gates,
            "total_gates": angle_single_gates + angle_two_qubit_gates,
            "state_prep_overhead": "Low — single rotation pulse per qubit",
            "noise_exposure": 18,
            "main_concern": "Higher qubit requirement O(N); limited Hilbert subspace usage",
            "scaling_qubits": "O(N)",
            "scaling_depth": "O(1)",
            "recommended_use": "NISQ variational algorithms (VQC/QNN) with N <= 16 features",
            "description": "Applies single-qubit rotations Ry(x_i) to initialize state |ψ(x)⟩ = ⨂ (cos(x_i/2)|0⟩ + sin(x_i/2)|1⟩)."
        },
        {
            "id": "angle_rx",
            "name": "Angle Encoding (Rx)",
            "qubits": angle_rx_qubits,
            "depth": angle_rx_depth,
            "single_qubit_gates": angle_rx_single_gates,
            "two_qubit_gates": angle_rx_two_qubit_gates,
            "total_gates": angle_rx_single_gates,
            "state_prep_overhead": "Low — single rotation pulse Rx(x_i)",
            "noise_exposure": 18,
            "main_concern": "Higher qubit count O(N); creates complex phase amplitudes",
            "scaling_qubits": "O(N)",
            "scaling_depth": "O(1)",
            "recommended_use": "Variational circuits using Pauli-X rotation generators",
            "description": "Applies Rx(x_i)|0⟩ = cos(x_i/2)|0⟩ - i*sin(x_i/2)|1⟩ on individual qubits."
        },
        {
            "id": "angle_rz",
            "name": "Angle Encoding (Rz on |+⟩)",
            "qubits": angle_rz_qubits,
            "depth": angle_rz_depth,
            "single_qubit_gates": angle_rz_single_gates,
            "two_qubit_gates": angle_rz_two_qubit_gates,
            "total_gates": angle_rz_single_gates,
            "state_prep_overhead": "Low — Hadamard layer followed by Rz(x_i)",
            "noise_exposure": 20,
            "main_concern": "Relative phase states require interference to read out in Z-basis",
            "scaling_qubits": "O(N)",
            "scaling_depth": "O(1)",
            "recommended_use": "Phase estimation protocols and equatorial Bloch sphere encodings",
            "description": "Initializes equal superposition H|0⟩ then rotates azimuthally via Rz(x_i)."
        },
        {
            "id": "amplitude",
            "name": "Amplitude Encoding",
            "qubits": amp_qubits,
            "depth": amp_depth,
            "single_qubit_gates": amp_single_gates,
            "two_qubit_gates": amp_two_qubit_gates,
            "total_gates": amp_single_gates + amp_two_qubit_gates,
            "state_prep_overhead": f"High — Mottonen state preparation requires {amp_two_qubit_gates} CNOT gates",
            "noise_exposure": min(95, 25 + amp_depth * 8),
            "main_concern": "Potentially exponential circuit depth for arbitrary state preparation on noisy hardware",
            "scaling_qubits": "O(log₂ N)",
            "scaling_depth": "O(2^n) or O(N)",
            "recommended_use": "Fault-tolerant algorithms, quantum linear solvers (HHL), dense image representations",
            "description": "Encodes vector into normalized state amplitudes |ψ(x)⟩ = (1/‖x‖) ∑ x_i |i⟩."
        },
        {
            "id": "basis",
            "name": "Basis Encoding",
            "qubits": basis_qubits,
            "depth": basis_depth,
            "single_qubit_gates": basis_single_gates,
            "two_qubit_gates": basis_two_qubit_gates,
            "total_gates": basis_single_gates,
            "state_prep_overhead": "Very Low — Pauli X flips according to binary vector",
            "noise_exposure": 12,
            "main_concern": "Extremely sparse: no continuous phase representation, requires pre-binarization",
            "scaling_qubits": "O(N)",
            "scaling_depth": "O(1)",
            "recommended_use": "Discrete combinatorial datasets, Grover oracle inputs, quantum associative memory",
            "description": "Directly maps binary string (b₁, ..., b_n) into computational basis state |b₁b₂...b_n⟩ via X gates."
        },
        {
            "id": "phase",
            "name": "Phase Encoding",
            "qubits": phase_qubits,
            "depth": phase_depth,
            "single_qubit_gates": phase_single_gates,
            "two_qubit_gates": phase_two_qubit_gates,
            "total_gates": phase_single_gates,
            "state_prep_overhead": "Low — Hadamard layer followed by phase shifts Rz(2π x_i)",
            "noise_exposure": 24,
            "main_concern": "Relative phase states require interference/entangling layers to be measured in Z-basis",
            "scaling_qubits": "O(N)",
            "scaling_depth": "O(1)",
            "recommended_use": "Quantum Fourier transforms, periodic signals, kernel methods with phase interference",
            "description": "Transforms |0⟩^⊗n via H^⊗n into equal superposition, then applies relative phases e^{i x_k}."
        },
        {
            "id": "dense",
            "name": "Dense Angle Encoding",
            "qubits": dense_qubits,
            "depth": dense_depth,
            "single_qubit_gates": dense_single_gates,
            "two_qubit_gates": dense_two_qubit_gates,
            "total_gates": dense_single_gates,
            "state_prep_overhead": "Moderate — two consecutive non-commuting rotations Ry(x_1)Rz(x_2)",
            "noise_exposure": 22,
            "main_concern": "Non-commuting Bloch rotations can lead to non-linear feature coupling",
            "scaling_qubits": "O(N/2)",
            "scaling_depth": "O(1)",
            "recommended_use": "Hardware-constrained QPU benchmarks when qubit count is limited",
            "description": "Compresses 2 features per qubit by utilizing both polar (Ry) and azimuthal (Rz) Bloch angles."
        },
        {
            "id": "zz_feature_map",
            "name": "ZZ Feature Map (Entangled)",
            "qubits": zz_qubits,
            "depth": zz_depth,
            "single_qubit_gates": zz_single_gates,
            "two_qubit_gates": zz_two_qubit_gates,
            "total_gates": zz_single_gates + zz_two_qubit_gates,
            "state_prep_overhead": f"High — CNOT entanglers generate second-order non-linear interference ({zz_two_qubit_gates} CNOTs)",
            "noise_exposure": min(92, 22 + zz_two_qubit_gates * 3),
            "main_concern": "Two-qubit gate depth increases susceptibility to two-qubit depolarizing noise",
            "scaling_qubits": "O(N)",
            "scaling_depth": "O(N · reps)",
            "recommended_use": "Quantum Kernel SVM (QSVC), complex non-linear classification (moons, spirals)",
            "description": "Second-order Pauli expansion with pairwise entangling phase 2(π - x_i)(π - x_j) (Havlíček et al. Nature 2019)."
        },
        {
            "id": "z_feature_map",
            "name": "Z Feature Map (First-Order)",
            "qubits": z_qubits,
            "depth": z_depth,
            "single_qubit_gates": z_single_gates,
            "two_qubit_gates": 0,
            "total_gates": z_single_gates,
            "state_prep_overhead": "Low — single-qubit phase rotations only (0 CNOTs)",
            "noise_exposure": 22,
            "main_concern": "No multi-qubit entanglement; product-state representations only",
            "scaling_qubits": "O(N)",
            "scaling_depth": "O(reps)",
            "recommended_use": "Linear classification baselines and non-entangled kernel methods",
            "description": "First-order Pauli-Z feature map U_Φ(x) = exp(i ∑ x_i Z_i) H^⊗n creating separable states."
        },
        {
            "id": "pauli_feature_map",
            "name": "Pauli Feature Map (Multi-Basis)",
            "qubits": pauli_qubits,
            "depth": pauli_depth,
            "single_qubit_gates": pauli_single_gates,
            "two_qubit_gates": pauli_two_qubit_gates,
            "total_gates": pauli_single_gates + pauli_two_qubit_gates,
            "state_prep_overhead": f"High — multi-basis rotations (X, Z) with cross-qubit entanglers ({pauli_two_qubit_gates} CNOTs)",
            "noise_exposure": min(94, 26 + pauli_two_qubit_gates * 3),
            "main_concern": "High circuit depth and complex compilation on fixed hardware topologies",
            "scaling_qubits": "O(N)",
            "scaling_depth": "O(N · reps)",
            "recommended_use": "High-expressibility quantum feature spaces and expressibility benchmarks",
            "description": "Generalized multi-basis Pauli rotation feature map with cross-qubit entanglement."
        },
        {
            "id": "iqp",
            "name": "IQP Feature Map",
            "qubits": iqp_qubits,
            "depth": iqp_depth,
            "single_qubit_gates": iqp_single_gates,
            "two_qubit_gates": iqp_two_qubit_gates,
            "total_gates": iqp_single_gates + iqp_two_qubit_gates,
            "state_prep_overhead": f"Moderate to High — diagonal commuting phases sandwiched between Hadamards ({iqp_two_qubit_gates} CNOTs)",
            "noise_exposure": min(88, 22 + iqp_two_qubit_gates * 3),
            "main_concern": "Requires all-to-all or nearest-neighbor ZZ connectivity",
            "scaling_qubits": "O(N)",
            "scaling_depth": "O(N)",
            "recommended_use": "Sampling supremacy demonstrations and provably hard classical kernel simulation",
            "description": "Instantaneous Quantum Polynomial architecture with diagonal phase and non-commuting entanglers."
        },
        {
            "id": "hamiltonian",
            "name": "Hamiltonian Evolution Encoding",
            "qubits": ham_qubits,
            "depth": ham_depth,
            "single_qubit_gates": ham_single_gates,
            "two_qubit_gates": ham_two_qubit_gates,
            "total_gates": ham_single_gates + ham_two_qubit_gates,
            "state_prep_overhead": f"Moderate — Trotterized continuous-time evolution ({ham_two_qubit_gates} CNOTs)",
            "noise_exposure": min(90, 24 + ham_two_qubit_gates * 3),
            "main_concern": "Trotter error accumulation over longer simulation times t",
            "scaling_qubits": "O(N)",
            "scaling_depth": "O(N · steps)",
            "recommended_use": "Physical Hamiltonian simulation, continuous dynamics, and time-series feature mappings",
            "description": "Continuous-time evolution exp(-i H(x) t) under transverse Ising data Hamiltonian."
        }
    ]

    return {
        "n_features": n,
        "input_features": features,
        "encodings": encodings,
        "optimal_for_nisq": "angle",
        "optimal_for_qubit_count": "amplitude",
        "synthesis_summary": (
            f"For {n} features: Angle encoding requires {angle_qubits} qubits at depth {angle_depth} (zero 2Q gates). "
            f"Amplitude encoding achieves logarithmic compression ({amp_qubits} qubits) but requires "
            f"{amp_two_qubit_gates} CNOT gates for arbitrary state preparation, causing high noise exposure."
        )
    }
