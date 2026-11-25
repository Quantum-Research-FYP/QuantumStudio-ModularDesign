import React, { useState } from 'react';
import { TabType } from '../types';
import { 
  Database, Layers, Sliders, Cpu, Server, Zap, FileText, 
  ChevronRight, ChevronLeft, Info, Sparkles, CheckCircle2, ArrowRight
} from 'lucide-react';

interface PipelineStepperProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  datasetLoaded: boolean;
  onExitGuidedMode: () => void;
}

interface StepDefinition {
  id: string;
  tab: TabType;
  stepNumber: number;
  title: string;
  shortDesc: string;
  objective: string;
  quantumPrinciple: string;
  icon: any;
}

export const PIPELINE_STEPS: StepDefinition[] = [
  {
    id: 'step-data',
    tab: 'datalab',
    stepNumber: 1,
    title: 'Data Preparation',
    shortDesc: 'Normalization & Feature Selection',
    objective: 'Prepare classical features and normalize values into [-π, π] or [0, 1] for rotation angles.',
    quantumPrinciple: 'Quantum state preparation is sensitive to periodic boundary wrap-around; unbounded classical values distort state vector phases.',
    icon: Database
  },
  {
    id: 'step-encoding',
    tab: 'encodinglab',
    stepNumber: 2,
    title: 'Quantum Encoding',
    shortDesc: 'Feature Map Protocol Selection',
    objective: 'Select between Angle, Amplitude, or Pauli Feature Maps evaluating gate depth and CNOT counts.',
    quantumPrinciple: 'Angle encoding requires O(N) qubits and O(1) depth; ZZFeatureMap injects two-qubit entangling phases to create non-classical kernels.',
    icon: Layers
  },
  {
    id: 'step-circuit',
    tab: 'ansatzdesigner',
    stepNumber: 3,
    title: 'Ansatz Architecture',
    shortDesc: 'Parameterized Circuit Design',
    objective: 'Configure parameterized rotation layers and entangling topologies (RealAmplitudes, EfficientSU2).',
    quantumPrinciple: 'High expressibility covers Haar-random state space but can induce barren plateaus; shallow structured circuits preserve trainability.',
    icon: Sliders
  },
  {
    id: 'step-training',
    tab: 'modellab',
    stepNumber: 4,
    title: 'Model Training',
    shortDesc: 'Kernel Estimation / VQC Optimization',
    objective: 'Compute quantum kernel Gram matrix or optimize parameterized variational angles via COBYLA or SPSA.',
    quantumPrinciple: 'Hybrid quantum-classical training uses parameter-shift rules to calculate exact analytic gradients from quantum expectation values.',
    icon: Cpu
  },
  {
    id: 'step-hardware',
    tab: 'hardwarelab',
    stepNumber: 5,
    title: 'Hardware Simulation',
    shortDesc: 'Coupling Maps & Noise Models',
    objective: 'Transpile to realistic Falcon/Heron topologies and model T1/T2 thermal relaxation and depolarizing errors.',
    quantumPrinciple: 'Physical CNOT error rates (~0.5–1%) and decoherence limit effective circuit depth in current Noisy Intermediate-Scale Quantum (NISQ) systems.',
    icon: Server
  },
  {
    id: 'step-arena',
    tab: 'benchmark',
    stepNumber: 6,
    title: 'Empirical Arena',
    shortDesc: 'Quantum vs Classical Benchmarking',
    objective: 'Benchmark quantum models against Classical SVM, Random Forest, and Logistic Regression on identical splits.',
    quantumPrinciple: 'Empirical quantum advantage requires outperforming classical methods on both accuracy and training sample complexity.',
    icon: Zap
  },
  {
    id: 'step-report',
    tab: 'reports',
    stepNumber: 7,
    title: 'Academic Report',
    shortDesc: 'IEEE/ACM Paper Generation',
    objective: 'Synthesize findings with multi-level quantum explanations and export publication-ready Markdown.',
    quantumPrinciple: 'Formal documentation links circuit depth, gradient variance, and noise sensitivity to testable empirical conclusions.',
    icon: FileText
  }
];

