"""
Dataset Generator — Generate toy datasets and load real benchmarks/CSVs for QML experiments.
Enhanced with interactive CSV previewing, quantum readiness checks, and flexible normalization.
"""
import io
import csv
import math
import numpy as np
from typing import List, Dict, Any, Tuple, Optional
from sklearn.datasets import (
    make_moons, make_circles, make_classification, make_blobs,
    load_iris, load_breast_cancer, load_wine, load_digits
)
from sklearn.decomposition import PCA


def apply_normalization(X: np.ndarray, method: str = "minmax") -> np.ndarray:
    """
    Apply mathematical normalization for quantum circuit state preparation.
    Supported:
      - 'minmax' or 'minmax_pi': Scales to [0, π] (Ry angle rotation compatible)
      - 'minmax_1': Scales to [0, 1]
      - 'minmax_symmetric': Scales to [-1, 1]
      - 'zscore': Zero mean, unit variance
      - 'norm2': L2 Unit norm for amplitude encoding
      - 'none': Raw features
    """
    if X.size == 0 or method in ("none", "raw", None):
        return X

    method = method.lower()
    X_norm = X.astype(np.float64, copy=True)

    if method in ("minmax", "minmax_pi"):
        # Scale to [0, π]
        min_vals = np.min(X_norm, axis=0)
        max_vals = np.max(X_norm, axis=0)
        diff = max_vals - min_vals
        diff[diff == 0] = 1.0
        X_norm = ((X_norm - min_vals) / diff) * np.pi
    elif method == "minmax_1":
        # Scale to [0, 1]
        min_vals = np.min(X_norm, axis=0)
        max_vals = np.max(X_norm, axis=0)
        diff = max_vals - min_vals
        diff[diff == 0] = 1.0
        X_norm = (X_norm - min_vals) / diff
    elif method == "minmax_symmetric":
        # Scale to [-1, 1]
        min_vals = np.min(X_norm, axis=0)
        max_vals = np.max(X_norm, axis=0)
        diff = max_vals - min_vals
        diff[diff == 0] = 1.0
        X_norm = ((X_norm - min_vals) / diff) * 2.0 - 1.0
    elif method == "zscore":
        # Standardize (mean 0, std 1)
        mean = np.mean(X_norm, axis=0)
        std = np.std(X_norm, axis=0)
        std[std == 0] = 1.0
        X_norm = (X_norm - mean) / std
    elif method in ("norm2", "l2", "amplitude"):
        # Unit vector for amplitude encoding
        norms = np.linalg.norm(X_norm, axis=1, keepdims=True)
        norms[norms == 0] = 1.0
        X_norm = X_norm / norms

    return X_norm


def compute_quantum_specs(X: np.ndarray, y: np.ndarray, normalization: str) -> Dict[str, Any]:
    """Compute quantum circuit readiness and encoding constraints."""
    n_features = X.shape[1] if len(X.shape) > 1 else 1
    hilbert_dim = 2 ** n_features
    n_qubits_amplitude = max(1, math.ceil(math.log2(max(2, n_features))))

    min_val = float(np.min(X)) if X.size > 0 else 0.0
    max_val = float(np.max(X)) if X.size > 0 else 0.0
    angle_overflow_risk = bool(min_val < -0.01 or max_val > (np.pi + 0.01))

    # Check L2 unit norm
    norms = np.linalg.norm(X, axis=1) if len(X.shape) > 1 else np.abs(X)
    is_l2_normalized = bool(np.allclose(norms, 1.0, atol=0.08)) if X.size > 0 else False

    if normalization in ("minmax", "minmax_pi"):
        desc = "Scaled to [0, π] — optimal for Single-Qubit Ry/Rz rotations without phase wrapping."
    elif normalization == "norm2":
        desc = "L2 Unit Spherical Vectors — mathematically ready for Amplitude State Preparation."
    elif normalization == "zscore":
        desc = "Standardized (Zero Mean, Unit Std) — suitable for Kernel Hilbert space separation."
    elif normalization == "minmax_1":
        desc = "Scaled to [0, 1] — compact probabilistic interval."
    else:
        desc = "Raw feature values — rotation gates may experience periodic boundary wrap-around."

    return {
        "n_qubits_angle": n_features,
        "n_qubits_amplitude": n_qubits_amplitude,
        "hilbert_space_dim": hilbert_dim,
        "angle_overflow_risk": angle_overflow_risk,
        "l2_normalized": is_l2_normalized,
        "value_range_description": desc,
        "domain_min": round(min_val, 3),
        "domain_max": round(max_val, 3)
    }


