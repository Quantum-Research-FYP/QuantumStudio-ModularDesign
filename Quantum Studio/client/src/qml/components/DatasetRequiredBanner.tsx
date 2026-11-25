import React, { useState } from 'react';
import { Database, Zap, ArrowRight, Sparkles, Layers } from 'lucide-react';

interface DatasetRequiredBannerProps {
  onLoadDefaultDataset: () => Promise<void> | void;
  onGoToDataLab: () => void;
  labName?: string;
}

export const DatasetRequiredBanner: React.FC<DatasetRequiredBannerProps> = ({
  onLoadDefaultDataset,
  onGoToDataLab,
  labName = 'This laboratory'
}) => {
  const [loading, setLoading] = useState(false);

  const handleQuickLoad = async () => {
    setLoading(true);
    try {
      await onLoadDefaultDataset();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dataset-required-card glass-panel">
      <div className="dataset-required-header">
        <div className="dataset-required-badge">
          <Database size={16} />
          <span>Active Dataset Required</span>
        </div>
        <span className="dataset-required-tag">Pipeline Prerequisite</span>
      </div>

      <div className="dataset-required-content">
        <div className="dataset-required-icon-box">
          <Layers size={32} />
        </div>
        <div className="dataset-required-text">
          <h3 className="dataset-required-title">No Quantum Dataset Loaded</h3>
          <p className="dataset-required-desc">
            {labName} requires input feature vectors to map onto Hilbert space coordinates and compute quantum expectations.
            You can immediately load the standard 2-qubit Moons benchmark or upload your own CSV data.
          </p>
          <div className="dataset-required-actions">
            <button
              className="btn btn-primary"
              onClick={handleQuickLoad}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="spinner-sm" />
                  <span>Generating Benchmark...</span>
                </>
              ) : (
                <>
                  <Zap size={15} />
                  <span>Load Default Moons (2 Qubits, 120 Pts)</span>
                </>
              )}
            </button>

            <button
              className="btn btn-secondary"
              onClick={onGoToDataLab}
            >
              <span>Go to Data Lab (Custom CSV & Benchmarks)</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>

      <div className="dataset-required-footer">
        <Sparkles size={14} style={{ color: 'var(--amber)' }} />
        <span>Quantum Tip: Data normalization to [0, π] or [-1, 1] is automatically applied to prevent angle periodicity overflow.</span>
      </div>
    </div>
  );
};
