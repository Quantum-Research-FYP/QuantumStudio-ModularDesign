import React from 'react';
import { TabType } from '../types';
import { 
  Compass, X, Database, Layers, Sliders, Cpu, 
  Server, Zap, FileText, ArrowRight, Sparkles, 
  CheckCircle2, BookOpen, Activity, AlertCircle, HelpCircle
} from 'lucide-react';

interface QuickStartModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectGoal: (tab: TabType, quickAction?: () => void) => void;
  onQuickLoadMoons: () => Promise<void> | void;
  onEnableGuidedMode: () => void;
}

export const QuickStartModal: React.FC<QuickStartModalProps> = ({
  isOpen,
  onClose,
  onSelectGoal,
  onQuickLoadMoons,
  onEnableGuidedMode
}) => {
  if (!isOpen) return null;

  const handleStartVQC = async () => {
    await onQuickLoadMoons();
    onSelectGoal('modellab');
    onClose();
  };

  const handleStartEncoding = async () => {
    await onQuickLoadMoons();
    onSelectGoal('encodinglab');
    onClose();
  };

  const handleStartCustomCSV = () => {
    onSelectGoal('datalab');
    onClose();
  };

  const handleStartBarrenPlateau = () => {
    onSelectGoal('barrenplateau');
    onClose();
  };

  const handleStartArena = async () => {
    await onQuickLoadMoons();
    onSelectGoal('benchmark');
    onClose();
  };

  const handleLaunchGuidedPipeline = () => {
    onEnableGuidedMode();
    onSelectGoal('datalab');
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1100 }}>
      <div 
        className="modal-content glass-panel" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '860px', width: '92%', maxHeight: '90vh', overflowY: 'auto', padding: '2rem' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ 
              background: 'var(--color-primary-soft)', 
              color: 'var(--color-primary)', 
              padding: '0.65rem', 
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Compass size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                  How to Start: Researcher Onboarding Guide
                </h2>
                <span className="tag-chip primary" style={{ fontSize: '0.75rem' }}>Quickstart v2.0</span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginTop: '0.2rem' }}>
                Follow the standard 4-pillar Quantum Machine Learning research workflow from raw data to paper export.
              </p>
            </div>
          </div>
          <button 
            className="btn btn-secondary btn-sm"
            onClick={onClose}
            style={{ borderRadius: '50%', width: '32px', height: '32px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* 4-Stage Visual Research Pipeline */}
        <div style={{ 
          background: 'var(--color-surface-soft)', 
          borderRadius: '12px', 
          padding: '1.25rem', 
          border: '1px solid var(--color-border)',
          marginBottom: '1.75rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-primary)' }}>
              Standard QML Research Lifecycle (4 Pillars)
            </span>
            <button 
              className="btn btn-primary btn-xs"
              onClick={handleLaunchGuidedPipeline}
              style={{ fontSize: '0.75rem', gap: '0.35rem' }}
            >
              <Sparkles size={12} />
              <span>Launch Guided Step-by-Step Mode</span>
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
            {/* Step 1 */}
            <div style={{ 
              background: 'var(--color-surface)', 
              padding: '0.9rem', 
              borderRadius: '8px', 
              border: '1px solid var(--color-border)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.35rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-primary)', fontWeight: 700, fontSize: '0.82rem' }}>
                <Database size={15} />
                <span>1. Data & Encoding</span>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', lineHeight: '1.4' }}>
                Normalize classical features into [-π, π] and choose a quantum state mapping (Angle, Amplitude, ZZ Feature Map).
              </p>
            </div>

            {/* Step 2 */}
            <div style={{ 
              background: 'var(--color-surface)', 
              padding: '0.9rem', 
              borderRadius: '8px', 
              border: '1px solid var(--color-border)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.35rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-purple-text)', fontWeight: 700, fontSize: '0.82rem' }}>
                <Sliders size={15} />
                <span>2. Circuit Architecture</span>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', lineHeight: '1.4' }}>
                Build parameterized quantum circuits (PQC), test ansatz expressibility, or search optimal entangling topologies.
              </p>
            </div>

            {/* Step 3 */}
            <div style={{ 
              background: 'var(--color-surface)', 
              padding: '0.9rem', 
              borderRadius: '8px', 
              border: '1px solid var(--color-border)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.35rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-info)', fontWeight: 700, fontSize: '0.82rem' }}>
                <Cpu size={15} />
                <span>3. Training & Hardware</span>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', lineHeight: '1.4' }}>
                Train VQC or compute Quantum Kernels (QKE). Transpile to IBM Falcon/Heron topologies under thermal relaxation noise.
              </p>
            </div>

            {/* Step 4 */}
            <div style={{ 
              background: 'var(--color-surface)', 
              padding: '0.9rem', 
              borderRadius: '8px', 
              border: '1px solid var(--color-border)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.35rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-green-text)', fontWeight: 700, fontSize: '0.82rem' }}>
                <Zap size={15} />
                <span>4. Arena & Reports</span>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', lineHeight: '1.4' }}>
                Benchmark quantum accuracy against Classical SVM & Random Forest, then auto-generate publication-ready reports.
              </p>
            </div>
          </div>
        </div>

        {/* Choose Your Research Goal Section */}
        <div style={{ marginBottom: '1.75rem' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.85rem' }}>
            Where would you like to start? (Choose a Goal)
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
            {/* Goal 1: VQC */}
            <div 
              style={{ 
                background: 'var(--color-surface)', 
                border: '1px solid var(--color-border)',
                borderRadius: '10px',
                padding: '1.1rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 6px var(--color-shadow)'
              }}
              onClick={handleStartVQC}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span className="tag-chip primary" style={{ fontSize: '0.7rem' }}>Most Popular</span>
                  <Cpu size={18} style={{ color: 'var(--color-primary)' }} />
                </div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.3rem' }}>
                  Train a Quantum Classifier (VQC)
                </h4>
                <p style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', lineHeight: '1.4', marginBottom: '1rem' }}>
                  Loads the 2-qubit Moons benchmark and opens Model Lab with RealAmplitudes ansatz and classical COBYLA optimizer.
                </p>
              </div>
              <button className="btn btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
                <span>Start VQC Experiment</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {/* Goal 2: Encoding Cost */}
            <div 
              style={{ 
                background: 'var(--color-surface)', 
                border: '1px solid var(--color-border)',
                borderRadius: '10px',
                padding: '1.1rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 6px var(--color-shadow)'
              }}
              onClick={handleStartEncoding}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span className="tag-chip purple" style={{ fontSize: '0.7rem' }}>Theoretical</span>
                  <Layers size={18} style={{ color: 'var(--color-purple-text)' }} />
                </div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.3rem' }}>
                  Compare Quantum Encodings
                </h4>
                <p style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', lineHeight: '1.4', marginBottom: '1rem' }}>
                  Compare required qubits, gate counts, circuit depths, and CNOT overhead across Angle, Amplitude, Phase, and ZZ Feature Maps.
                </p>
              </div>
              <button className="btn btn-secondary btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
                <span>Analyze Encoding Costs</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {/* Goal 3: Custom CSV */}
            <div 
              style={{ 
                background: 'var(--color-surface)', 
                border: '1px solid var(--color-border)',
                borderRadius: '10px',
                padding: '1.1rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 6px var(--color-shadow)'
              }}
              onClick={handleStartCustomCSV}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span className="tag-chip" style={{ fontSize: '0.7rem' }}>Custom Data</span>
                  <Database size={18} style={{ color: 'var(--color-green-text)' }} />
                </div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.3rem' }}>
                  Bring My Own Dataset (CSV)
                </h4>
                <p style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', lineHeight: '1.4', marginBottom: '1rem' }}>
                  Upload your scientific tabular dataset. Automatic schema detection, PCA dimensionality reduction to N qubits, and train/test splitting.
                </p>
              </div>
              <button className="btn btn-secondary btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
                <span>Open Data Ingestion</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {/* Goal 4: Barren Plateau */}
            <div 
              style={{ 
                background: 'var(--color-surface)', 
                border: '1px solid var(--color-border)',
                borderRadius: '10px',
                padding: '1.1rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 6px var(--color-shadow)'
              }}
              onClick={handleStartBarrenPlateau}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span className="tag-chip danger" style={{ fontSize: '0.7rem' }}>Trainability</span>
                  <Activity size={18} style={{ color: 'var(--color-red-text)' }} />
                </div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.3rem' }}>
                  Probe Barren Plateaus
                </h4>
                <p style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', lineHeight: '1.4', marginBottom: '1rem' }}>
                  Empirically test whether cost function gradients vanish exponentially Var[∂C] ∝ 2⁻ⁿ with increasing circuit depth and qubits.
                </p>
              </div>
              <button className="btn btn-secondary btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
                <span>Sweep Trainability</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {/* Goal 5: Classical Arena */}
            <div 
              style={{ 
                background: 'var(--color-surface)', 
                border: '1px solid var(--color-border)',
                borderRadius: '10px',
                padding: '1.1rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 6px var(--color-shadow)'
              }}
              onClick={handleStartArena}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span className="tag-chip gold" style={{ fontSize: '0.7rem' }}>Benchmark</span>
                  <Zap size={18} style={{ color: 'var(--color-gold-text)' }} />
                </div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.3rem' }}>
                  Quantum vs Classical Arena
                </h4>
                <p style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', lineHeight: '1.4', marginBottom: '1rem' }}>
                  Benchmark Quantum Kernel Estimator against Classical SVM (RBF/Linear), Random Forest, and Logistic Regression on identical splits.
                </p>
              </div>
              <button className="btn btn-secondary btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
                <span>Run Empirical Arena</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* 3 Academic Rules of Thumb */}
        <div style={{ 
          background: 'var(--color-primary-soft)', 
          border: '1px solid var(--color-primary)', 
          borderRadius: '10px', 
          padding: '1rem 1.25rem',
          display: 'flex',
          gap: '1rem',
          alignItems: 'flex-start'
        }}>
          <BookOpen size={20} style={{ color: 'var(--color-primary)', flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-primary)', lineHeight: '1.5' }}>
            <strong>Academic Best Practice:</strong>
            <ul style={{ paddingLeft: '1.2rem', marginTop: '0.35rem', color: 'var(--color-text-secondary)' }}>
              <li><strong>NISQ Scaling:</strong> If your dataset has more features than available qubits, use PCA projection or Angle Encoding (1 qubit per feature).</li>
              <li><strong>Entanglement Overhead:</strong> Second-order feature maps (ZZ) inject non-linear expressibility, but CNOT counts scale quadratically O(N²), increasing noise susceptibility.</li>
              <li><strong>Optimizer Selection:</strong> Use <strong>COBYLA</strong> for noiseless statevector simulations; switch to <strong>SPSA</strong> when evaluating on realistic noisy hardware models.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
