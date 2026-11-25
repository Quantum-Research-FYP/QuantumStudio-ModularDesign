import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { EncodingCostResponse, EncodingCostItem, DatasetResponse, TabType } from '../types';
import { Cpu, Layers, ShieldAlert, Award, Sliders, CheckCircle, Info, RefreshCw, ArrowRight, Zap } from 'lucide-react';

interface EncodingLabProps {
  dataset: DatasetResponse | null;
  onNavigateTab?: (tab: TabType) => void;
  onQuickLoadDataset?: () => void;
}

export const EncodingLab: React.FC<EncodingLabProps> = ({ 
  dataset,
  onNavigateTab,
  onQuickLoadDataset
}) => {
  const [featureSample, setFeatureSample] = useState<number[]>([0.52, 0.84]);
  const [costData, setCostData] = useState<EncodingCostResponse | null>(null);
  const [selectedEncoding, setSelectedEncoding] = useState<string>('angle');
  const [filterCategory, setFilterCategory] = useState<'all' | 'single' | 'compression' | 'kernels'>('all');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (dataset?.X && dataset.X.length > 0) {
      setFeatureSample(dataset.X[0].slice(0, 4));
    }
  }, [dataset]);

  const loadCostComparison = async () => {
    setLoading(true);
    const res = await api.compareEncodings(featureSample);
    setCostData(res);
    setLoading(false);
  };

  useEffect(() => {
    loadCostComparison();
  }, [featureSample]);

  const activeEnc = costData?.encodings.find(e => e.id === selectedEncoding) || costData?.encodings[0];

  const filteredEncodings = (costData?.encodings || []).filter(enc => {
    if (filterCategory === 'single') return ['angle', 'angle_rx', 'angle_rz', 'phase'].includes(enc.id);
    if (filterCategory === 'compression') return ['amplitude', 'dense', 'basis'].includes(enc.id);
    if (filterCategory === 'kernels') return ['zz_feature_map', 'z_feature_map', 'pauli_feature_map', 'iqp', 'hamiltonian'].includes(enc.id);
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="grid-sidebar">
        {/* Configuration Sidebar */}
        <div className="glass-panel">
          <div className="panel-header">
            <div className="panel-title">
              <Layers size={18} style={{ color: 'var(--primary)' }} />
              <span>Encoding Cost Laboratory</span>
            </div>
          </div>

          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem', lineHeight: '1.5' }}>
            Evaluate empirical quantum hardware overheads across all 12 quantum encoding protocols and feature maps before model execution.
          </p>

          {/* Dataset Status Banner */}
          <div style={{ marginBottom: '1.25rem' }}>
            {dataset?.X ? (
              <div className="status-badge" style={{ width: '100%', justifyContent: 'flex-start', background: 'var(--color-green-soft)', borderColor: 'var(--color-green-border)', color: 'var(--color-green-text)' }}>
                <CheckCircle size={14} />
                <span>Linked to Active Dataset Sample ({dataset.feature_names.join(', ')})</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <div className="status-badge" style={{ width: '100%', justifyContent: 'space-between' }}>
                  <span>Using Default 2D Sample</span>
                  {onQuickLoadDataset && (
                    <button 
                      className="btn btn-primary btn-xs"
                      onClick={onQuickLoadDataset}
                    >
                      <Zap size={12} />
                      <span>Load Dataset</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Active Feature Vector (x)</label>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              {featureSample.map((val, idx) => (
                <div key={idx} style={{ flex: 1 }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>x_{idx + 1}</span>
                  <input 
                    type="number"
                    step="0.05"
                    className="form-input"
                    value={val}
                    onChange={(e) => {
                      const newVals = [...featureSample];
                      newVals[idx] = parseFloat(e.target.value) || 0;
                      setFeatureSample(newVals);
                    }}
                  />
                </div>
              ))}
            </div>
            <button 
              className="btn btn-secondary btn-sm"
              style={{ width: '100%', marginTop: '0.5rem' }}
              onClick={loadCostComparison}
              disabled={loading}
            >
              {loading ? <RefreshCw size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              <span>Recompute Hardware Cost</span>
            </button>
          </div>

          {costData && (
            <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary)', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                <Award size={16} />
                <span>Optimal NISQ Recommendation</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-main)', lineHeight: '1.4' }}>
                <strong>{costData.optimal_for_nisq}</strong>: {costData.synthesis_summary}
              </p>
            </div>
          )}
        </div>

        {/* Comparison Table / Matrix */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-panel">
            <div className="panel-header" style={{ flexWrap: 'wrap', gap: '0.6rem' }}>
              <div className="panel-title">
                <Sliders size={18} style={{ color: 'var(--secondary)' }} />
                <span>Hardware Overhead Comparison Matrix</span>
                <span className="tag-chip primary" style={{ fontSize: '0.65rem', marginLeft: '0.5rem' }}>
                  {filteredEncodings.length} of {costData?.encodings.length || 12} Protocols
                </span>
              </div>

              {/* Category Filter Pills */}
              <div style={{ display: 'flex', gap: '0.3rem', background: 'var(--color-surface-soft)', padding: '0.2rem', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                <button 
                  className={`btn btn-xs ${filterCategory === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}
                  onClick={() => setFilterCategory('all')}
                >
                  All ({costData?.encodings.length || 12})
                </button>
                <button 
                  className={`btn btn-xs ${filterCategory === 'single' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}
                  onClick={() => setFilterCategory('single')}
                >
                  Angle Rotations (4)
                </button>
                <button 
                  className={`btn btn-xs ${filterCategory === 'compression' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}
                  onClick={() => setFilterCategory('compression')}
                >
                  Compression (3)
                </button>
                <button 
                  className={`btn btn-xs ${filterCategory === 'kernels' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}
                  onClick={() => setFilterCategory('kernels')}
                >
                  Entangled Kernels (5)
                </button>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Encoding Protocol</th>
                    <th>Qubits</th>
                    <th>Depth</th>
                    <th>1Q Gates</th>
                    <th>2Q CNOTs</th>
                    <th>Noise Risk</th>
                    <th>Select</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEncodings.map((enc) => {
                    const isSelected = enc.id === selectedEncoding;
                    return (
                      <tr 
                        key={enc.id} 
                        style={{ background: isSelected ? 'var(--color-primary-soft)' : 'transparent', cursor: 'pointer' }}
                        onClick={() => setSelectedEncoding(enc.id)}
                      >
                        <td>
                          <strong>{enc.name}</strong>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{enc.description}</div>
                        </td>
                        <td>{enc.qubits}</td>
                        <td>{enc.depth}</td>
                        <td>{enc.single_qubit_gates}</td>
                        <td>
                          <span style={{ color: enc.two_qubit_gates > 0 ? 'var(--coral)' : 'var(--emerald)', fontWeight: 600 }}>
                            {enc.two_qubit_gates}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <div className="compare-bar-track" style={{ width: '50px' }}>
                              <div 
                                className="compare-bar-fill" 
                                style={{ 
                                  width: `${enc.noise_exposure}%`, 
                                  background: enc.noise_exposure > 50 ? 'var(--coral)' : 'var(--emerald)' 
                                }} 
                              />
                            </div>
                            <span style={{ fontSize: '0.75rem' }}>{enc.noise_exposure}%</span>
                          </div>
                        </td>
                        <td>
                          <button 
                            className={`btn btn-xs ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setSelectedEncoding(enc.id)}
                          >
                            {isSelected ? 'Active' : 'Inspect'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {activeEnc && (
            <div className="glass-panel">
              <div className="panel-header">
                <div className="panel-title">
                  <Info size={18} style={{ color: 'var(--accent)' }} />
                  <span>Protocol Deep Dive: {activeEnc.name}</span>
                </div>
                <span className="tag-chip primary">Selected Protocol</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                <div className="metric-card">
                  <span className="metric-card-label">State-Prep Overhead</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)', marginTop: '0.2rem' }}>
                    {activeEnc.state_prep_overhead}
                  </span>
                </div>
                <div className="metric-card">
                  <span className="metric-card-label">Recommended Application</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent)', marginTop: '0.2rem' }}>
                    {activeEnc.recommended_use}
                  </span>
                </div>
                <div className="metric-card">
                  <span className="metric-card-label">Total Gate Count</span>
                  <span className="metric-card-value">{activeEnc.total_gates} gates</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Usability Next Steps Action Bar */}
      {onNavigateTab && (
        <div className="workflow-next-steps-card glass-panel">
          <div className="next-steps-info">
            <h4 className="next-steps-title">Encoding Protocol Evaluated</h4>
            <p className="next-steps-desc">
              Proceed to design your parameterized variational circuit or jump straight into model training.
            </p>
          </div>
          <div className="next-steps-buttons">
            <button className="btn btn-secondary btn-sm" onClick={() => onNavigateTab('ansatzdesigner')}>
              <Sliders size={14} />
              <span>Design Variational Circuit</span>
              <ArrowRight size={14} />
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => onNavigateTab('modellab')}>
              <Cpu size={14} />
              <span>Proceed to Model Lab</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
