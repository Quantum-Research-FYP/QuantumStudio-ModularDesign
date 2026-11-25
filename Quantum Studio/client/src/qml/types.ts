export type TabType = 
  | 'datalab' 
  | 'encodinglab'
  | 'modellab' 
  | 'ansatzdesigner'
  | 'ansatzsearch' 
  | 'reuploading'
  | 'barrenplateau' 
  | 'hardwarelab' 
  | 'benchmark'
  | 'analysis'
  | 'experiments'
  | 'reports';

export type WorkflowPillar = 'data' | 'circuit' | 'training' | 'evaluation';

export interface ToastMessage {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  message: string;
  duration?: number;
}

export interface TrainingStatsState {
  trainAcc: number;
  testAcc: number;
  loss: number;
  modelType: string;
  epochs?: number;
  timestamp: number;
}

export interface ResearchPreset {
  id: string;
  title: string;
  badge: string;
  category: string;
  pillColor: string;
  description: string;
  datasetConfig: DatasetConfig;
  targetTab: TabType;
  modelConfig?: Partial<ModelConfig>;
  specs: {
    qubits: number;
    encoding: string;
    ansatz?: string;
    hardware?: string;
  };
}

export interface DatasetConfig {
  dataset_type: 'moons' | 'circles' | 'blobs' | 'xor' | 'spiral' | 'linear' | 'iris' | 'breast_cancer' | 'wine' | 'digits' | 'custom_csv';
  n_samples: number;
  noise: number;
  normalization: 'minmax' | 'minmax_1' | 'minmax_symmetric' | 'zscore' | 'norm2' | 'none';
  n_features: number;
  test_split?: number;
  dim_reduction?: 'pca' | 'select' | 'none';
}

export interface DatasetStatistics {
  min: number;
  max: number;
  mean: number;
  std: number;
}

export interface QuantumReadinessSpecs {
  n_qubits_angle: number;
  n_qubits_amplitude: number;
  hilbert_space_dim: number;
  angle_overflow_risk: boolean;
  l2_normalized: boolean;
  value_range_description: string;
  domain_min?: number;
  domain_max?: number;
}

export interface CSVParsedPreview {
  columns: string[];
  num_rows_estimated: number;
  numeric_columns: string[];
  categorical_columns: string[];
  suggested_target: string | null;
  sample_rows: Record<string, any>[];
}

export interface DatasetResponse {
  X: number[][];
  y: number[];
  train_X: number[][];
  train_y: number[];
  test_X: number[][];
  test_y: number[];
  feature_names: string[];
  class_labels: number[];
  summary_stats?: Record<string, DatasetStatistics>;
  quantum_specs?: QuantumReadinessSpecs;
  explained_variance_ratio?: number | null;
  label_mapping?: Record<string, number>;
  raw_preview?: Array<Record<string, any>>;
  class_distribution?: Record<string, number>;
}

export interface EncodingConfig {
  encoding_type: 
    | 'angle' 
    | 'angle_rx' 
    | 'angle_rz' 
    | 'amplitude' 
    | 'dense' 
    | 'basis' 
    | 'phase' 
    | 'zz_feature_map' 
    | 'z_feature_map' 
    | 'pauli_feature_map' 
    | 'iqp' 
    | 'hamiltonian';
  reps: number;
  entanglement: 'linear' | 'full' | 'circular';
}

export interface QuantumStateVector {
  amplitudes: { state: string; real: number; imag: number; probability: number }[];
  n_qubits: number;
}

export interface ModelConfig {
  model_type: 'qke' | 'vqc' | 'qnn';
  ansatz: 'RealAmplitudes' | 'EfficientSU2' | 'TwoLocal' | 'PauliTwoLocal';
  feature_map: 'ZZFeatureMap' | 'ZFeatureMap' | 'PauliFeatureMap';
  reps: number;
  entanglement: 'linear' | 'full' | 'circular';
  optimizer: 'COBYLA' | 'SPSA' | 'ADAM';
  max_iter: number;
  learning_rate: number;
}