def compute_summary_stats(X: np.ndarray, feature_names: List[str]) -> Dict[str, Any]:
    """Compute mean, std, min, max per feature."""
    stats = {}
    for i, name in enumerate(feature_names):
        col = X[:, i] if i < X.shape[1] else np.zeros(X.shape[0])
        stats[name] = {
            "min": round(float(np.min(col)), 3),
            "max": round(float(np.max(col)), 3),
            "mean": round(float(np.mean(col)), 3),
            "std": round(float(np.std(col)), 3)
        }
    return stats


def preview_csv(csv_text: str) -> Dict[str, Any]:
    """
    Parse the first chunk of a custom CSV and return column metadata, 
    sample rows, and auto-detected target candidates.
    """
    lines = [line for line in csv_text.strip().splitlines() if line.strip()]
    if not lines:
        raise ValueError("CSV content is empty")

    reader = csv.reader(lines)
    header = [h.strip() for h in next(reader) if h.strip()]
    if not header:
        raise ValueError("Could not detect valid CSV header")

    rows = []
    for r in reader:
        if r and any(cell.strip() for cell in r):
            rows.append(r)
        if len(rows) >= 15:
            break

    # Analyze column data types
    numeric_columns = []
    categorical_columns = []
    for col_idx, col_name in enumerate(header):
        is_num = True
        for row in rows:
            if col_idx < len(row) and row[col_idx].strip():
                try:
                    float(row[col_idx].strip())
                except ValueError:
                    is_num = False
                    break
        if is_num:
            numeric_columns.append(col_name)
        else:
            categorical_columns.append(col_name)

    # Suggest target column
    suggested_target = None
    target_candidates = ["target", "label", "class", "diagnosis", "outcome", "y", "status", "species"]
    for c in header:
        if c.lower() in target_candidates:
            suggested_target = c
            break
    if not suggested_target:
        # Check if last column or categorical column
        if categorical_columns:
            suggested_target = categorical_columns[-1]
        else:
            suggested_target = header[-1]

    # Sample rows formatted as dicts
    sample_preview = []
    for r in rows[:6]:
        row_dict = {}
        for idx, col in enumerate(header):
            row_dict[col] = r[idx].strip() if idx < len(r) else ""
        sample_preview.append(row_dict)

    return {
        "columns": header,
        "num_rows_estimated": len(lines) - 1,
        "numeric_columns": numeric_columns,
        "categorical_columns": categorical_columns,
        "suggested_target": suggested_target,
        "sample_rows": sample_preview
    }


