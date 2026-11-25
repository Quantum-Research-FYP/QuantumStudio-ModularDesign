"""
Analysis Engine Router — Training metrics, confusion matrices, classification reports.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import numpy as np

router = APIRouter()


class MetricsRequest(BaseModel):
    y_true: List[int]
    y_pred: List[int]
    loss_history: Optional[List[float]] = None


@router.post("/metrics")
async def api_compute_metrics(req: MetricsRequest):
    """Compute classification metrics."""
    try:
        from sklearn.metrics import (
            accuracy_score, f1_score, precision_score, recall_score,
            confusion_matrix, classification_report
        )

        y_true = np.array(req.y_true)
        y_pred = np.array(req.y_pred)

        cm = confusion_matrix(y_true, y_pred)
        report = classification_report(y_true, y_pred, output_dict=True)

        result = {
            "accuracy": float(accuracy_score(y_true, y_pred)),
            "f1_weighted": float(f1_score(y_true, y_pred, average='weighted')),
            "precision_weighted": float(precision_score(y_true, y_pred, average='weighted')),
            "recall_weighted": float(recall_score(y_true, y_pred, average='weighted')),
            "confusion_matrix": cm.tolist(),
            "classification_report": report,
            "n_samples": len(y_true),
            "n_classes": len(np.unique(y_true)),
        }

        if req.loss_history:
            result["loss_history"] = req.loss_history
            result["final_loss"] = req.loss_history[-1]
            result["loss_reduction"] = req.loss_history[0] - req.loss_history[-1] if len(req.loss_history) > 1 else 0

        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
