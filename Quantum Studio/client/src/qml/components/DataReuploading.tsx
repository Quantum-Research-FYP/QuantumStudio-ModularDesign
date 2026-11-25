import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { ReuploadingComparisonResponse, DatasetResponse } from '../types';
import { RefreshCw, Play, Layers, TrendingUp, ShieldAlert, Award, Zap } from 'lucide-react';

interface DataReuploadingProps {
  dataset: DatasetResponse | null;
}

export const DataReuploading: React.FC<DataReuploadingProps> = ({ dataset }) => {
  const [layers, setLayers] = useState<number>(3);
  const [epochs, setEpochs] = useState<number>(30);
  const [loading, setLoading] = useState<boolean>(false);
  const [comparison, setComparison] = useState<ReuploadingComparisonResponse | null>(null);

  const handleRunComparison = async () => {
    setLoading(true);
    const trainX = dataset?.train_X || [[0.1, 0.2], [0.3, 0.4]];
    const trainY = dataset?.train_y || [0, 1];
    const testX = dataset?.test_X || [[0.5, 0.6]];
    const testY = dataset?.test_y || [1];

    const res = await api.compareReuploading(trainX, trainY, testX, testY, 2, layers, epochs);
    setComparison(res);
    setLoading(false);
  };

  useEffect(() => {
    handleRunComparison();
  }, [layers]);

  return (
    <div className="grid-sidebar">
      {/* Controls Sidebar */}
      <div className="glass-panel">
        <div className="panel-header">
          <div className="panel-title">
            <Layers size={18} style={{ color: 'var(--primary)' }} />
            <span>Data Re-Uploading Study</span>
          </div>
        </div>

        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem', lineHeight: '1.5' }}>
          Interleave feature maps and trainable ansatz layers to expand the model's Fourier frequency spectrum on few qubits.
        </p>

        <div className="form-group">
          <div className="slider-label-row">
            <span>Re-Uploading Repetitions (L)</span>
            <span className="slider-val-badge">{layers} Layers</span>
          </div>
          <input 
            type="range"
            min="2"
            max="6"
            className="range-slider"
            value={layers}
            onChange={(e) => setLayers(Number(e.target.value))}
          />
        </div>

        <div className="form-group">
          <div className="slider-label-row">
            <span>Optimization Budget</span>
            <span className="slider-val-badge">{epochs} Epochs</span>
          </div>
          <input 
            type="range"
            min="15"
            max="60"
            step="5"
            className="range-slider"
            value={epochs}
            onChange={(e) => setEpochs(Number(e.target.value))}
          />
        </div>

        <button 
          className="btn btn-primary"
          style={{ width: '100%', marginTop: '0.5rem' }}
          onClick={handleRunComparison}
          disabled={loading}
        >
          {loading ? <RefreshCw size={16} className="animate-spin" /> : <Play size={16} />}
          <span>{loading ? 'Evaluating Interleaved Layers...' : 'Run Architecture Comparison'}</span>
        </button>

        {comparison && (
          <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(0, 245, 212, 0.05)', borderRadius: '8px', border: '1px solid rgba(0, 245, 212, 0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary)', fontWeight: 600, fontSize: '0.85rem' }}>
              <Award size={16} />
              <span>Scientific Finding</span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '0.4rem', lineHeight: '1.4' }}>
              {comparison.scientific_takeaway}
            </p>
          </div>
        )}
      </div>

      {/* Comparison Results & Curves */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Head-to-Head Cards */}
        {comparison && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            {/* Standard VQC */}
            <div className="glass-panel" style={{ borderLeft: '4px solid var(--accent)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.05rem', color: 'var(--color-text-primary)' }}>Standard VQC</h3>
                  <span className="tag-chip">Single Encoding Layer</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent)' }}>
                    {comparison.standard_vqc.final_test_accuracy}%
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Test Accuracy</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', fontSize: '0.8rem' }}>
                <div className="metric-card">
                  <span className="metric-card-label">Circuit Depth</span>
                  <span className="metric-card-value">{comparison.standard_vqc.circuit_depth}</span>
                </div>
                <div className="metric-card">
                  <span className="metric-card-label">Parameters (θ)</span>
                  <span className="metric-card-value">{comparison.standard_vqc.parameter_count}</span>
                </div>
                <div className="metric-card">
                  <span className="metric-card-label">CNOT Gates</span>
                  <span className="metric-card-value">{comparison.standard_vqc.two_qubit_gates}</span>
                </div>
                <div className="metric-card">
                  <span className="metric-card-label">Noise Sensitivity</span>
                  <span className="metric-card-value" style={{ color: 'var(--emerald)' }}>{comparison.standard_vqc.noise_sensitivity}/100</span>
                </div>
              </div>
            </div>

            {/* Data Re-Uploading */}
            <div className="glass-panel" style={{ borderLeft: '4px solid var(--primary)', background: 'var(--color-primary-soft)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.05rem', color: 'var(--color-text-primary)' }}>Data Re-Uploading VQC</h3>
                  <span className="tag-chip primary">{layers} Interleaved Layers</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary)' }}>
                    {comparison.data_reuploading.final_test_accuracy}%
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Test Accuracy</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', fontSize: '0.8rem' }}>
                <div className="metric-card">
                  <span className="metric-card-label">Circuit Depth</span>
                  <span className="metric-card-value">{comparison.data_reuploading.circuit_depth}</span>
                </div>
                <div className="metric-card">
                  <span className="metric-card-label">Parameters (θ)</span>
                  <span className="metric-card-value">{comparison.data_reuploading.parameter_count}</span>
                </div>
                <div className="metric-card">
                  <span className="metric-card-label">CNOT Gates</span>
                  <span className="metric-card-value">{comparison.data_reuploading.two_qubit_gates}</span>
                </div>
                <div className="metric-card">
                  <span className="metric-card-label">Noise Sensitivity</span>
                  <span className="metric-card-value" style={{ color: 'var(--coral)' }}>{comparison.data_reuploading.noise_sensitivity}/100</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Training Convergence Curve */}
        {comparison && (
          <div className="glass-panel">
            <div className="panel-header">
              <div className="panel-title">
                <TrendingUp size={18} style={{ color: 'var(--primary)' }} />
                <span>Empirical Loss Trajectory Comparison</span>
              </div>
              <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--primary)' }}>
                  <span style={{ width: '12px', height: '3px', background: 'var(--primary)' }}></span>
                  <span>Data Re-Uploading</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--accent)' }}>
                  <span style={{ width: '12px', height: '3px', background: 'var(--accent)' }}></span>
                  <span>Standard VQC</span>
                </div>
              </div>
            </div>

            <div style={{ width: '100%', height: '280px', background: 'var(--color-surface-soft)', borderRadius: '12px', border: '1px solid var(--color-border)', padding: '1rem' }}>
              <svg width="100%" height="100%" viewBox="0 0 500 240">
                <line x1="40" y1="20" x2="480" y2="20" stroke="var(--color-border)" />
                <line x1="40" y1="120" x2="480" y2="120" stroke="var(--color-border)" />
                <line x1="40" y1="220" x2="480" y2="220" stroke="var(--color-border)" />

                {/* Standard VQC Loss Line */}
                <path
                  d={comparison.standard_vqc.history.map((h, i) => {
                    const x = 40 + (i / (comparison.standard_vqc.history.length - 1)) * 440;
                    const y = 220 - (h.loss / 0.8) * 190;
                    return `${i === 0 ? 'M' : 'L'} ${x} ${Math.max(20, Math.min(220, y))}`;
                  }).join(' ')}
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth="2.5"
                  strokeDasharray="4 4"
                />

                {/* Data Re-Uploading Loss Line */}
                <path
                  d={comparison.data_reuploading.history.map((h, i) => {
                    const x = 40 + (i / (comparison.data_reuploading.history.length - 1)) * 440;
                    const y = 220 - (h.loss / 0.8) * 190;
                    return `${i === 0 ? 'M' : 'L'} ${x} ${Math.max(20, Math.min(220, y))}`;
                  }).join(' ')}
                  fill="none"
                  stroke="var(--primary)"
                  strokeWidth="3"
                />
              </svg>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