def generate_dataset(
    dataset_type: str = "moons",
    n_samples: int = 100,
    noise: float = 0.1,
    n_features: int = 2,
    n_classes: int = 2,
    test_split: float = 0.3,
    normalization: str = "minmax",
    random_seed: int = 42,
) -> Dict[str, Any]:
    """
    Generate or load a dataset for QML experiments.
    Supported types:
      Synthetic: moons, circles, linear, blobs, xor, stripes
      Benchmarks: iris, breast_cancer, wine, digits
    """
    np.random.seed(random_seed)
    explained_var = None

    if dataset_type == "moons":
        X, y = make_moons(n_samples=n_samples, noise=noise, random_state=random_seed)
        feature_names = ["x₁ (Moon Arc)", "x₂ (Radial Dip)"]
    elif dataset_type == "circles":
        X, y = make_circles(n_samples=n_samples, noise=noise, factor=0.5, random_state=random_seed)
        feature_names = ["x₁ (Radius X)", "x₂ (Radius Y)"]
    elif dataset_type == "linear":
        X, y = make_classification(
            n_samples=n_samples, n_features=n_features, n_informative=n_features,
            n_redundant=0, n_classes=n_classes, random_state=random_seed
        )
        feature_names = [f"x_{i+1}" for i in range(n_features)]
    elif dataset_type == "blobs":
        X, y = make_blobs(
            n_samples=n_samples, n_features=n_features, centers=n_classes,
            cluster_std=noise * 5 + 0.5, random_state=random_seed
        )
        feature_names = [f"x_{i+1} (Cluster)" for i in range(n_features)]
    elif dataset_type == "xor":
        X = np.random.randn(n_samples, 2) * (noise + 0.3)
        centers = np.array([[1, 1], [-1, -1], [1, -1], [-1, 1]])
        labels = np.array([0, 0, 1, 1])
        idx = np.random.choice(4, n_samples)
        X += centers[idx]
        y = labels[idx]
        feature_names = ["x₁ (Parity Quadrant)", "x₂ (Sign Inversion)"]
    elif dataset_type == "stripes":
        n_per = n_samples // 2
        X_h = np.random.randn(n_per, 2)
        X_h[:, 1] = np.random.choice([-2, 0, 2], n_per) + noise * np.random.randn(n_per)
        y_h = np.zeros(n_per, dtype=int)
        X_v = np.random.randn(n_samples - n_per, 2)
        X_v[:, 0] = np.random.choice([-2, 0, 2], n_samples - n_per) + noise * np.random.randn(n_samples - n_per)
        y_v = np.ones(n_samples - n_per, dtype=int)
        X = np.vstack([X_h, X_v])
        y = np.concatenate([y_h, y_v])
        feature_names = ["x₁ (Stripe)", "x₂ (Stripe)"]
    elif dataset_type == "iris":
        data = load_iris()
        mask = data.target < 2  # Binary classification: setosa (0) vs versicolor (1)
        X_raw, y_raw = data.data[mask], data.target[mask]
        n_comp = min(n_features, 4)
        pca = PCA(n_components=n_comp)
        X = pca.fit_transform(X_raw)[:n_samples]
        y = y_raw[:n_samples]
        explained_var = float(np.sum(pca.explained_variance_ratio_))
        feature_names = [f"PC{i+1} ({round(float(var)*100, 1)}% var)" for i, var in enumerate(pca.explained_variance_ratio_)]
    elif dataset_type == "breast_cancer":
        data = load_breast_cancer()
        n_comp = min(n_features, 4)
        pca = PCA(n_components=n_comp)
        X = pca.fit_transform(data.data)[:n_samples]
        y = data.target[:n_samples]
        explained_var = float(np.sum(pca.explained_variance_ratio_))
        feature_names = [f"PC{i+1} ({round(float(var)*100, 1)}% var)" for i, var in enumerate(pca.explained_variance_ratio_)]
    elif dataset_type == "wine":
        data = load_wine()
        mask = data.target < 2  # Classes 0 and 1
        X_raw, y_raw = data.data[mask], data.target[mask]
        n_comp = min(n_features, 4)
        pca = PCA(n_components=n_comp)
        X = pca.fit_transform(X_raw)[:n_samples]
        y = y_raw[:n_samples]
        explained_var = float(np.sum(pca.explained_variance_ratio_))
        feature_names = [f"PC{i+1} ({round(float(var)*100, 1)}% var)" for i, var in enumerate(pca.explained_variance_ratio_)]
    elif dataset_type == "digits":
        data = load_digits()
        mask = (data.target == 0) | (data.target == 1)  # 0 vs 1 digits
        X_raw, y_raw = data.data[mask], data.target[mask]
        n_comp = min(n_features, 4)
        pca = PCA(n_components=n_comp)
        X = pca.fit_transform(X_raw)[:n_samples]
        y = y_raw[:n_samples]
        explained_var = float(np.sum(pca.explained_variance_ratio_))
        feature_names = [f"PC{i+1} ({round(float(var)*100, 1)}% var)" for i, var in enumerate(pca.explained_variance_ratio_)]
    else:
        raise ValueError(f"Unknown dataset type: {dataset_type}")

    # Apply mathematical normalization
    X = apply_normalization(X, normalization)

    # Shuffle
    perm = np.random.permutation(len(X))
    X, y = X[perm], y[perm]

    # Split
    n_test = max(1, int(len(X) * test_split))
    X_train, X_test = X[:-n_test], X[-n_test:]
    y_train, y_test = y[:-n_test], y[-n_test:]

    # Compute statistics and quantum readiness
    summary_stats = compute_summary_stats(X, feature_names)
    quantum_specs = compute_quantum_specs(X, y, normalization)

    # First 12 samples for live table preview
    raw_preview = []
    for i in range(min(12, len(X))):
        sample = {
            "index": i,
            "class": int(y[i]),
            "split": "Test" if i >= (len(X) - n_test) else "Train"
        }
        for f_idx, fname in enumerate(feature_names):
            sample[fname] = round(float(X[i][f_idx]), 3) if f_idx < X.shape[1] else 0.0
        raw_preview.append(sample)

    return {
        "dataset_type": dataset_type,
        "X": X.tolist(),
        "y": y.tolist(),
        "X_train": X_train.tolist(),
        "y_train": y_train.tolist(),
        "X_test": X_test.tolist(),
        "y_test": y_test.tolist(),
        "feature_names": feature_names,
        "class_labels": [int(c) for c in np.unique(y)],
        "n_samples": len(X),
        "n_features": X.shape[1],
        "n_classes": len(np.unique(y)),
        "n_train": len(X_train),
        "n_test": len(X_test),
        "class_distribution": {
            str(c): int((y == c).sum()) for c in np.unique(y)
        },
        "summary_stats": summary_stats,
        "quantum_specs": quantum_specs,
        "explained_variance_ratio": explained_var,
        "raw_preview": raw_preview
    }


