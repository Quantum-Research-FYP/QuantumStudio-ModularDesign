import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { ExperimentEntity } from '../types';
import { Database, Play, Plus, Download, Grid, RefreshCw, CheckCircle, Clock, FileJson, Award } from 'lucide-react';

export const ExperimentManager: React.FC = () => {
  const [experiments, setExperiments] = useState<ExperimentEntity[]>([]);
  const [selectedExp, setSelectedExp] = useState<ExperimentEntity | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [showSweepModal, setShowSweepModal] = useState<boolean>(false);
  const [sweepResult, setSweepResult] = useState<any | null>(null);

  const loadExperiments = async () => {
    setLoading(true);
    const list = await api.listExperiments();
    setExperiments(list);
    if (list.length > 0 && !selectedExp) setSelectedExp(list[0]);
    setLoading(false);
  };

  useEffect(() => {
    loadExperiments();
  }, []);

  const handleRunExp = async (id: string) => {
    setLoading(true);
    const updated = await api.runExperiment(id);
    setExperiments(prev => prev.map(e => e.id === id ? updated : e));
    setSelectedExp(updated);
    setLoading(false);
  };

  const handleDownloadPackage = async (id: string) => {
    const pkg = await api.getReproducibilityPackage(id);
    const blob = new Blob([JSON.stringify(pkg, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reproducibility-package-${id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleGenerateSweep = async () => {
    setLoading(true);
    const res = await api.generateGridSweep([2, 4, 6], [1, 2, 4], ['EfficientSU2', 'RealAmplitudes'], ['COBYLA', 'SPSA']);
    setSweepResult(res);
    setLoading(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Action Bar */}
      <div className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', color: 'var(--color-text-primary)' }}>Experiment Runs</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Track, inspect, and reproduce QML training runs and parameter sweeps.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button 
            className="btn btn-secondary btn-sm"
            onClick={handleGenerateSweep}
            disabled={loading}
          >
            <Grid size={14} />
            <span>Generate Parameter Grid Sweep</span>
          </button>
          <button 
            className="btn btn-primary btn-sm"
            onClick={loadExperiments}
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh Queue</span>
          </button>
        </div>
      </div>

      {/* Grid Sweep Preview Banner if generated */}
      {sweepResult && (
        <div className="glass-panel" style={{ borderLeft: '4px solid var(--primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', fontWeight: 600 }}>
              <Grid size={18} />
              <span>Parameter Sweep Initialized: {sweepResult.total_combinations} Total Configurations</span>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => setSweepResult(null)}>Dismiss</button>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginTop: '0.5rem' }}>
            {sweepResult.sweep_summary}
          </p>
        </div>
      )}

      {/* Main Table & Deep Dive Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '1.5rem' }}>
        {/* Experiments Table */}
        <div className="glass-panel">
          <div className="panel-header">
            <div className="panel-title">
              <Database size={18} style={{ color: 'var(--primary)' }} />
              <span>Experiment Repository</span>
            </div>
            <span className="tag-chip">{experiments.length} Active Records</span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.75rem' }}>Experiment Name</th>
                  <th style={{ padding: '0.75rem' }}>Model / Qubits</th>
                  <th style={{ padding: '0.75rem' }}>Status</th>
                  <th style={{ padding: '0.75rem' }}>Test Acc</th>
                  <th style={{ padding: '0.75rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {experiments.map((exp) => {
                  const isSelected = selectedExp?.id === exp.id;
                  return (
                    <tr
                      key={exp.id}
                      style={{
                        borderBottom: '1px solid var(--border-subtle)',
                        background: isSelected ? 'rgba(0, 245, 212, 0.08)' : 'transparent',
                        cursor: 'pointer'
                      }}
                      onClick={() => setSelectedExp(exp)}
                    >
                      <td style={{ padding: '0.75rem' }}>
                        <div style={{ fontWeight: 600, color: isSelected ? 'var(--primary)' : 'var(--color-text-primary)' }}>{exp.name}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{exp.id}</div>
                      </td>
                      <td style={{ padding: '0.75rem', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                        {exp.model_type} ({exp.n_qubits}Q, L={exp.depth})
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <span className={`tag-chip ${exp.status === 'COMPLETED' ? 'primary' : 'purple'}`}>
                          {exp.status}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem', fontWeight: 700, color: 'var(--primary)' }}>
                        {exp.metrics ? `${exp.metrics.test_accuracy}%` : '─'}
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadPackage(exp.id);
                          }}
                          title="Download Reproducibility Package"
                        >
                          <Download size={12} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Experiment Inspector & Reproducibility Export */}
        {selectedExp && (
          <div className="glass-panel" style={{ borderLeft: '4px solid var(--primary)' }}>
            <div className="panel-header">
              <div className="panel-title">
                <FileJson size={18} style={{ color: 'var(--primary)' }} />
                <span>Experiment Details</span>
              </div>
              <span className="tag-chip primary">{selectedExp.id}</span>
            </div>

            <h3 style={{ fontSize: '1.1rem', color: 'var(--color-text-primary)', marginTop: '0.5rem' }}>{selectedExp.name}</h3>

            <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <strong>Research Question:</strong> {selectedExp.research_question}
            </div>
            <div style={{ marginTop: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <strong>Hypothesis:</strong> {selectedExp.hypothesis}
            </div>

            {selectedExp.metrics && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', marginTop: '1.25rem' }}>
                <div className="metric-card">
                  <span className="metric-card-label">Test Accuracy</span>
                  <span className="metric-card-value" style={{ color: 'var(--primary)' }}>{selectedExp.metrics.test_accuracy}%</span>
                </div>
                <div className="metric-card">
                  <span className="metric-card-label">Final Loss</span>
                  <span className="metric-card-value">{selectedExp.metrics.final_loss}</span>
                </div>
                <div className="metric-card">
                  <span className="metric-card-label">Gradient Variance</span>
                  <span className="metric-card-value" style={{ fontSize: '1rem', fontFamily: 'var(--font-mono)' }}>{selectedExp.metrics.gradient_variance}</span>
                </div>
                <div className="metric-card">
                  <span className="metric-card-label">CNOT Gates</span>
                  <span className="metric-card-value">{selectedExp.metrics.two_qubit_gates}</span>
                </div>
              </div>
            )}

            <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button 
                className="btn btn-primary"
                onClick={() => handleDownloadPackage(selectedExp.id)}
              >
                <Download size={14} />
                <span>Export Reproducibility Package (JSON + OpenQASM)</span>
              </button>

              {selectedExp.status !== 'COMPLETED' && (
                <button 
                  className="btn btn-secondary"
                  onClick={() => handleRunExp(selectedExp.id)}
                  disabled={loading}
                >
                  <Play size={14} />
                  <span>Execute Experiment on Backend</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
