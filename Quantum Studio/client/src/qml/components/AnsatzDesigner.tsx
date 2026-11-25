import React, { useState } from 'react';
import { Sliders, Plus, Trash2, Cpu, Play, CheckCircle2, RotateCcw, ArrowRight } from 'lucide-react';
import { TabType } from '../types';

interface GateNode {
  type: 'RY' | 'RZ' | 'RX' | 'H' | 'CNOT_CTRL' | 'CNOT_TGT' | 'WIRE';
  param?: string;
  targetQubit?: number;
}

interface AnsatzDesignerProps {
  onNavigateTab?: (tab: TabType) => void;
}

export const AnsatzDesigner: React.FC<AnsatzDesignerProps> = ({ onNavigateTab }) => {
  const [numQubits, setNumQubits] = useState<number>(3);
  const [layers, setLayers] = useState<number>(2);
  const [entanglement, setEntanglement] = useState<'linear' | 'circular' | 'full'>('linear');
  const [selectedGate, setSelectedGate] = useState<'RY' | 'RZ' | 'RX' | 'H' | 'CNOT'>('RY');

  // Custom circuit representation: [qubitIndex][stepIndex]
  const [customGrid, setCustomGrid] = useState<string[][]>([
    ['RY(θ₀)', 'RZ(θ₁)', '●', '─', 'RY(θ₆)'],
    ['RY(θ₂)', 'RZ(θ₃)', 'X', '●', 'RZ(θ₇)'],
    ['RY(θ₄)', 'RZ(θ₅)', '─', 'X', 'RY(θ₈)']
  ]);

  const handleCellClick = (qIdx: number, stepIdx: number) => {
    const updated = customGrid.map((row, r) => [...row]);
    if (selectedGate === 'CNOT') {
      const target = (qIdx + 1) % numQubits;
      updated[qIdx][stepIdx] = '●';
      updated[target][stepIdx] = 'X';
    } else {
      updated[qIdx][stepIdx] = `${selectedGate}(θ)`;
    }
    setCustomGrid(updated);
  };

  const handleReset = (qCount: number = numQubits, layerCount: number = layers) => {
    const grid: string[][] = [];
    for (let q = 0; q < qCount; q++) {
      const row: string[] = [];
      for (let s = 0; s < layerCount * 3; s++) {
        if (s % 3 === 0) row.push(`RY(θ_${q * 2})`);
        else if (s % 3 === 1) row.push(`RZ(θ_${q * 2 + 1})`);
        else if (s % 3 === 2) {
          if (q === 0) row.push('●');
          else if (q === 1) row.push('X');
          else row.push('─');
        }
      }
      grid.push(row);
    }
    setCustomGrid(grid);
  };

  return (
    <div className="grid-sidebar">
      {/* Designer Controls */}
      <div className="glass-panel">
        <div className="panel-header">
          <div className="panel-title">
            <Sliders size={18} style={{ color: 'var(--primary)' }} />
            <span>Ansatz Circuit Designer</span>
          </div>
        </div>

        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem', lineHeight: '1.5' }}>
          Visually construct custom Parameterized Quantum Circuits (PQCs) with interactive gate placement and entanglement topologies.
        </p>

        <div className="form-group">
          <div className="slider-label-row">
            <span>Qubit Count</span>
            <span className="slider-val-badge">{numQubits} Qubits</span>
          </div>
          <input 
            type="range"
            min="2"
            max="6"
            className="range-slider"
            value={numQubits}
            onChange={(e) => {
              const val = Number(e.target.value);
              setNumQubits(val);
              handleReset(val, layers);
            }}
          />
        </div>

        <div className="form-group">
          <div className="slider-label-row">
            <span>Repetition Layers</span>
            <span className="slider-val-badge">{layers} Layers</span>
          </div>
          <input 
            type="range"
            min="1"
            max="4"
            className="range-slider"
            value={layers}
            onChange={(e) => {
              const val = Number(e.target.value);
              setLayers(val);
              handleReset(numQubits, val);
            }}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Entanglement Routing</label>
          <select 
            className="form-select"
            value={entanglement}
            onChange={(e) => setEntanglement(e.target.value as any)}
          >
            <option value="linear">Linear (Nearest Neighbor [qᵢ, qᵢ₊₁])</option>
            <option value="circular">Circular (Periodic Boundary Ring)</option>
            <option value="full">Full All-to-All Entanglement</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Active Gate Palette</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem' }}>
            {(['RY', 'RZ', 'RX', 'H', 'CNOT'] as const).map(g => (
              <button
                key={g}
                className={`btn btn-sm ${selectedGate === g ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setSelectedGate(g)}
              >
                {g}
              </button>
            ))}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
            Click any cell on the circuit grid to insert the selected gate.
          </div>
        </div>

        <button 
          className="btn btn-secondary btn-sm"
          style={{ width: '100%', marginTop: '0.5rem' }}
          onClick={() => handleReset()}
        >
          <RotateCcw size={14} />
          <span>Reset to Default Topology</span>
        </button>
      </div>

      {/* Visual Circuit Canvas */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="glass-panel">
          <div className="panel-header">
            <div className="panel-title">
              <Cpu size={18} style={{ color: 'var(--accent)' }} />
              <span>Interactive Quantum Wire Grid</span>
            </div>
            <span className="tag-chip primary">{numQubits * layers * 2} Trainable Parameters θ</span>
          </div>

          <div style={{ 
            background: 'var(--color-surface-soft)', 
            borderRadius: '12px', 
            padding: '2rem 1.5rem', 
            border: '1px solid var(--color-border)',
            overflowX: 'auto'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', minWidth: '480px' }}>
              {customGrid.slice(0, numQubits).map((wire, qIdx) => (
                <div key={qIdx} style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                  {/* Qubit Label */}
                  <div style={{ 
                    fontFamily: 'var(--font-mono)', 
                    fontWeight: 700, 
                    color: 'var(--color-primary)', 
                    width: '45px',
                    fontSize: '0.9rem' 
                  }}>
                    q_{qIdx}:
                  </div>

                  {/* Wire Horizontal Line */}
                  <div style={{ 
                    position: 'absolute', 
                    left: '50px', 
                    right: '10px', 
                    height: '2px', 
                    background: 'var(--color-border-strong)',
                    zIndex: 0 
                  }} />

                  {/* Gate Steps */}
                  <div style={{ display: 'flex', gap: '1.25rem', zIndex: 1, marginLeft: '10px' }}>
                    {wire.map((gate, stepIdx) => {
                      const isControl = gate === '●';
                      const isTarget = gate === 'X';
                      const isWire = gate === '─';

                      return (
                        <div
                          key={stepIdx}
                          style={{
                            background: isWire 
                              ? 'transparent' 
                              : isControl 
                              ? 'var(--color-primary)' 
                              : isTarget 
                              ? 'var(--color-purple-fill)' 
                              : 'var(--color-surface)',
                            border: isWire ? 'none' : '1px solid var(--color-purple-border)',
                            borderRadius: isControl ? '50%' : '6px',
                            width: isControl ? '24px' : '52px',
                            height: isControl ? '24px' : '36px',
                            margin: isControl ? '6px 14px' : '0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            fontFamily: 'var(--font-mono)',
                            fontWeight: 600,
                            color: isControl || isTarget ? 'var(--color-on-accent)' : 'var(--color-text-primary)',
                            boxShadow: isWire ? 'none' : '0 2px 6px var(--color-shadow)',
                            transition: 'all 0.15s ease'
                          }}
                          onClick={() => handleCellClick(qIdx, stepIdx)}
                          title={`Click to place ${selectedGate}`}
                        >
                          {!isControl && !isWire && gate}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span style={{ width: '10px', height: '10px', background: 'var(--primary)', borderRadius: '50%' }}></span>
              <span>● = CNOT Control</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span style={{ width: '10px', height: '10px', background: 'var(--secondary)', borderRadius: '2px' }}></span>
              <span>X = CNOT Target</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span style={{ width: '10px', height: '10px', background: 'rgba(20, 28, 48, 0.95)', border: '1px solid var(--border-glow)', borderRadius: '2px' }}></span>
              <span>Parameterized Rotations (RY, RZ)</span>
            </div>
          </div>
        </div>

        {/* Workflow Next Steps Card */}
        {onNavigateTab && (
          <div className="glass-panel" style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            flexWrap: 'wrap', 
            gap: '1rem',
            padding: '1.25rem 1.5rem',
            borderLeft: '4px solid var(--color-purple-fill)'
          }}>
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                Circuit Topology Defined ({numQubits} Qubits, {layers} Layers, {numQubits * layers * 2} Parameters)
              </h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '0.2rem' }}>
                Next in the QML Pipeline: Train parameterized angles on your active dataset or transpile to noisy hardware coupling maps.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.6rem' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => onNavigateTab('hardwarelab')}>
                <Cpu size={14} />
                <span>Simulate on Hardware</span>
                <ArrowRight size={14} />
              </button>
              <button className="btn btn-primary btn-sm" onClick={() => onNavigateTab('modellab')}>
                <Play size={14} />
                <span>Proceed to Model Lab (VQC)</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
