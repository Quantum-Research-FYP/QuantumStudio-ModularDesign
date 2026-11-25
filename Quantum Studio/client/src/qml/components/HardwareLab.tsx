import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { TranspilationResult } from '../types';
import { Server, Cpu, ShieldAlert, Zap, Layers, RefreshCw } from 'lucide-react';

export const HardwareLab: React.FC = () => {
  const [backend, setBackend] = useState<string>('fake_manila');
  const [optLevel, setOptLevel] = useState<number>(2);
  const [noiseModel, setNoiseModel] = useState<string>('depolarizing');
  const [errorRate, setErrorRate] = useState<number>(0.015);
  const [nQubits, setNQubits] = useState<number>(2);
  const [reps, setReps] = useState<number>(2);
  const [loading, setLoading] = useState<boolean>(false);
  const [transpileResult, setTranspileResult] = useState<TranspilationResult | null>(null);

  const handleTranspile = async () => {
    setLoading(true);
    const res = await api.transpileCircuit('ZZFeatureMap', 'RealAmplitudes', nQubits, reps, optLevel);
    // Apply noise impact estimation
    if (noiseModel !== 'none') {
      res.estimated_fidelity = Math.max(0.45, res.estimated_fidelity - (res.cnot_count * errorRate * 2.2));
    }
    setTranspileResult(res);
    setLoading(false);
  };

  useEffect(() => {
    handleTranspile();
  }, [backend, optLevel, noiseModel, errorRate, nQubits, reps]);

  return (
    <div className="grid-sidebar">
      {/* Hardware Settings */}
      <div className="glass-panel">
        <div className="panel-header">
          <div className="panel-title">
            <Server size={18} style={{ color: 'var(--primary)' }} />
            <span>Target QPU & Transpiler</span>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Quantum Processor Target</label>
          <select 
            className="form-select"
            value={backend}
            onChange={(e) => setBackend(e.target.value)}
          >
            <option value="fake_manila">IBM Manila (5-Qubit Falcon r5.2)</option>
            <option value="fake_quito">IBM Quito (5-Qubit Falcon r4T)</option>
            <option value="fake_brisbane">IBM Brisbane (127-Qubit Eagle r3)</option>
            <option value="aer_simulator">Qiskit Aer (Ideal Statevector Simulator)</option>
          </select>
        </div>

        <div className="form-group">
          <div className="slider-label-row">
            <span>Allocated Qubits</span>
            <span className="slider-val-badge">{nQubits} Q</span>
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
          <label className="form-label">Transpilation Pass Level</label>
          <select 
            className="form-select"
            value={optLevel}
            onChange={(e) => setOptLevel(Number(e.target.value))}
          >
            <option value="0">Level 0: No Optimization (Direct translation)</option>
            <option value="1">Level 1: Light (Adjacent gate cancellation)</option>
            <option value="2">Level 2: Medium (Commutation analysis & noise-adaptive layout)</option>
            <option value="3">Level 3: Heavy (Synthesis & Sabre routing)</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Hardware Noise Injection</label>
          <select 
            className="form-select"
            value={noiseModel}
            onChange={(e) => setNoiseModel(e.target.value)}
          >
            <option value="depolarizing">Depolarizing Channel (Random Pauli flips)</option>
            <option value="thermal">Thermal Relaxation (T₁/T₂ Decoherence)</option>
            <option value="readout">Readout Bit-Flip (POVM Inaccuracy)</option>
            <option value="none">Ideal (Zero Noise)</option>
          </select>
        </div>

        {noiseModel !== 'none' && (
          <div className="form-group">
            <div className="slider-label-row">
              <span>Physical Gate Error Rate</span>
              <span className="slider-val-badge">{(errorRate * 100).toFixed(2)}%</span>
            </div>
            <input 
              type="range" 
              min="0.001" 
              max="0.05" 
              step="0.002"
              className="range-slider"
              value={errorRate}
              onChange={(e) => setErrorRate(Number(e.target.value))}
            />
          </div>
        )}

        <button 
          className="btn btn-primary" 
          style={{ width: '100%', marginTop: '0.5rem' }}
          onClick={handleTranspile}
          disabled={loading}
        >
          {loading ? <RefreshCw size={16} className="animate-spin" /> : <Zap size={16} />}
          <span>{loading ? 'Synthesizing Pulses...' : 'Re-Transpile on Hardware'}</span>
        </button>
      </div>

      {/* Transpiler Metrics and Circuit Visualizer */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Hardware metrics */}
        <div className="grid-3col">
          <div className="metric-card" style={{ borderLeft: '3px solid var(--accent)' }}>
            <span className="metric-card-label">Circuit Depth</span>
            <span className="metric-card-value">{transpileResult?.depth || '--'}</span>
            <span className="metric-card-delta">Physical Time Steps</span>
          </div>
          <div className="metric-card" style={{ borderLeft: '3px solid var(--coral)' }}>
            <span className="metric-card-label">CNOT / Two-Qubit Gates</span>
            <span className="metric-card-value">{transpileResult?.cnot_count || '--'}</span>
            <span className="metric-card-delta negative">Highest Error Sensitivity</span>
          </div>
          <div className="metric-card" style={{ borderLeft: '3px solid var(--primary)' }}>
            <span className="metric-card-label">Estimated Circuit Fidelity</span>
            <span className="metric-card-value">
              {transpileResult ? (transpileResult.estimated_fidelity * 100).toFixed(1) + '%' : '--'}
            </span>
            <span className="metric-card-delta positive">Quantum State Purity</span>
          </div>
        </div>

        {/* Physical Circuit Topology & Native Gates */}
        <div className="glass-panel">
          <div className="panel-header">
            <div className="panel-title">
              <Cpu size={18} style={{ color: 'var(--primary)' }} />
              <span>Transpiled Basis Gate Circuit Representation (cx, rz, sx, x)</span>
            </div>
            <span className="tag-chip primary">Hardware Target: {backend}</span>
          </div>

          <div className="circuit-preview-box">
            {transpileResult?.circuit_ascii || 'Transpiling circuit to native basis gates...'}
          </div>

          <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <span className="tag-chip">Total Gate Operations: {transpileResult?.total_gates || 0}</span>
            <span className="tag-chip">Single-Qubit Rotations: {transpileResult?.single_qubit_gates || 0}</span>
            <span className="tag-chip">Opt Level {optLevel} Applied</span>
          </div>
        </div>
      </div>
    </div>
  );
};
