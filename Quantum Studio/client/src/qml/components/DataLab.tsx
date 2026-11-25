import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { DatasetConfig, DatasetResponse, CSVParsedPreview, TabType } from '../types';
import { 
  Database, Sparkles, Sliders, Layers, Upload, FileText, 
  CheckCircle, Table, BarChart2, Eye, Download, AlertTriangle, 
  ShieldCheck, RefreshCw, X, ArrowRight, Activity, Cpu
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

interface DataLabProps {
  dataset: DatasetResponse | null;
  setDataset: (ds: DatasetResponse) => void;
  config: DatasetConfig;
  setConfig: React.Dispatch<React.SetStateAction<DatasetConfig>>;
  onNavigateTab?: (tab: TabType) => void;
}

const ENCODING_METADATA: Record<string, { label: string; group: string; qubits: string; depth: string; cnot: string; formula: string; desc: string }> = {
  angle: {
    label: 'Angle Encoding (Ry)',
    group: 'Single-Qubit Rotations',
    qubits: 'O(N) qubits',
    depth: 'Depth 1',
    cnot: '0 CNOTs',
    formula: '|ψ(x)⟩ = ⨂ (cos(xᵢ/2)|0⟩ + sin(xᵢ/2)|1⟩)',
    desc: 'Standard Ry rotations on individual qubits; preserves real-valued amplitudes.'
  },
  angle_rx: {
    label: 'Angle Encoding (Rx)',
    group: 'Single-Qubit Rotations',
    qubits: 'O(N) qubits',
    depth: 'Depth 1',
    cnot: '0 CNOTs',
    formula: '|ψ(x)⟩ = ⨂ (cos(xᵢ/2)|0⟩ - i·sin(xᵢ/2)|1⟩)',
    desc: 'Rotates around Bloch X axis; generates complex phase state components.'
  },
  angle_rz: {
    label: 'Angle Encoding (Rz on |+⟩)',
    group: 'Single-Qubit Rotations',
    qubits: 'O(N) qubits',
    depth: 'Depth 2',
    cnot: '0 CNOTs',
    formula: '|ψ(x)⟩ = ⨂ (1/√2)(e^{-i·xᵢ/2}|0⟩ + e^{i·xᵢ/2}|1⟩)',
    desc: 'Initializes equal superposition H|0⟩ then rotates azimuthally via Rz.'
  },
  phase: {
    label: 'Phase Encoding (H + Rz)',
    group: 'Single-Qubit Rotations',
    qubits: 'O(N) qubits',
    depth: 'Depth 2',
    cnot: '0 CNOTs',
    formula: '|ψ(x)⟩ = (1/√2ⁿ) ∑ e^{i·xₖ} |k⟩',
    desc: 'Encodes data into relative phases of equal superposition for Fourier transforms.'
  },
  amplitude: {
    label: 'Amplitude Encoding',
    group: 'Compression & Discrete',
    qubits: 'O(log₂N) qubits',
    depth: 'O(2ⁿ)',
    cnot: 'O(2ⁿ) CNOTs',
    formula: '|ψ(x)⟩ = (1/‖x‖) ∑ xᵢ |i⟩',
    desc: 'Exponential Hilbert compression; encodes 2ⁿ features into n qubits.'
  },
  dense: {
    label: 'Dense Angle Encoding',
    group: 'Compression & Discrete',
    qubits: 'O(N/2) qubits',
    depth: 'Depth 2',
    cnot: '0 CNOTs',
    formula: '|ψ(x)⟩ = ⨂ Rz(x₂ⱼ₊₁) Ry(x₂ⱼ) |0⟩',
    desc: 'Packs 2 features per qubit using polar (Ry) and azimuthal (Rz) angles.'
  },
  basis: {
    label: 'Basis Encoding',
    group: 'Compression & Discrete',
    qubits: 'O(N) qubits',
    depth: 'Depth 1',
    cnot: '0 CNOTs',
    formula: '|ψ(x)⟩ = |b₁ b₂ ... bₙ⟩',
    desc: 'Direct binary mapping into computational basis via Pauli-X bit flips.'
  },
  zz_feature_map: {
    label: 'ZZ Feature Map (Entangled)',
    group: 'Quantum Feature Maps & Kernels',
    qubits: 'O(N) qubits',
    depth: 'O(N · reps)',
    cnot: 'O(N² · reps)',
    formula: 'U_Φ(x) = exp(i ∑ xⱼ Zⱼ + i ∑ (π-xⱼ)(π-xₖ) ZⱼZₖ) H^{⊗n}',
    desc: 'Havlíček et al. (Nature 2019) second-order non-linear entangled kernel.'
  },
  z_feature_map: {
    label: 'Z Feature Map (First-Order)',
    group: 'Quantum Feature Maps & Kernels',
    qubits: 'O(N) qubits',
    depth: 'O(reps)',
    cnot: '0 CNOTs',
    formula: 'U_Φ(x) = exp(i ∑ xⱼ Zⱼ) H^{⊗n}',
    desc: 'First-order Pauli-Z kernel generating non-entangled product states.'
  },
  pauli_feature_map: {
    label: 'Pauli Feature Map (Multi-Basis)',
    group: 'Quantum Feature Maps & Kernels',
    qubits: 'O(N) qubits',
    depth: 'O(N · reps)',
    cnot: 'O(N² · reps)',
    formula: 'U_Φ(x) = exp(i ∑ θ_S ⨂_{j∈S} P_j) H^{⊗n}',
    desc: 'Generalized multi-basis Pauli rotation feature map with cross-qubit entanglement.'
  },
  iqp: {
    label: 'IQP Feature Map',
    group: 'Quantum Feature Maps & Kernels',
    qubits: 'O(N) qubits',
    depth: 'O(N)',
    cnot: 'O(N²)',
    formula: 'H^{⊗n} exp(i ∑ xᵢ Zᵢ + i ∑ xᵢxⱼ ZᵢZⱼ) H^{⊗n}',
    desc: 'Instantaneous Quantum Polynomial architecture with diagonal commuting phases.'
  },
  hamiltonian: {
    label: 'Hamiltonian Evolution',
    group: 'Quantum Feature Maps & Kernels',
    qubits: 'O(N) qubits',
    depth: 'O(N · steps)',
    cnot: 'O(N² · steps)',
    formula: 'U(x, t) = exp(-i [∑ xᵢ Xᵢ + ∑ xᵢxⱼ ZᵢZⱼ] t)',
    desc: 'Continuous-time evolution exp(-i H(x) t) under transverse Ising data Hamiltonian.'
  }
};

export const DataLab: React.FC<DataLabProps> = ({ dataset, setDataset, config, setConfig, onNavigateTab }) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedPointIndex, setSelectedPointIndex] = useState<number>(0);
  const [encoding, setEncoding] = useState<string>('angle');
  
  const activeEncodingMeta = ENCODING_METADATA[encoding] || ENCODING_METADATA.angle;
  
  // Ingestion Source Mode
  const [sourceMode, setSourceMode] = useState<'synthetic' | 'benchmark' | 'upload'>('synthetic');
  const [activeViewTab, setActiveViewTab] = useState<'scatter' | 'table' | 'statistics'>('scatter');
  
  // Custom CSV Ingestion State
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [csvRawText, setCsvRawText] = useState<string>('');
  const [csvPreview, setCsvPreview] = useState<CSVParsedPreview | null>(null);
  const [selectedTargetCol, setSelectedTargetCol] = useState<string>('');
  const [selectedFeatureCols, setSelectedFeatureCols] = useState<string[]>([]);
  const [dimReduction, setDimReduction] = useState<'pca' | 'select' | 'none'>('pca');
  const [nComponents, setNComponents] = useState<number>(2);
  const [showPasteModal, setShowPasteModal] = useState<boolean>(false);
  const [pasteInputText, setPasteInputText] = useState<string>('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  // Table pagination
  const [tablePage, setTablePage] = useState<number>(0);
  const rowsPerPage = 10;

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load/Generate Dataset
  const handleGenerate = async () => {
    setLoading(true);
    setUploadError(null);
    try {
      const res = await api.generateDataset(config);
      setDataset(res);
      setSelectedPointIndex(0);
      setTablePage(0);
      showToast(`Generated ${config.dataset_type} dataset with ${res.X?.length || 0} samples!`, 'success', 'Dataset Ready');
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Error generating dataset', 'error', 'Dataset Error');
    } finally {
      setLoading(false);
    }
  };

  // Inspect CSV file
  const inspectCSVText = async (text: string, fileName?: string) => {
    setLoading(true);
    setUploadError(null);
    try {
      const preview = await api.previewCSV(text);
      setCsvRawText(text);
      setCsvPreview(preview);
      if (fileName) setUploadedFileName(fileName);
      
      // Auto-select target column
      const target = preview.suggested_target || (preview.columns.length > 0 ? preview.columns[preview.columns.length - 1] : '');
      setSelectedTargetCol(target);
      
      // Auto-select numeric features
      const features = (preview.numeric_columns || preview.columns).filter((c: string) => c !== target);
      setSelectedFeatureCols(features.slice(0, 8)); // select first features by default
    } catch (err: any) {
      setUploadError(err.message || 'Error inspecting CSV file');
    } finally {
      setLoading(false);
    }
  };

  // Handle file drop & upload
  const handleFile = (file: File) => {
    if (!file) return;
    setUploadedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) inspectCSVText(text, file.name);
    };
    reader.readAsText(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  // Confirm custom CSV ingestion
  const handleIngestCustomCSV = async () => {
    if (!csvRawText) return;
    setLoading(true);
    setUploadError(null);
    try {
      const res = await api.uploadCSV(
        csvRawText,
        selectedTargetCol || undefined,
        selectedFeatureCols.length > 0 ? selectedFeatureCols : undefined,
        config.normalization || 'minmax',
        dimReduction,
        nComponents,
        config.test_split ?? 0.3
      );
      setDataset(res);
      setConfig(prev => ({ ...prev, dataset_type: 'custom_csv' }));
      setSelectedPointIndex(0);
      setTablePage(0);
    } catch (err: any) {
      setUploadError(err.message || 'Failed to ingest and preprocess CSV');
    } finally {
      setLoading(false);
    }
  };

  // Export dataset to CSV download
  const handleExportCSV = () => {
    if (!dataset || !dataset.X) return;
    const featureHeaders = dataset.feature_names || ['x1', 'x2'];
    const headerRow = [...featureHeaders, 'label', 'split'].join(',');
    const testCount = dataset.test_X?.length || 0;
    const splitCutoff = dataset.X.length - testCount;

    const dataRows = dataset.X.map((pt, idx) => {
      const label = dataset.y[idx] ?? 0;
      const split = idx >= splitCutoff ? 'test' : 'train';
      return [...pt.map(v => v.toFixed(5)), label, split].join(',');
    });

    const csvContent = [headerRow, ...dataRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `qml_${config.dataset_type}_dataset.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Initial load
  useEffect(() => {
    if (!dataset) {
      handleGenerate();
    }
  }, []);

  // Class distributions
  const class0Count = (dataset?.y || []).filter(c => c === 0).length;
  const class1Count = (dataset?.y || []).filter(c => c === 1).length;
  const totalSamples = dataset?.X?.length || 0;
  const class0Ratio = totalSamples > 0 ? ((class0Count / totalSamples) * 100).toFixed(0) : '50';
  const class1Ratio = totalSamples > 0 ? ((class1Count / totalSamples) * 100).toFixed(0) : '50';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Banner */}
      <div className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <h2 style={{ fontSize: '1.25rem', color: 'var(--color-text-primary)' }}>Dataset Lab</h2>
            <span className="tag-chip primary">{config.dataset_type.toUpperCase()}</span>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
            Curate synthetic data, load benchmarks, or upload CSV files for quantum model experiments.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <button 
            className="btn btn-secondary btn-sm"
            onClick={handleExportCSV}
            disabled={!dataset || totalSamples === 0}
            title="Download preprocessed dataset for replication"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>

          <button 
            className="btn btn-primary btn-sm"
            onClick={handleGenerate}
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            <span>{loading ? 'Generating...' : 'Generate Dataset'}</span>
          </button>
        </div>
      </div>

      {/* 3-Card Experiment HUD */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
        {/* Card 1: Sample Balance */}
        <div className="metric-card" style={{ borderLeft: '3px solid var(--color-primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="metric-card-label">Sample Allocation</span>
            <span className="tag-chip" style={{ fontSize: '0.7rem' }}>{dataset?.train_X?.length || 0} Tr / {dataset?.test_X?.length || 0} Te</span>
          </div>
          <div className="metric-card-value" style={{ fontSize: '1.4rem' }}>
            {totalSamples} <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Total Samples</span>
          </div>
          <div style={{ marginTop: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.2rem' }}>
              <span>Class 0: {class0Ratio}%</span>
              <span>Class 1: {class1Ratio}%</span>
            </div>
            <div className="compare-bar-track">
              <div 
                className="compare-bar-fill" 
                style={{ width: `${class0Ratio}%`, background: 'var(--color-primary)' }} 
              />
            </div>
          </div>
        </div>

        {/* Card 2: Quantum Hilbert Space Projection */}
        <div className="metric-card" style={{ borderLeft: '3px solid var(--color-purple-fill)' }}>
          <span className="metric-card-label">Hilbert Space Dimension</span>
          <div className="metric-card-value" style={{ fontSize: '1.4rem', color: 'var(--color-purple-text)' }}>
            ℂ^{dataset?.quantum_specs?.hilbert_space_dim ?? 4}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.4rem' }}>
            Requires <strong>{dataset?.quantum_specs?.n_qubits_angle ?? 2} Qubits</strong> for Angle Encoding or <strong>{dataset?.quantum_specs?.n_qubits_amplitude ?? 1} Qubit</strong> for Amplitude.
          </div>
        </div>

        {/* Card 3: Boundary & Value Range Check */}
        <div className="metric-card" style={{ borderLeft: `3px solid ${dataset?.quantum_specs?.angle_overflow_risk ? 'var(--color-gold-text)' : 'var(--color-green-text)'}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="metric-card-label">Rotation Angle Range</span>
            {dataset?.quantum_specs?.angle_overflow_risk ? (
              <span className="tag-chip" style={{ color: 'var(--color-gold-text)' }}>Raw / Broad</span>
            ) : (
              <span className="tag-chip" style={{ color: 'var(--color-green-text)' }}>Normalized [0, π]</span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.25rem' }}>
            {dataset?.quantum_specs?.angle_overflow_risk ? (
              <AlertTriangle size={18} style={{ color: 'var(--color-gold-text)' }} />
            ) : (
              <ShieldCheck size={18} style={{ color: 'var(--color-green-text)' }} />
            )}
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              {dataset?.quantum_specs?.angle_overflow_risk ? 'Periodic Phase Wrapping' : 'Safe for Phase Encoding'}
            </span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.35rem' }}>
            {dataset?.quantum_specs?.value_range_description || 'Values mapped to rotational range.'}
          </div>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid-sidebar">
        {/* Left Column: Source Controls & Preprocessing Pipeline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Source Selector Card */}
          <div className="glass-panel">
            <div className="panel-header">
              <div className="panel-title">
                <Sliders size={18} style={{ color: 'var(--color-primary)' }} />
                <span>1. Data Source Selection</span>
              </div>
            </div>

            {/* Source Mode Toggle */}
            <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '1.25rem' }}>
              {[
                { id: 'synthetic', label: 'Synthetic Topology' },
                { id: 'benchmark', label: 'Benchmarks' },
                { id: 'upload', label: 'Custom CSV' }
              ].map(m => (
                <button
                  key={m.id}
                  className={`btn btn-sm ${sourceMode === m.id ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1, fontSize: '0.75rem', padding: '0.45rem 0.2rem' }}
                  onClick={() => {
                    setSourceMode(m.id as any);
                    if (m.id === 'synthetic') setConfig(p => ({ ...p, dataset_type: 'moons' }));
                    if (m.id === 'benchmark') setConfig(p => ({ ...p, dataset_type: 'iris' }));
                  }}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Mode A: Synthetic Generators */}
            {sourceMode === 'synthetic' && (
              <>
                <div className="form-group">
                  <label className="form-label">Geometric Topology</label>
                  <select 
                    className="form-select"
                    value={config.dataset_type}
                    onChange={(e) => setConfig(prev => ({ ...prev, dataset_type: e.target.value as any }))}
                  >
                    <option value="moons">Two Moons (Interleaved Crescents - Non-linear)</option>
                    <option value="circles">Concentric Circles (Radially Inseparable)</option>
                    <option value="xor">Quantum XOR (Corner Parity - Classical Failure)</option>
                    <option value="blobs">Gaussian Blobs (Isotropic Clusters)</option>
                    <option value="linear">Linearly Separable (Hyperplane Benchmark)</option>
                  </select>
                </div>

                <div className="form-group">
                  <div className="slider-label-row">
                    <span>Sample Count (N)</span>
                    <span className="slider-val-badge">{config.n_samples} samples</span>
                  </div>
                  <input 
                    type="range" 
                    min="40" 
                    max="300" 
                    step="20"
                    className="range-slider"
                    value={config.n_samples}
                    onChange={(e) => setConfig(prev => ({ ...prev, n_samples: Number(e.target.value) }))}
                  />
                </div>

                <div className="form-group">
                  <div className="slider-label-row">
                    <span>Noise Dispersion (σ)</span>
                    <span className="slider-val-badge">{config.noise.toFixed(2)}</span>
                  </div>
                  <input 
                    type="range" 
                    min="0.0" 
                    max="0.35" 
                    step="0.02"
                    className="range-slider"
                    value={config.noise}
                    onChange={(e) => setConfig(prev => ({ ...prev, noise: Number(e.target.value) }))}
                  />
                </div>
              </>
            )}

            {/* Mode B: Real Scientific Benchmarks */}
            {sourceMode === 'benchmark' && (
              <div className="form-group">
                <label className="form-label">Peer-Reviewed Benchmark</label>
                <select 
                  className="form-select"
                  value={config.dataset_type}
                  onChange={(e) => setConfig(prev => ({ ...prev, dataset_type: e.target.value as any }))}
                >
                  <option value="iris">Fisher's Iris (Setosa vs Versicolor, 2-class)</option>
                  <option value="breast_cancer">Wisconsin Breast Cancer (WDBC - Malignant vs Benign)</option>
                  <option value="wine">Wine Recognition (Italian Cultivars, Class 0 vs 1)</option>
                  <option value="digits">Optical Digits (Handwritten 0 vs 1, PCA-projected)</option>
                </select>
                <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--color-text-secondary)', lineHeight: '1.4' }}>
                  Features are mapped via Principal Component Analysis (PCA) directly to 2-qubit Hilbert coordinates with explained variance tracking.
                </div>
              </div>
            )}

            {/* Mode C: Custom CSV Ingestion */}
            {sourceMode === 'upload' && (
              <div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  accept=".csv,.txt" 
                  style={{ display: 'none' }} 
                  onChange={handleFileUpload} 
                />

                {/* Dropzone */}
                <div 
                  style={{
                    border: isDragOver ? '2px dashed var(--color-primary)' : '2px dashed var(--color-border-strong)',
                    borderRadius: '10px',
                    padding: '1.5rem 1rem',
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: isDragOver ? 'var(--color-primary-soft)' : 'var(--color-surface-soft)',
                    transition: 'all 0.2s ease'
                  }}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload size={28} style={{ color: 'var(--color-primary)', margin: '0 auto 0.4rem auto' }} />
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    Drop CSV file here or click to browse
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                    {uploadedFileName || 'Accepts tabular data (.csv, .txt)'}
                  </div>
                </div>

                {/* Or Paste Raw Text */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.6rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Prefer pasting directly?</span>
                  <button 
                    className="btn btn-secondary btn-sm" 
                    style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                    onClick={() => setShowPasteModal(true)}
                  >
                    Paste CSV Text
                  </button>
                </div>

                {uploadError && (
                  <div style={{ marginTop: '0.75rem', padding: '0.6rem', borderRadius: '6px', background: 'var(--color-red-soft)', border: '1px solid var(--color-red-border)', color: 'var(--color-red-text)', fontSize: '0.75rem' }}>
                    {uploadError}
                  </div>
                )}

                {/* Schema Mapper & Column Selector */}
                {csvPreview && (
                  <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-green-text)', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.75rem' }}>
                      <CheckCircle size={15} />
                      <span>Detected {csvPreview.num_rows_estimated} rows, {csvPreview.columns.length} columns</span>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Target / Label Column</label>
                      <select 
                        className="form-select"
                        value={selectedTargetCol}
                        onChange={(e) => {
                          const target = e.target.value;
                          setSelectedTargetCol(target);
                          setSelectedFeatureCols(prev => prev.filter(c => c !== target));
                        }}
                      >
                        {csvPreview.columns.map(col => (
                          <option key={col} value={col}>
                            {col} {col === csvPreview.suggested_target ? '(Detected Target)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Dimensional Reduction</label>
                      <select 
                        className="form-select"
                        value={dimReduction}
                        onChange={(e) => setDimReduction(e.target.value as any)}
                      >
                        <option value="pca">PCA Projection to {nComponents} Qubits (Preserve Maximum Variance)</option>
                        <option value="select">Select First {nComponents} Features Directly</option>
                        <option value="none">Keep All Features (High-Qubit Circuit)</option>
                      </select>
                    </div>

                    <button 
                      className="btn btn-primary"
                      style={{ width: '100%', marginTop: '0.5rem' }}
                      onClick={handleIngestCustomCSV}
                      disabled={loading}
                    >
                      <Sparkles size={16} />
                      <span>{loading ? 'Ingesting...' : 'Ingest & Preprocess Dataset'}</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Preprocessing & Encoding Configuration */}
          <div className="glass-panel">
            <div className="panel-header">
              <div className="panel-title">
                <Sliders size={18} style={{ color: 'var(--color-primary)' }} />
                <span>2. Quantum Preprocessing</span>
              </div>
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <label className="form-label" style={{ margin: 0 }}>Feature Normalization</label>
                <span className="tag-chip primary" style={{ fontSize: '0.65rem' }}>Recommended: [0, π]</span>
              </div>
              <select 
                className="form-select"
                value={config.normalization}
                onChange={(e) => setConfig(prev => ({ ...prev, normalization: e.target.value as any }))}
              >
                <option value="minmax">Min-Max [0, π] (Bloch Ry Angles — Safe from overflow)</option>
                <option value="minmax_1">Min-Max [0, 1] (Probabilistic interval)</option>
                <option value="minmax_symmetric">Min-Max [-1, 1] (Zero-centered Symmetric)</option>
                <option value="zscore">Z-Score Standardization (Zero-Mean, Unit-Std)</option>
                <option value="norm2">L2 Unit Norm (Required for Amplitude Encoding)</option>
                <option value="none">Raw Features (Unscaled)</option>
              </select>
            </div>

            <div className="form-group">
              <div className="slider-label-row">
                <span>Train / Test Split Ratio</span>
                <span className="slider-val-badge">
                  {Math.round((1 - (config.test_split ?? 0.3)) * 100)}% Train / {Math.round((config.test_split ?? 0.3) * 100)}% Test
                </span>
              </div>
              <input 
                type="range" 
                min="0.1" 
                max="0.5" 
                step="0.05"
                className="range-slider"
                value={config.test_split ?? 0.3}
                onChange={(e) => setConfig(prev => ({ ...prev, test_split: Number(e.target.value) }))}
              />
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <label className="form-label" style={{ margin: 0 }}>Quantum State Feature Map / Data Encoding</label>
                <span className="tag-chip primary" style={{ fontSize: '0.65rem' }}>12 Protocols Available</span>
              </div>
              <select 
                className="form-select"
                value={encoding}
                onChange={(e) => setEncoding(e.target.value)}
              >
                <optgroup label="Single-Qubit Angle Rotations">
                  <option value="angle">Angle Encoding — Ry Rotations (O(N) Qubits, Depth 1)</option>
                  <option value="angle_rx">Angle Encoding — Rx Rotations (O(N) Qubits, Depth 1)</option>
                  <option value="angle_rz">Angle Encoding — Rz on |+⟩ (O(N) Qubits, Depth 2)</option>
                  <option value="phase">Phase Encoding — H + Rz Relative Phase (O(N) Qubits)</option>
                </optgroup>
                <optgroup label="Compression & Discrete Mappings">
                  <option value="amplitude">Amplitude Encoding — Normalized Statevector (O(log₂N) Qubits)</option>
                  <option value="dense">Dense Angle Encoding — 2 Features/Qubit (Ry+Rz, O(N/2) Qubits)</option>
                  <option value="basis">Basis Encoding — Computational Basis |x⟩ (Binary, O(N) Qubits)</option>
                </optgroup>
                <optgroup label="Entangled Feature Maps & Quantum Kernels">
                  <option value="zz_feature_map">ZZ Feature Map — Second-Order Entangled Kernel (Havlíček)</option>
                  <option value="z_feature_map">Z Feature Map — First-Order Non-Entangling Pauli-Z</option>
                  <option value="pauli_feature_map">Pauli Feature Map — Generalized Multi-Basis Pauli Expansion</option>
                  <option value="iqp">IQP Feature Map — Instantaneous Quantum Polynomial</option>
                  <option value="hamiltonian">Hamiltonian Evolution — Trotterized Dynamic Encoding</option>
                </optgroup>
              </select>

              {/* Protocol Spec Pills */}
              {activeEncodingMeta && (
                <div style={{ marginTop: '0.5rem', padding: '0.5rem 0.75rem', background: 'var(--color-surface-soft)', borderRadius: '6px', border: '1px solid var(--color-border)', fontSize: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem', flexWrap: 'wrap', gap: '0.3rem' }}>
                    <strong style={{ color: 'var(--color-primary)' }}>{activeEncodingMeta.label}</strong>
                    <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                      <span className="tag-chip" style={{ fontSize: '0.65rem' }}>{activeEncodingMeta.qubits}</span>
                      <span className="tag-chip" style={{ fontSize: '0.65rem' }}>{activeEncodingMeta.depth}</span>
                      <span className="tag-chip" style={{ fontSize: '0.65rem' }}>{activeEncodingMeta.cnot}</span>
                    </div>
                  </div>
                  <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.72rem', lineHeight: '1.4' }}>
                    {activeEncodingMeta.desc}
                  </div>
                </div>
              )}
            </div>

            {sourceMode !== 'upload' && (
              <button 
                className="btn btn-primary" 
                style={{ width: '100%', marginTop: '0.4rem' }}
                onClick={handleGenerate}
                disabled={loading}
              >
                <Sparkles size={16} />
                <span>{loading ? 'Processing...' : 'Apply & Ingest to Pipeline'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Multi-View Inspection Studio */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Main Inspection Card with Tab Switcher */}
          <div className="glass-panel">
            <div className="panel-header" style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div className="panel-title">
                  <Database size={18} style={{ color: 'var(--color-primary)' }} />
                  <span>Dataset Exploration</span>
                </div>

                <div style={{ display: 'flex', gap: '0.25rem', background: 'var(--color-surface-soft)', padding: '0.2rem', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                  <button
                    className={`btn btn-sm ${activeViewTab === 'scatter' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                    onClick={() => setActiveViewTab('scatter')}
                  >
                    <Eye size={13} />
                    <span>2D Feature Space</span>
                  </button>
                  <button
                    className={`btn btn-sm ${activeViewTab === 'table' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                    onClick={() => setActiveViewTab('table')}
                  >
                    <Table size={13} />
                    <span>Sample Table</span>
                  </button>
                  <button
                    className={`btn btn-sm ${activeViewTab === 'statistics' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                    onClick={() => setActiveViewTab('statistics')}
                  >
                    <BarChart2 size={13} />
                    <span>Distributions & Stats</span>
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <span className="tag-chip primary">● Class 0 ({class0Count})</span>
                <span className="tag-chip purple">● Class 1 ({class1Count})</span>
              </div>
            </div>

            {/* TAB 1: 2D Feature Space Representation */}
            {activeViewTab === 'scatter' && (
              <div style={{ position: 'relative', width: '100%', height: '380px', background: 'var(--color-surface-soft)', borderRadius: '12px', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
                <svg width="100%" height="100%" viewBox="0 0 500 340" style={{ cursor: 'crosshair' }}>
                  {/* Grid Lines */}
                  <line x1="50" y1="20" x2="50" y2="300" stroke="var(--color-border)" strokeDasharray="3 3" />
                  <line x1="250" y1="20" x2="250" y2="300" stroke="var(--color-border)" strokeDasharray="3 3" />
                  <line x1="450" y1="20" x2="450" y2="300" stroke="var(--color-border)" strokeDasharray="3 3" />
                  <line x1="50" y1="160" x2="450" y2="160" stroke="var(--color-border)" strokeDasharray="3 3" />

                  {/* Axis Labels */}
                  <text x="50" y="318" fill="var(--color-text-secondary)" fontSize="10" fontFamily="var(--font-mono)">
                    {dataset?.feature_names?.[0] || 'Feature 1'}
                  </text>
                  <text x="12" y="25" fill="var(--color-text-secondary)" fontSize="10" fontFamily="var(--font-mono)">
                    {dataset?.feature_names?.[1] || 'Feature 2'}
                  </text>

                  {/* Data points */}
                  {(dataset?.X || []).map((pt, idx) => {
                    const label = (dataset?.y || [])[idx] ?? 0;
                    const isSelected = idx === selectedPointIndex;
                    const isTest = idx >= (totalSamples - (dataset?.test_X?.length || 0));
                    
                    // Domain projection to SVG viewport
                    const xNorm = pt[0] ?? 0;
                    const yNorm = pt[1] ?? 0;
                    const cx = 250 + (xNorm - (dataset?.summary_stats?.[dataset?.feature_names?.[0]]?.mean ?? 1.5)) * 75;
                    const cy = 160 - (yNorm - (dataset?.summary_stats?.[dataset?.feature_names?.[1]]?.mean ?? 0.5)) * 75;
                    const color = label === 0 ? 'var(--color-primary)' : 'var(--color-purple-fill)';

                    return (
                      <g key={idx}>
                        {isSelected && (
                          <circle
                            cx={Math.max(55, Math.min(445, cx))}
                            cy={Math.max(25, Math.min(295, cy))}
                            r={12}
                            fill="none"
                            stroke="var(--color-primary)"
                            strokeWidth={2}
                            opacity={0.6}
                          />
                        )}
                        <circle
                          cx={Math.max(55, Math.min(445, cx))}
                          cy={Math.max(25, Math.min(295, cy))}
                          r={isSelected ? 7 : (isTest ? 4.5 : 4)}
                          fill={isTest ? 'var(--color-surface)' : color}
                          fillOpacity={isTest ? 0.9 : 0.85}
                          stroke={color}
                          strokeWidth={isTest ? 2 : 1}
                          style={{ transition: 'all 0.15s ease', cursor: 'pointer' }}
                          onClick={() => setSelectedPointIndex(idx)}
                        >
                          <title>Sample #{idx} | [{pt[0]?.toFixed(2)}, {pt[1]?.toFixed(2)}] | Class {label} ({isTest ? 'Test' : 'Train'})</title>
                        </circle>
                      </g>
                    );
                  })}
                </svg>

                <div style={{ position: 'absolute', bottom: '10px', left: '16px', display: 'flex', gap: '1rem', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                  <span>● Solid: Train Set</span>
                  <span>○ Hollow: Test Set</span>
                </div>

                <div style={{ position: 'absolute', bottom: '10px', right: '16px', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  Click any sample to inspect its Quantum Hilbert state |ψ(x)⟩
                </div>
              </div>
            )}

            {/* TAB 2: Data Samples Table Explorer */}
            {activeViewTab === 'table' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ maxHeight: '340px', overflowY: 'auto', border: '1px solid var(--color-border)', borderRadius: '8px' }}>
                  <table>
                    <thead>
                      <tr>
                        <th># Index</th>
                        <th>{dataset?.feature_names?.[0] || 'x₁'}</th>
                        <th>{dataset?.feature_names?.[1] || 'x₂'}</th>
                        <th>Target Class</th>
                        <th>Dataset Split</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(dataset?.X || []).slice(tablePage * rowsPerPage, (tablePage + 1) * rowsPerPage).map((pt, rIdx) => {
                        const actualIdx = tablePage * rowsPerPage + rIdx;
                        const label = dataset?.y?.[actualIdx] ?? 0;
                        const isTest = actualIdx >= (totalSamples - (dataset?.test_X?.length || 0));
                        const isSelected = actualIdx === selectedPointIndex;

                        return (
                          <tr 
                            key={actualIdx}
                            style={{ 
                              background: isSelected ? 'var(--color-primary-soft)' : 'transparent',
                              cursor: 'pointer'
                            }}
                            onClick={() => setSelectedPointIndex(actualIdx)}
                          >
                            <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                              {actualIdx} {isSelected && '★'}
                            </td>
                            <td style={{ fontFamily: 'var(--font-mono)' }}>{pt[0]?.toFixed(4)}</td>
                            <td style={{ fontFamily: 'var(--font-mono)' }}>{pt[1]?.toFixed(4)}</td>
                            <td>
                              <span className={`tag-chip ${label === 0 ? 'primary' : 'purple'}`}>
                                Class {label}
                              </span>
                            </td>
                            <td>
                              <span className="tag-chip" style={{ fontSize: '0.7rem' }}>
                                {isTest ? 'Test' : 'Train'}
                              </span>
                            </td>
                            <td>
                              <button 
                                className="btn btn-secondary btn-sm"
                                style={{ padding: '0.15rem 0.4rem', fontSize: '0.7rem' }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedPointIndex(actualIdx);
                                }}
                              >
                                Inspect State
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Toolbar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                  <span>Showing samples {tablePage * rowsPerPage + 1} – {Math.min(totalSamples, (tablePage + 1) * rowsPerPage)} of {totalSamples}</span>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button 
                      className="btn btn-secondary btn-sm"
                      disabled={tablePage === 0}
                      onClick={() => setTablePage(p => Math.max(0, p - 1))}
                    >
                      Previous
                    </button>
                    <button 
                      className="btn btn-secondary btn-sm"
                      disabled={(tablePage + 1) * rowsPerPage >= totalSamples}
                      onClick={() => setTablePage(p => p + 1)}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: Feature Distributions & Statistics */}
            {activeViewTab === 'statistics' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                  {(dataset?.feature_names || ['x₁', 'x₂']).map((name, fIdx) => {
                    const stats = dataset?.summary_stats?.[name] || { min: 0, max: 0, mean: 0, std: 0 };
                    return (
                      <div key={name} className="metric-card" style={{ borderLeft: `3px solid ${fIdx === 0 ? 'var(--color-primary)' : 'var(--color-purple-fill)'}` }}>
                        <span className="metric-card-label">{name} Profile</span>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.5rem', fontSize: '0.8rem' }}>
                          <div>
                            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>Minimum:</span>
                            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{stats.min}</div>
                          </div>
                          <div>
                            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>Maximum:</span>
                            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{stats.max}</div>
                          </div>
                          <div>
                            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>Mean (μ):</span>
                            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{stats.mean}</div>
                          </div>
                          <div>
                            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>Std Dev (σ):</span>
                            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{stats.std}</div>
                          </div>
                        </div>

                        <div className="compare-bar-track" style={{ marginTop: '0.75rem' }}>
                          <div 
                            className="compare-bar-fill" 
                            style={{ 
                              width: '100%', 
                              background: fIdx === 0 ? 'var(--color-primary)' : 'var(--color-purple-fill)' 
                            }} 
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Raw CSV Text Paste Modal */}
      {showPasteModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'var(--color-scrim)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }}>
          <div className="glass-panel" style={{ width: '90%', maxWidth: '600px', background: 'var(--color-surface)', boxShadow: '0 10px 40px var(--color-shadow)' }}>
            <div className="panel-header">
              <div className="panel-title">
                <FileText size={18} style={{ color: 'var(--color-primary)' }} />
                <span>Paste Tabular CSV Content</span>
              </div>
              <button 
                className="btn btn-secondary btn-sm" 
                style={{ padding: '0.2rem' }}
                onClick={() => setShowPasteModal(false)}
              >
                <X size={16} />
              </button>
            </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '0.75rem' }}>
              Paste comma-separated rows including header (e.g. from Excel, Colab, or papers):
            </p>

            <textarea 
              rows={8}
              className="form-control"
              style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}
              placeholder="feature1,feature2,feature3,label&#10;1.2,0.4,2.1,0&#10;2.3,1.8,0.9,1&#10;0.8,0.2,1.5,0"
              value={pasteInputText}
              onChange={(e) => setPasteInputText(e.target.value)}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
              <button 
                className="btn btn-secondary btn-sm"
                onClick={() => setShowPasteModal(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary btn-sm"
                onClick={() => {
                  setShowPasteModal(false);
                  if (pasteInputText.trim()) {
                    inspectCSVText(pasteInputText, 'pasted_dataset.csv');
                  }
                }}
              >
                Inspect & Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {dataset?.X && dataset.X.length > 0 && onNavigateTab && (
        <div className="workflow-next-steps-card glass-panel" style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', padding: '1rem 1.25rem' }}>
          <div>
            <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              Dataset Ready ({dataset.X.length} Samples, {dataset.feature_names.length} Features)
            </h4>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
              Data prepared and normalized. Ready to configure quantum models and training parameters.
            </p>
          </div>
          <div>
            <button className="btn btn-primary btn-sm" onClick={() => onNavigateTab('modellab')}>
              <Cpu size={14} />
              <span>Proceed to Model & Training</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