export const PipelineStepper: React.FC<PipelineStepperProps> = ({
  activeTab,
  onSelectTab,
  datasetLoaded,
  onExitGuidedMode
}) => {
  const [showTheory, setShowTheory] = useState(true);

  // Find current step index (or closest)
  const currentStepIndex = PIPELINE_STEPS.findIndex((s) => s.tab === activeTab);
  const activeStep = currentStepIndex >= 0 ? PIPELINE_STEPS[currentStepIndex] : PIPELINE_STEPS[0];
  const stepIdx = currentStepIndex >= 0 ? currentStepIndex : 0;

  const handlePrev = () => {
    if (stepIdx > 0) {
      onSelectTab(PIPELINE_STEPS[stepIdx - 1].tab);
    }
  };

  const handleNext = () => {
    if (stepIdx < PIPELINE_STEPS.length - 1) {
      onSelectTab(PIPELINE_STEPS[stepIdx + 1].tab);
    }
  };

  return (
    <div className="stepper-container glass-panel">
      {/* Top Header of Stepper */}
      <div className="stepper-header-row">
        <div className="stepper-title-badge">
          <Sparkles size={16} style={{ color: 'var(--primary)' }} />
          <span>Guided Research Workflow Pipeline</span>
          <span className="stepper-progress-pill">
            Step {stepIdx + 1} of {PIPELINE_STEPS.length}
          </span>
        </div>

        <div className="stepper-actions-group">
          <button
            className="btn btn-secondary btn-xs"
            onClick={() => setShowTheory(!showTheory)}
            title="Toggle theoretical rationale"
          >
            <Info size={13} />
            <span>{showTheory ? 'Hide Theory' : 'Show Theory'}</span>
          </button>

          <button
            className="btn btn-secondary btn-xs"
            onClick={onExitGuidedMode}
            title="Return to free Studio exploration"
          >
            <span>Exit Guided Mode</span>
          </button>
        </div>
      </div>

      {/* Stepper Steps Row */}
      <div className="stepper-track-scroll">
        <div className="stepper-track">
          {PIPELINE_STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isCurrent = idx === stepIdx;
            const isCompleted = idx < stepIdx;

            return (
              <div
                key={step.id}
                className={`stepper-node ${isCurrent ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                onClick={() => onSelectTab(step.tab)}
              >
                <div className="stepper-node-circle">
                  {isCompleted ? <CheckCircle2 size={16} /> : <span>{step.stepNumber}</span>}
                </div>
                <div className="stepper-node-info">
                  <span className="stepper-node-title">{step.title}</span>
                  <span className="stepper-node-sub">{step.shortDesc}</span>
                </div>
                {idx < PIPELINE_STEPS.length - 1 && <div className="stepper-node-line" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Contextual Guidance Banner for Active Step */}
      {showTheory && (
        <div className="stepper-guidance-card">
          <div className="stepper-guidance-main">
            <div className="stepper-guidance-icon">
              <activeStep.icon size={20} />
            </div>
            <div>
              <div className="stepper-guidance-title">
                Stage {activeStep.stepNumber}: {activeStep.title} — {activeStep.objective}
              </div>
              <div className="stepper-guidance-theory">
                <strong>Quantum Insight:</strong> {activeStep.quantumPrinciple}
              </div>
            </div>
          </div>

          <div className="stepper-nav-buttons">
            <button
              className="btn btn-secondary btn-sm"
              onClick={handlePrev}
              disabled={stepIdx === 0}
            >
              <ChevronLeft size={14} />
              <span>Previous</span>
            </button>

            {stepIdx < PIPELINE_STEPS.length - 1 ? (
              <button
                className="btn btn-primary btn-sm"
                onClick={handleNext}
              >
                <span>Next: {PIPELINE_STEPS[stepIdx + 1].title}</span>
                <ChevronRight size={14} />
              </button>
            ) : (
              <button
                className="btn btn-primary btn-sm"
                onClick={() => onSelectTab('reports')}
              >
                <span>Final Step: Complete Research</span>
                <CheckCircle2 size={14} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
