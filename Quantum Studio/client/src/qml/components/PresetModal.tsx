import React from 'react';
import { ResearchPreset, TabType, DatasetConfig } from '../types';
import { 
  Zap, X, Cpu, Layers, TrendingDown, Server, Award, 
  ArrowRight, Sparkles, CheckCircle2 
} from 'lucide-react';

interface PresetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyPreset: (preset: ResearchPreset) => void;
}

export const RESEARCH_PRESETS: ResearchPreset[] = [
  {
    id: 'preset-qke-moons',
    title: 'Non-Linear Quantum Kernel (QKE)',
    badge: 'Beginner Recommended',
    pillColor: 'var(--color-primary)',
    category: 'Supervised Learning',
    description: 'Project 2D non-linear interleaving moons into high-dimensional Hilbert space using ZZFeatureMap second-order Pauli expansions.',
    targetTab: 'modellab',
    datasetConfig: {
      dataset_type: 'moons',
      n_samples: 120,
      noise: 0.12,
      normalization: 'minmax',
      n_features: 2
    },
    modelConfig: {
      model_type: 'qke',
      feature_map: 'ZZFeatureMap',
      reps: 2,
      entanglement: 'linear'
    },
    specs: {
      qubits: 2,
      encoding: 'ZZFeatureMap (2 Reps)',
      ansatz: 'Fidelity Kernel',
      hardware: 'Statevector'
    }
  },
  {
    id: 'preset-vqc-circles',
    title: 'Variational Quantum Classifier (VQC)',
    badge: 'Hybrid Optimization',
    pillColor: 'var(--color-purple-fill)',
    category: 'Variational Algorithms',
    description: 'Train parameterized rotation angles on concentric circular decision boundaries with classical COBYLA optimizer loop.',
    targetTab: 'modellab',
    datasetConfig: {
      dataset_type: 'circles',
      n_samples: 140,
      noise: 0.08,
      normalization: 'minmax',
      n_features: 2
    },
    modelConfig: {
      model_type: 'vqc',
      ansatz: 'RealAmplitudes',
      feature_map: 'ZZFeatureMap',
      reps: 2,
      optimizer: 'COBYLA',
      max_iter: 35,
      learning_rate: 0.05
    },
    specs: {
      qubits: 2,
      encoding: 'Angle Encoding',
      ansatz: 'RealAmplitudes (Depth 2)',
      hardware: 'COBYLA Optimizer'
    }
  },
  {
    id: 'preset-barren-plateau',
    title: 'Trainability & Barren Plateau Sweep',
    badge: 'Theoretical Analysis',
    pillColor: 'var(--color-danger)',
    category: 'Quantum Expressibility',
    description: 'Observe exponential gradient variance decay Var[∂⟨H⟩] ∝ 1/2ⁿ as qubit count and Haar-random ansatz depth increase.',
    targetTab: 'barrenplateau',
    datasetConfig: {
      dataset_type: 'blobs',
      n_samples: 100,
      noise: 0.1,
      normalization: 'minmax',
      n_features: 2
    },
    specs: {
      qubits: 4,
      encoding: 'Haar Unitary',
      ansatz: 'TwoLocal Random Circuit',
      hardware: 'Gradient Variance Probe'
    }
  },
  {
    id: 'preset-reuploading',
    title: 'Data Re-Uploading Fourier Spectrum',
    badge: 'Compact Qubits',
    pillColor: 'var(--color-info)',
    category: 'Universal Approximation',
    description: 'Interleave feature maps and parameterized rotation blocks across 3–5 layers to expand Fourier frequency harmonics on few qubits.',
    targetTab: 'reuploading',
    datasetConfig: {
      dataset_type: 'spiral',
      n_samples: 120,
      noise: 0.1,
      normalization: 'minmax',
      n_features: 2
    },
    specs: {
      qubits: 2,
      encoding: 'Layered Re-Uploading',
      ansatz: 'Multi-layer SU(2)',
      hardware: 'Fourier Harvester'
    }
  },
  {
    id: 'preset-hardware-noise',
    title: 'IBM Manila Realistic Noise Simulation',
    badge: 'NISQ Hardware',
    pillColor: 'var(--color-gold-fill)',
    category: 'Hardware & Noise',
    description: 'Transpile variational ansatz onto Falcon 5-qubit coupling map with T1/T2 thermal relaxation and depolarizing gate noise.',
    targetTab: 'hardwarelab',
    datasetConfig: {
      dataset_type: 'moons',
      n_samples: 100,
      noise: 0.1,
      normalization: 'minmax',
      n_features: 2
    },
    specs: {
      qubits: 5,
      encoding: 'Angle RX/RY',
      ansatz: 'EfficientSU2',
      hardware: 'FakeManila Backend'
    }
  },
  {
    id: 'preset-arena-benchmark',
    title: 'Empirical Advantage Arena Benchmark',
    badge: 'Benchmarking',
    pillColor: 'var(--color-success)',
    category: 'Competitive Arena',
    description: 'Run head-to-head empirical testing comparing Quantum Kernel vs Random Forest, SVM (RBF), and Logistic Regression on identical splits.',
    targetTab: 'benchmark',
    datasetConfig: {
      dataset_type: 'moons',
      n_samples: 120,
      noise: 0.15,
      normalization: 'minmax',
      n_features: 2
    },
    specs: {
      qubits: 2,
      encoding: 'Quantum Kernel',
      ansatz: '4 Baselines',
      hardware: 'Multi-model Engine'
    }
  }
];

export const PresetModal: React.FC<PresetModalProps> = ({ isOpen, onClose, onApplyPreset }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="modal-card modal-card-lg"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="preset-modal-title"
      >
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-icon-badge">
              <Zap size={20} />
            </div>
            <div>
              <h2 id="preset-modal-title" className="modal-title">1-Click Research Experiment Presets</h2>
              <p className="modal-subtitle">
                Instantly load validated datasets, quantum circuit architectures, and hyperparameter setups
              </p>
            </div>
          </div>
          <button 
            className="modal-close-btn" 
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        <div className="preset-grid">
          {RESEARCH_PRESETS.map((preset) => (
            <div 
              key={preset.id} 
              className="preset-item-card"
              onClick={() => {
                onApplyPreset(preset);
                onClose();
              }}
            >
              <div className="preset-item-header">
                <span 
                  className="preset-badge"
                  style={{ backgroundColor: `${preset.pillColor}1a`, color: preset.pillColor, borderColor: `${preset.pillColor}40` }}
                >
                  {preset.badge}
                </span>
                <span className="preset-category">{preset.category}</span>
              </div>

              <h4 className="preset-item-title">{preset.title}</h4>
              <p className="preset-item-desc">{preset.description}</p>

              <div className="preset-specs-pills">
                <span className="spec-pill"><strong>{preset.specs.qubits}</strong> Qubits</span>
                <span className="spec-pill">{preset.specs.encoding}</span>
                <span className="spec-pill">{preset.specs.hardware}</span>
              </div>

              <button className="preset-launch-btn">
                <span>Launch Preset</span>
                <ArrowRight size={14} />
              </button>
            </div>
          ))}
        </div>

        <div className="modal-footer">
          <div className="modal-footer-tip">
            <Sparkles size={14} style={{ color: 'var(--primary)' }} />
            <span>Presets automatically configure dataset parameters, model hyperparameters, and route to the corresponding laboratory.</span>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
