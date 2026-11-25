"""
Classical ML Engine — Classical machine learning baselines for benchmarking.

Provides classical models (SVM, Random Forest, KNN, Neural Network)
to compare against quantum ML models.
"""
import numpy as np
from typing import List, Dict, Any, Optional
from sklearn.svm import SVC
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.neighbors import KNeighborsClassifier
from sklearn.neural_network import MLPClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import (
    accuracy_score, f1_score, precision_score, recall_score,
    confusion_matrix, classification_report
)
from sklearn.model_selection import cross_val_score
import time


def get_available_models() -> List[Dict[str, str]]:
    """Return list of available classical models."""
    return [
        {"id": "svm_rbf", "name": "SVM (RBF Kernel)", "category": "kernel"},
        {"id": "svm_linear", "name": "SVM (Linear Kernel)", "category": "kernel"},
        {"id": "svm_poly", "name": "SVM (Polynomial Kernel)", "category": "kernel"},
        {"id": "random_forest", "name": "Random Forest", "category": "ensemble"},
        {"id": "gradient_boosting", "name": "Gradient Boosting", "category": "ensemble"},
        {"id": "knn", "name": "K-Nearest Neighbors", "category": "instance"},
        {"id": "mlp", "name": "Neural Network (MLP)", "category": "neural"},
    ]


def _build_model(model_id: str, **kwargs):
    """Build a sklearn model from its ID."""
    models = {
        "svm_rbf": SVC(kernel='rbf', probability=True),
        "svm_linear": SVC(kernel='linear', probability=True),
        "svm_poly": SVC(kernel='poly', degree=3, probability=True),
        "random_forest": RandomForestClassifier(n_estimators=100, random_state=42),
        "gradient_boosting": GradientBoostingClassifier(n_estimators=100, random_state=42),
        "knn": KNeighborsClassifier(n_neighbors=5),
        "mlp": MLPClassifier(hidden_layer_sizes=(64, 32), max_iter=500, random_state=42),
    }
    if model_id not in models:
        raise ValueError(f"Unknown model: {model_id}")
    return models[model_id]


def train_classical_model(
    model_id: str,
    X_train: List[List[float]],
    y_train: List[int],
    X_test: Optional[List[List[float]]] = None,
    y_test: Optional[List[int]] = None,
) -> Dict[str, Any]:
    """Train a classical ML model and return metrics."""
    X_tr = np.array(X_train)
    y_tr = np.array(y_train)

    scaler = StandardScaler()
    X_tr_s = scaler.fit_transform(X_tr)

    model = _build_model(model_id)

    start_time = time.time()
    model.fit(X_tr_s, y_tr)
    train_time = time.time() - start_time

    train_pred = model.predict(X_tr_s)
    train_acc = float(accuracy_score(y_tr, train_pred))

    result = {
        "model_id": model_id,
        "model_name": next(m["name"] for m in get_available_models() if m["id"] == model_id),
        "train_accuracy": train_acc,
        "train_f1": float(f1_score(y_tr, train_pred, average='weighted')),
        "train_time_seconds": train_time,
        "n_train_samples": len(X_train),
        "n_features": X_tr.shape[1],
    }

    if X_test is not None and y_test is not None:
        X_te = np.array(X_test)
        y_te = np.array(y_test)
        X_te_s = scaler.transform(X_te)

        start_time = time.time()
        test_pred = model.predict(X_te_s)
        inference_time = time.time() - start_time

        result["test_accuracy"] = float(accuracy_score(y_te, test_pred))
        result["test_f1"] = float(f1_score(y_te, test_pred, average='weighted'))
        result["test_precision"] = float(precision_score(y_te, test_pred, average='weighted'))
        result["test_recall"] = float(recall_score(y_te, test_pred, average='weighted'))
        result["confusion_matrix"] = confusion_matrix(y_te, test_pred).tolist()
        result["predictions"] = test_pred.tolist()
        result["inference_time_seconds"] = inference_time
        result["n_test_samples"] = len(X_test)

    # Cross-validation
    try:
        cv_scores = cross_val_score(model, X_tr_s, y_tr, cv=min(5, len(y_tr)), scoring='accuracy')
        result["cv_accuracy_mean"] = float(cv_scores.mean())
        result["cv_accuracy_std"] = float(cv_scores.std())
    except Exception:
        pass

    return result


def run_benchmark(
    X_train: List[List[float]],
    y_train: List[int],
    X_test: List[List[float]],
    y_test: List[int],
    model_ids: Optional[List[str]] = None,
) -> Dict[str, Any]:
    """Run all classical models and return comparison."""
    if model_ids is None:
        model_ids = [m["id"] for m in get_available_models()]

    results = []
    for mid in model_ids:
        try:
            result = train_classical_model(mid, X_train, y_train, X_test, y_test)
            results.append(result)
        except Exception as e:
            results.append({
                "model_id": mid,
                "error": str(e),
            })

    # Sort by test accuracy
    results.sort(key=lambda r: r.get("test_accuracy", 0), reverse=True)

    return {
        "results": results,
        "best_model": results[0]["model_id"] if results else None,
        "best_accuracy": results[0].get("test_accuracy", 0) if results else 0,
        "n_models": len(results),
    }