export interface TrainingProgress {
  epoch: number;
  loss: number;
  accuracy: number;
}

export interface HardwareConfig {
  backend: 'aer_simulator' | 'fake_manila' | 'fake_quito' | 'fake_brisbane' | 'statevector_simulator';
  shots: number;
  optimization_level: number;
  noise_model: 'none' | 'depolarizing' | 'thermal' | 'readout';
  error_rate: number;
}

export interface TranspilationResult {
  depth: number;
  total_gates: number;
  cnot_count: number;
  single_qubit_gates: number;
  estimated_fidelity: number;
  circuit_ascii: string;
}

export interface ConfusionMatrixData {
  matrix: number[][];
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
}

export interface BarrenPlateauPoint {
  qubits: number;
  variance: number;
  gradient_mean: number;
}

export interface AnsatzCandidate {
  name: string;
  type: string;
  reps: number;
  entanglement: string;
  depth: number;
  parameters: number;
  expressibility: number;
  entangling_capability: number;
  trainability_score: number;
  hardware_score: number;
}

export interface BenchmarkResult {
  model: string;
  type: 'Quantum' | 'Classical';
  train_accuracy: number;
  test_accuracy: number;
  f1_score: number;
  train_time_ms: number;
  n_parameters: number;
  advantage_score?: number;
}

// === NEW RESEARCH SUITE TYPES ===

export interface EncodingCostItem {
  id: string;
  name: string;
  qubits: number;
  depth: number;
  single_qubit_gates: number;
  two_qubit_gates: number;
  total_gates: number;
  state_prep_overhead: string;
  noise_exposure: number;
  main_concern: string;
  scaling_qubits: string;
  scaling_depth: string;
  recommended_use: string;
  description: string;
}

export interface EncodingCostResponse {
  n_features: number;
  input_features: number[];
  encodings: EncodingCostItem[];
  optimal_for_nisq: string;
  optimal_for_qubit_count: string;
  synthesis_summary: string;
}

export interface ReuploadingComparisonResponse {
  standard_vqc: {
    architecture: string;
    layers: number;
    parameter_count: number;
    circuit_depth: number;
    total_gates: number;
    two_qubit_gates: number;
    final_train_accuracy: number;
    final_test_accuracy: number;
    final_loss: number;
    gradient_variance: number;
    noise_sensitivity: number;
    expressibility_score: number;
    history: TrainingProgress[];
  };
  data_reuploading: {
    architecture: string;
    layers: number;
    parameter_count: number;
    circuit_depth: number;
    total_gates: number;
    two_qubit_gates: number;
    final_train_accuracy: number;
    final_test_accuracy: number;
    final_loss: number;
    gradient_variance: number;
    noise_sensitivity: number;
    expressibility_score: number;
    history: TrainingProgress[];
  };
  scientific_takeaway: string;
}

export interface ExperimentEntity {
  id: string;
  name: string;
  research_question: string;
  hypothesis: string;
  dataset_name: string;
  model_type: string;
  n_qubits: number;
  depth: number;
  ansatz: string;
  encoding: string;
  optimizer: string;
  backend: string;
  shots: number;
  random_seed: number;
  status: 'DRAFT' | 'CONFIGURED' | 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'ANALYZED' | 'PUBLISHED';
  created_at: number;
  metrics?: {
    train_accuracy: number;
    test_accuracy: number;
    final_loss: number;
    gradient_variance: number;
    circuit_depth: number;
    total_gates: number;
    two_qubit_gates: number;
    execution_time_ms: number;
  };
}

export interface MultiLevelExplanation {
  circuit_level: {
    title: string;
    explanation: string;
    gate_breakdown: string;
  };
  model_level: {
    title: string;
    explanation: string;
    trainability_verdict: string;
  };
  hardware_level: {
    title: string;
    explanation: string;
    noise_exposure_verdict: string;
  };
  research_level: {
    title: string;
    explanation: string;
    formal_conclusion: string;
  };
}

export interface AcademicReport {
  title: string;
  date_generated: string;
  sections: { num: number; heading: string; content: string }[];
  full_markdown: string;
}