def parse_custom_csv(
    csv_text: str,
    target_column: Optional[str] = None,
    feature_columns: Optional[List[str]] = None,
    normalization: str = "minmax",
    dim_reduction: str = "pca",
    n_components: int = 2,
    test_split: float = 0.3
) -> Dict[str, Any]:
    """
    Parse a custom user CSV string, extract selected features & target,
    apply dimensional reduction & normalization, and return complete metadata.
    """
    lines = [l for l in csv_text.strip().splitlines() if l.strip()]
    if not lines:
        raise ValueError("CSV content is empty")

    reader = csv.reader(lines)
    header = [h.strip() for h in next(reader) if h.strip()]

    rows = []
    for r in reader:
        if r and any(cell.strip() for cell in r):
            rows.append(r)

    if not rows:
        raise ValueError("No data rows found in CSV")

    # Determine target column index
    target_idx = len(header) - 1
    if target_column and target_column in header:
        target_idx = header.index(target_column)

    # Determine feature column indices
    if feature_columns:
        feature_indices = [header.index(col) for col in feature_columns if col in header and col != header[target_idx]]
    else:
        feature_indices = [i for i in range(len(header)) if i != target_idx]

    if not feature_indices:
        raise ValueError("No valid numeric feature columns selected")

    X_list = []
    y_list = []
    label_map = {}
    next_label_id = 0

    for r in rows:
        try:
            feats = [float(r[i]) for i in feature_indices]
            raw_label = r[target_idx].strip()
            if raw_label not in label_map:
                label_map[raw_label] = next_label_id
                next_label_id += 1
            X_list.append(feats)
            y_list.append(label_map[raw_label])
        except (ValueError, IndexError):
            continue

    if len(X_list) < 4:
        raise ValueError("Insufficient valid numeric rows parsed from CSV (minimum 4 valid rows required)")

    X_arr = np.array(X_list, dtype=np.float64)
    y_arr = np.array(y_list, dtype=np.int64)

    explained_var = None
    feature_names = [header[i] for i in feature_indices]

    # Dimensionality reduction
    if dim_reduction == "pca" and X_arr.shape[1] > n_components:
        pca = PCA(n_components=n_components)
        X_arr = pca.fit_transform(X_arr)
        explained_var = float(np.sum(pca.explained_variance_ratio_))
        feature_names = [f"PC{i+1} ({round(float(v)*100, 1)}% var)" for i, v in enumerate(pca.explained_variance_ratio_)]
    elif dim_reduction == "select" and X_arr.shape[1] > n_components:
        X_arr = X_arr[:, :n_components]
        feature_names = feature_names[:n_components]

    # Apply mathematical normalization
    X_arr = apply_normalization(X_arr, normalization)

    # Train / test split
    perm = np.random.permutation(len(X_arr))
    X_arr, y_arr = X_arr[perm], y_arr[perm]
    n_test = max(1, int(len(X_arr) * test_split))

    X_train, X_test = X_arr[:-n_test], X_arr[-n_test:]
    y_train, y_test = y_arr[:-n_test], y_arr[-n_test:]

    summary_stats = compute_summary_stats(X_arr, feature_names)
    quantum_specs = compute_quantum_specs(X_arr, y_arr, normalization)

    raw_preview = []
    for i in range(min(12, len(X_arr))):
        sample = {
            "index": i,
            "class": int(y_arr[i]),
            "split": "Test" if i >= (len(X_arr) - n_test) else "Train"
        }
        for f_idx, fname in enumerate(feature_names):
            sample[fname] = round(float(X_arr[i][f_idx]), 3) if f_idx < X_arr.shape[1] else 0.0
        raw_preview.append(sample)

    return {
        "dataset_type": "custom_csv",
        "X": X_arr.tolist(),
        "y": y_arr.tolist(),
        "X_train": X_train.tolist(),
        "y_train": y_train.tolist(),
        "X_test": X_test.tolist(),
        "y_test": y_test.tolist(),
        "feature_names": feature_names,
        "class_labels": [int(c) for c in np.unique(y_arr)],
        "n_samples": len(X_arr),
        "n_features": X_arr.shape[1],
        "n_classes": len(label_map),
        "n_train": len(X_train),
        "n_test": len(X_test),
        "label_mapping": label_map,
        "class_distribution": {
            str(c): int((y_arr == c).sum()) for c in np.unique(y_arr)
        },
        "summary_stats": summary_stats,
        "quantum_specs": quantum_specs,
        "explained_variance_ratio": explained_var,
        "raw_preview": raw_preview
    }


