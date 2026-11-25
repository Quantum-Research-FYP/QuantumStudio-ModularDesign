import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { AnsatzCandidate } from '../types';
import { Search, Award, CheckCircle2, Sliders, RefreshCw } from 'lucide-react';

export const AnsatzSearch: React.FC = () => {
  const [nQubits, setNQubits] = useState<number>(3);
  const [reps, setReps] = useState<number>(2);
  const [candidates, setCandidates] = useState<AnsatzCandidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<AnsatzCandidate | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleSearch = async () => {
    setLoading(true);
    const res = await api.searchAnsatzes(nQubits, reps);
    const safeCandidates = res || [];
    setCandidates(safeCandidates);
    if (safeCandidates.length > 0) setSelectedCandidate(safeCandidates[0]);
    setLoading(false);
  };

  useEffect(() => {
    handleSearch();
  }, [nQubits, reps]);

  return (
    <div className="grid-sidebar">
      {/* Search Configuration */}
      <div className="glass-panel">
        <div className="panel-header">
          <div className="panel-title">
            <Search size={18} style={{ color: 'var(--primary)' }} />
            <span>Q-NAS Search Space</span>
          </div>
        </div>

        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem', lineHeight: '1.5' }}>
          Automated Quantum Architecture Search (Q-NAS) sweeps candidate entangling topologies and rotation gate layers to maximize expressibility while avoiding barren plateaus.
        </p>

        <div className="form-group">
          <div className="slider-label-row">
            <span>Target Qubits</span>
            <span className="slider-val-badge">{nQubits} Qubits</span>
          </div>
          <input 
            type="range" 
            min="2" 
            max="6" 
            step="1"
            className="range-slider"
            value={nQubits}
            onChange={(e) => setNQubits(Number(e.target.value))}
          />
        </div>

        <div className="form-group">
          <div className="slider-label-row">
            <span>Layers (Reps)</span>
            <span className="slider-val-badge">{reps} Layers</span>
          </div>
          <input 
            type="range" 
            min="1" 
            max="4" 
            step="1"
            className="range-slider"
            value={reps}
            onChange={(e) => setReps(Number(e.target.value))}
          />
        </div>

        <button 
          className="btn btn-primary" 
          style={{ width: '100%', marginTop: '0.5rem' }}
          onClick={handleSearch}
          disabled={loading}
        >
          {loading ? <RefreshCw size={16} className="animate-spin" /> : <Search size={16} />}
          <span>{loading ? 'Evaluating Expressibility...' : 'Run Architecture Search'}</span>
        </button>
      </div>

      {/* Candidate Ranking Table & Selected Detail */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="glass-panel">
          <div className="panel-header">
            <div className="panel-title">
              <Award size={18} style={{ color: 'var(--accent)' }} />
              <span>Candidate Architecture Leaderboard</span>
            </div>
            <span className="tag-chip primary">Pareto Optimal Frontier</span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.75rem' }}>Ansatz Topology</th>
                  <th style={{ padding: '0.75rem' }}>Entanglement</th>
                  <th style={{ padding: '0.75rem' }}>Depth</th>
                  <th style={{ padding: '0.75rem' }}>Params</th>
                  <th style={{ padding: '0.75rem' }}>Expressibility</th>
                  <th style={{ padding: '0.75rem' }}>Trainability</th>
                  <th style={{ padding: '0.75rem' }}>Hardware Score</th>
                </tr>
              </thead>
              <tbody>
                {(candidates || []).map((c, idx) => {
                  const isSelected = selectedCandidate?.name === c.name;
                  return (
                    <tr 
                      key={idx}
                      style={{ 
                        borderBottom: '1px solid var(--border-subtle)',
                        background: isSelected ? 'var(--color-primary-soft)' : 'transparent',
                        cursor: 'pointer'
                      }}
                      onClick={() => setSelectedCandidate(c)}
                    >
                      <td style={{ padding: '0.75rem', fontWeight: 600, color: isSelected ? 'var(--primary)' : 'var(--color-text-primary)' }}>
                        {c.name}
                      </td>
                      <td style={{ padding: '0.75rem', textTransform: 'capitalize' }}>{c.entanglement}</td>
                      <td style={{ padding: '0.75rem' }}>{c.depth}</td>
                      <td style={{ padding: '0.75rem', fontFamily: 'var(--font-mono)' }}>{c.parameters}</td>
                      <td style={{ padding: '0.75rem', color: 'var(--accent)' }}>{(c.expressibility * 100).toFixed(0)}%</td>
                      <td style={{ padding: '0.75rem', color: 'var(--emerald)', fontWeight: 600 }}>{c.trainability_score} / 100</td>
                      <td style={{ padding: '0.75rem', color: 'var(--secondary)' }}>{c.hardware_score} / 100</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Architecture Breakdown */}
        {selectedCandidate && (
          <div className="glass-panel">
            <div className="panel-header">
              <div className="panel-title">
                <CheckCircle2 size={18} style={{ color: 'var(--primary)' }} />
                <span>Selected Architecture: {selectedCandidate.name}</span>
              </div>
            </div>

            <div className="grid-3col">
              <div className="metric-card">
                <span className="metric-card-label">Expressibility Metric (D_KL)</span>
                <span className="metric-card-value">{selectedCandidate.expressibility}</span>
                <div className="compare-bar-track">
                  <div className="compare-bar-fill" style={{ width: `${selectedCandidate.expressibility * 100}%`, background: 'var(--accent)' }} />
                </div>
              </div>
              <div className="metric-card">
                <span className="metric-card-label">Meyer-Wallach Entanglement</span>
                <span className="metric-card-value">{selectedCandidate.entangling_capability}</span>
                <div className="compare-bar-track">
                  <div className="compare-bar-fill" style={{ width: `${selectedCandidate.entangling_capability * 100}%`, background: 'var(--secondary)' }} />
                </div>
              </div>
              <div className="metric-card">
                <span className="metric-card-label">NISQ Hardware Efficiency</span>
                <span className="metric-card-value">{selectedCandidate.hardware_score} / 100</span>
                <div className="compare-bar-track">
                  <div className="compare-bar-fill" style={{ width: `${selectedCandidate.hardware_score}%`, background: 'var(--primary)' }} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
