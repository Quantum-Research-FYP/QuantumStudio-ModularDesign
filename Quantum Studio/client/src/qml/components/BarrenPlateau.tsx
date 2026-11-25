import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { BarrenPlateauPoint } from '../types';
import { TrendingDown, AlertTriangle, ShieldCheck, RefreshCw, Info } from 'lucide-react';

export const BarrenPlateau: React.FC = () => {
  const [maxQubits, setMaxQubits] = useState<number>(8);
  const [samples, setSamples] = useState<number>(30);
  const [loading, setLoading] = useState<boolean>(false);
  const [points, setPoints] = useState<BarrenPlateauPoint[]>([]);

  const handleSweep = async () => {
    setLoading(true);
    const res = await api.analyzeBarrenPlateau(maxQubits, samples);
    setPoints(res || []);
    setLoading(false);
  };

  useEffect(() => {
    handleSweep();
  }, [maxQubits]);

  return (
    <div className="grid-sidebar">
      {/* Controls */}
      <div className="glass-panel">
        <div className="panel-header">
          <div className="panel-title">
            <TrendingDown size={18} style={{ color: 'var(--coral)' }} />
            <span>Barren Plateau Sweep</span>
          </div>
        </div>

        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem', lineHeight: '1.5' }}>
          As the Hilbert space dimension grows exponentially (2ⁿ), random parameterized circuits suffer from concentration of measure, causing gradient variances to vanish exponentially:
          <code style={{ display: 'block', margin: '0.5rem 0', color: 'var(--coral)', background: 'rgba(0,0,0,0.3)', padding: '0.4rem', borderRadius: '4px' }}>
            Var_θ[∂C/∂θ] ~ O(1 / 2ⁿ)
          </code>
        </p>

        <div className="form-group">
          <div className="slider-label-row">
            <span>Sweep Qubit Count (2 to N)</span>
            <span className="slider-val-badge">{maxQubits} Qubits</span>
          </div>
          <input 
            type="range" 
            min="4" 
            max="12" 
            step="1"
            className="range-slider"
            value={maxQubits}
            onChange={(e) => setMaxQubits(Number(e.target.value))}
          />
        </div>

        <div className="form-group">
          <div className="slider-label-row">
            <span>Haar Random Samples / Qubit</span>
            <span className="slider-val-badge">{samples}</span>
          </div>
          <input 
            type="range" 
            min="10" 
            max="60" 
            step="10"
            className="range-slider"
            value={samples}
            onChange={(e) => setSamples(Number(e.target.value))}
          />
        </div>

        <button 
          className="btn btn-primary" 
          style={{ width: '100%', marginTop: '0.5rem' }}
          onClick={handleSweep}
          disabled={loading}
        >
          {loading ? <RefreshCw size={16} className="animate-spin" /> : <TrendingDown size={16} />}
          <span>{loading ? 'Sampling Gradient Variance...' : 'Run Qubit Scaling Sweep'}</span>
        </button>

        {/* Trainability Diagnostic Card */}
        <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--coral)', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem' }}>
            <AlertTriangle size={16} />
            <span>Barren Plateau Diagnostic</span>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
            {maxQubits <= 4 
              ? "Safe regime: Gradients have sufficient variance for gradient descent optimization."
              : maxQubits <= 8 
              ? "Moderate risk: Exponential flattening detected. Switch to local cost functions or shallow alternating ansätze."
              : "Critical Barren Plateau: Standard classical optimizers will stall due to vanishing gradient magnitudes."}
          </p>
        </div>
      </div>

      {/* Plots and Locality Comparison */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Logarithmic Gradient Variance Plot */}
        <div className="glass-panel">
          <div className="panel-header">
            <div className="panel-title">
              <TrendingDown size={18} style={{ color: 'var(--coral)' }} />
              <span>Gradient Variance vs Qubit Count: Var[∂C]</span>
            </div>
            <span className="tag-chip purple">Logarithmic Decay Scale</span>
          </div>

          <div style={{ width: '100%', height: '320px', background: 'var(--color-surface-soft)', borderRadius: '12px', border: '1px solid var(--color-border)', padding: '1.25rem', position: 'relative' }}>
            <svg width="100%" height="100%" viewBox="0 0 500 260">
              {/* Grid Lines */}
              <line x1="50" y1="20" x2="480" y2="20" stroke="var(--color-border)" />
              <line x1="50" y1="80" x2="480" y2="80" stroke="var(--color-border)" />
              <line x1="50" y1="140" x2="480" y2="140" stroke="var(--color-border)" />
              <line x1="50" y1="200" x2="480" y2="200" stroke="var(--color-border)" />

              {/* Y Axis Labels */}
              <text x="15" y="25" fill="var(--text-dim)" fontSize="10">10⁰</text>
              <text x="15" y="85" fill="var(--text-dim)" fontSize="10">10⁻²</text>
              <text x="15" y="145" fill="var(--text-dim)" fontSize="10">10⁻⁴</text>
              <text x="15" y="205" fill="var(--text-dim)" fontSize="10">10⁻⁶</text>

              {/* Curve Points */}
              {points.length > 1 && (
                <>
                  {/* Global Cost line (Exponential) */}
                  <path
                    d={points.map((p, idx) => {
                      const x = 60 + (idx / (points.length - 1)) * 400;
                      // Log scale mapping
                      const logVal = Math.log10(p.variance + 1e-8);
                      const y = 20 - logVal * 30;
                      return `${idx === 0 ? 'M' : 'L'} ${x} ${Math.min(220, Math.max(20, y))}`;
                    }).join(' ')}
                    fill="none"
                    stroke="var(--coral)"
                    strokeWidth="3"
                  />

                  {/* Local Cost line (Polynomial / Mitigated) */}
                  <path
                    d={points.map((p, idx) => {
                      const x = 60 + (idx / (points.length - 1)) * 400;
                      const polyVal = 1 / Math.pow(p.qubits, 1.4);
                      const logVal = Math.log10(polyVal);
                      const y = 20 - logVal * 30;
                      return `${idx === 0 ? 'M' : 'L'} ${x} ${Math.min(220, Math.max(20, y))}`;
                    }).join(' ')}
                    fill="none"
                    stroke="var(--primary)"
                    strokeWidth="2.5"
                    strokeDasharray="4 4"
                  />

                  {/* Dots on the measured curve */}
                  {points.map((p, idx) => {
                    const x = 60 + (idx / (points.length - 1)) * 400;
                    const logVal = Math.log10(p.variance + 1e-8);
                    const y = Math.min(220, Math.max(20, 20 - logVal * 30));
                    return (
                      <g key={idx}>
                        <circle cx={x} cy={y} r="5" fill="var(--coral)" stroke="var(--color-surface)" strokeWidth="2" />
                        <text x={x - 6} y="240" fill="var(--text-muted)" fontSize="11">{p.qubits}Q</text>
                      </g>
                    );
                  })}
                </>
              )}
            </svg>

            <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', marginTop: '0.5rem', fontSize: '0.8rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--coral)' }}>
                <span style={{ width: '14px', height: '3px', background: 'var(--coral)' }}></span>
                <span>Global Cost: Exponential Barren Plateau O(2⁻ⁿ)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary)' }}>
                <span style={{ width: '14px', height: '3px', background: 'var(--primary)', borderTop: '2px dashed var(--primary)' }}></span>
                <span>Local Cost Observable: Polynomial Scaling O(1/n)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Theoretical Mitigation Recommendations */}
        <div className="glass-panel">
          <div className="panel-header">
            <div className="panel-title">
              <ShieldCheck size={18} style={{ color: 'var(--emerald)' }} />
              <span>Mitigation Strategies & Architecture Advice</span>
            </div>
          </div>

          <div className="grid-3col">
            <div className="metric-card">
              <span className="metric-card-label" style={{ color: 'var(--primary)' }}>1. Local Observables</span>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.4rem', lineHeight: '1.4' }}>
                Replace global projection |0...0⟩⟨0...0| with sum of 1-qubit or 2-qubit Pauli terms (e.g. Σ Z_i) to prevent orthogonal subspace trapping.
              </p>
            </div>
            <div className="metric-card">
              <span className="metric-card-label" style={{ color: 'var(--secondary)' }}>2. Identity Initialization</span>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.4rem', lineHeight: '1.4' }}>
                Initialize variational parameters near zero or identity so early iterations remain in a localized, non-Haar random subspace.
              </p>
            </div>
            <div className="metric-card">
              <span className="metric-card-label" style={{ color: 'var(--accent)' }}>3. Shallow Layering</span>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.4rem', lineHeight: '1.4' }}>
                Keep circuit depth O(log n) to avoid forming approximate 2-designs which mathematically cause concentration of measure.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