def get_available_datasets() -> List[Dict[str, Any]]:
    """List available dataset types including classical benchmarks."""
    return [
        {"id": "moons", "name": "Two Moons", "category": "synthetic", "description": "Nonlinear interleaved crescents", "default_features": 2},
        {"id": "circles", "name": "Concentric Circles", "category": "synthetic", "description": "Radially inseparable concentric rings", "default_features": 2},
        {"id": "xor", "name": "Quantum XOR", "category": "synthetic", "description": "Parity problem requiring non-linear quantum kernel", "default_features": 2},
        {"id": "blobs", "name": "Gaussian Blobs", "category": "synthetic", "description": "Multi-cluster isotropic Gaussian distributions", "default_features": 2},
        {"id": "linear", "name": "Linearly Separable", "category": "synthetic", "description": "Hyperplane separable classical benchmark", "default_features": 2},
        {"id": "iris", "name": "Iris Flower", "category": "benchmark", "description": "Classic Fisher Iris dataset (Setosa vs Versicolor, PCA reduced)", "default_features": 2},
        {"id": "breast_cancer", "name": "Breast Cancer (WDBC)", "category": "benchmark", "description": "Diagnostic Wisconsin breast cancer dataset (Malignant vs Benign, PCA reduced)", "default_features": 2},
        {"id": "wine", "name": "Wine Recognition", "category": "benchmark", "description": "Chemical analysis of Italian wines (PCA reduced)", "default_features": 2},
        {"id": "digits", "name": "Digits (0 vs 1)", "category": "benchmark", "description": "Optical recognition of handwritten 8x8 digits (0 vs 1, PCA reduced)", "default_features": 2},
    ]
