import React, { useState, useEffect } from 'react';
import { TabType, DatasetResponse } from '../types';
import { 
  Sparkles, Compass, ArrowRight, Zap, CheckCircle2, 
  Database, Sliders, Cpu, FileText, X, ChevronRight, HelpCircle
} from 'lucide-react';

interface WorkflowBannerProps {
  activeTab: TabType;
  dataset: DatasetResponse | null;
  datasetName: string;
  isGuidedMode: boolean;
  onOpenQuickStart: () => void;
  onToggleGuidedMode: () => void;
  onQuickLoadMoons: () => Promise<void> | void;
  onNavigateTab: (tab: TabType) => void;
}

export const WorkflowBanner: React.FC<WorkflowBannerProps> = ({
  activeTab,
  dataset,
  datasetName,
  isGuidedMode,
  onOpenQuickStart,
  onToggleGuidedMode,
  onQuickLoadMoons,
  onNavigateTab
}) => {
  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    return localStorage.getItem('qml_onboarding_dismissed') === 'true';
  });

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('qml_onboarding_dismissed', 'true');
  };

  const handleReopen = () => {
    setIsDismissed(false);
    localStorage.removeItem('qml_onboarding_dismissed');
  };

  if (isDismissed) {
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.75rem' }}>
        <button
          onClick={handleReopen}
          className="btn btn-secondary btn-xs"
          style={{ 
            fontSize: '0.75rem', 
            gap: '0.35rem', 
            background: 'var(--color-surface)',
            border: '1px dashed var(--color-border-strong)',
            color: 'var(--color-text-secondary)'
          }}
          title="Show the Researcher Quickstart Onboarding Guide"
        >
          <Compass size={13} style={{ color: 'var(--color-primary)' }} />
          <span>Show Researcher Workflow Helper</span>
        </button>
      </div>
    );
  }

  const isDatasetReady = !!dataset?.train_X && dataset.train_X.length > 0;

  return (
    <div 
      className="glass-panel" 
      style={{ 
        position: 'relative', 
        marginBottom: '1.25rem',
        padding: '1.25rem 1.5rem',
        borderLeft: '4px solid var(--color-primary)',
        background: 'linear-gradient(135deg, var(--color-surface) 0%, var(--color-surface-soft) 100%)'
      }}
    >
      <button 
        onClick={handleDismiss}
        style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          background: 'transparent',
          border: 'none',
          color: 'var(--color-text-muted)',
          cursor: 'pointer',
          padding: '4px',
          borderRadius: '4px'
        }}
        title="Dismiss welcome guide (can reopen anytime)"
      >
        <X size={16} />
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', paddingRight: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
            <span style={{ 
              fontSize: '0.72rem', 
              fontWeight: 700, 
              padding: '0.15rem 0.5rem', 
              borderRadius: '999px', 
              background: 'var(--color-primary-soft)', 
              color: 'var(--color-primary)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em'
            }}>
              Researcher Workflow Roadmap
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              Step 1 of 4: Foundation
            </span>
          </div>

          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            Welcome to QML Studio — New to the Process? Here's How to Start:
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem', maxWidth: '750px', lineHeight: '1.5' }}>
            A standard QML experiment requires 4 sequential steps: 
            <strong> 1. Data Prep & Encoding</strong> (scale values to [-π, π]) ➔ 
            <strong> 2. Circuit Architecture</strong> (select PQC ansatz) ➔ 
            <strong> 3. Hybrid Training</strong> (optimize parameterized angles) ➔ 
            <strong> 4. Benchmarking & Papers</strong> (evaluate vs classical algorithms).
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button 
            className="btn btn-secondary btn-sm"
            onClick={onOpenQuickStart}
            style={{ fontSize: '0.8rem', gap: '0.35rem' }}
          >
            <Compass size={14} style={{ color: 'var(--color-primary)' }} />
            <span>Interactive Guide & Goals</span>
          </button>

          <button 
            className={`btn ${isGuidedMode ? 'btn-secondary' : 'btn-primary'} btn-sm`}
            onClick={onToggleGuidedMode}
            style={{ fontSize: '0.8rem', gap: '0.35rem' }}
          >
            <Sparkles size={14} />
            <span>{isGuidedMode ? 'Exit Guided Stepper' : 'Enable Guided Stepper'}</span>
          </button>

          {!isDatasetReady && (
            <button 
              className="btn btn-secondary btn-sm"
              onClick={onQuickLoadMoons}
              style={{ fontSize: '0.8rem', gap: '0.35rem' }}
            >
              <Zap size={14} style={{ color: 'var(--color-gold-text)' }} />
              <span>1-Click Fast Start</span>
            </button>
          )}
        </div>
      </div>

      {/* 4-Step Interactive Mini Progress Bar */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '0.75rem', 
        marginTop: '1.2rem',
        paddingTop: '1rem',
        borderTop: '1px solid var(--color-border)'
      }}>
        {/* Step 1 */}
        <div 
          onClick={() => onNavigateTab('datalab')}
          style={{ 
            cursor: 'pointer',
            padding: '0.5rem 0.75rem', 
            borderRadius: '6px',
            background: activeTab === 'datalab' || activeTab === 'encodinglab' ? 'var(--color-surface-soft)' : 'transparent',
            border: activeTab === 'datalab' || activeTab === 'encodinglab' ? '1px solid var(--color-primary)' : '1px solid transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem'
          }}
        >
          <div style={{ 
            width: '24px', 
            height: '24px', 
            borderRadius: '50%', 
            background: isDatasetReady ? 'var(--color-green-soft)' : 'var(--color-primary-soft)',
            color: isDatasetReady ? 'var(--color-green-text)' : 'var(--color-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.75rem',
            fontWeight: 700
          }}>
            {isDatasetReady ? '✓' : '1'}
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              1. Data & Encoding
            </div>
            <div style={{ fontSize: '0.7rem', color: isDatasetReady ? 'var(--color-green-text)' : 'var(--color-text-muted)' }}>
              {isDatasetReady ? `${datasetName} Active` : 'Prepare Features'}
            </div>
          </div>
        </div>

        {/* Step 2 */}
        <div 
          onClick={() => onNavigateTab('ansatzdesigner')}
          style={{ 
            cursor: 'pointer',
            padding: '0.5rem 0.75rem', 
            borderRadius: '6px',
            background: activeTab === 'ansatzdesigner' || activeTab === 'ansatzsearch' || activeTab === 'reuploading' ? 'var(--color-surface-soft)' : 'transparent',
            border: activeTab === 'ansatzdesigner' || activeTab === 'ansatzsearch' || activeTab === 'reuploading' ? '1px solid var(--color-purple-fill)' : '1px solid transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem'
          }}
        >
          <div style={{ 
            width: '24px', 
            height: '24px', 
            borderRadius: '50%', 
            background: 'var(--color-purple-soft)',
            color: 'var(--color-purple-text)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.75rem',
            fontWeight: 700
          }}>
            2
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              2. Circuit Architecture
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
              Design PQC & Entanglement
            </div>
          </div>
        </div>

        {/* Step 3 */}
        <div 
          onClick={() => onNavigateTab('modellab')}
          style={{ 
            cursor: 'pointer',
            padding: '0.5rem 0.75rem', 
            borderRadius: '6px',
            background: activeTab === 'modellab' || activeTab === 'barrenplateau' || activeTab === 'hardwarelab' ? 'var(--color-surface-soft)' : 'transparent',
            border: activeTab === 'modellab' || activeTab === 'barrenplateau' || activeTab === 'hardwarelab' ? '1px solid var(--color-info)' : '1px solid transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem'
          }}
        >
          <div style={{ 
            width: '24px', 
            height: '24px', 
            borderRadius: '50%', 
            background: 'var(--color-blue-soft)',
            color: 'var(--color-info)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.75rem',
            fontWeight: 700
          }}>
            3
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              3. Training & Hardware
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
              Optimize VQC / QKE
            </div>
          </div>
        </div>

        {/* Step 4 */}
        <div 
          onClick={() => onNavigateTab('benchmark')}
          style={{ 
            cursor: 'pointer',
            padding: '0.5rem 0.75rem', 
            borderRadius: '6px',
            background: activeTab === 'benchmark' || activeTab === 'analysis' || activeTab === 'reports' ? 'var(--color-surface-soft)' : 'transparent',
            border: activeTab === 'benchmark' || activeTab === 'analysis' || activeTab === 'reports' ? '1px solid var(--color-gold-fill)' : '1px solid transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem'
          }}
        >
          <div style={{ 
            width: '24px', 
            height: '24px', 
            borderRadius: '50%', 
            background: 'var(--color-gold-soft)',
            color: 'var(--color-gold-text)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.75rem',
            fontWeight: 700
          }}>
            4
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              4. Evaluation & Reports
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
              Compare Baselines & Export
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
