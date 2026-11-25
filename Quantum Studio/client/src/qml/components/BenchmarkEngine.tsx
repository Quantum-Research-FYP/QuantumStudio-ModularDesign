import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { DatasetResponse, BenchmarkResult, TabType } from '../types';
import { Zap, Trophy, TrendingUp, CheckCircle, RefreshCw, ArrowRight, FileText, Activity } from 'lucide-react';
import { DatasetRequiredBanner } from './DatasetRequiredBanner';
import { useToast } from '../context/ToastContext';

interface BenchmarkEngineProps {
  dataset: DatasetResponse | null;
  onQuickLoadDataset?: () => void;
  onNavigateTab?: (tab: TabType) => void;
}

export const BenchmarkEngine: React.FC<BenchmarkEngineProps> = ({ 
  dataset,
  onQuickLoadDataset,
  onNavigateTab
}) => {
  const { showToast } = useToast();
  const [results, setResults] = useState<BenchmarkResult[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const handleBenchmark = async () => {
    if (!dataset?.train_X || dataset.train_X.length === 0) return;
    setLoading(true);
    showToast('Running benchmark across Quantum & Classical models...', 'info', 'Benchmarking Arena');
    try {
      const res = await api.runBenchmark(dataset.train_X, dataset.train_y, dataset.test_X, dataset.test_y);
      setResults(res || []);
      showToast('Empirical baseline comparison complete!', 'success', 'Arena Results');
    } catch (err: any) {
      showToast(err.message || 'Error running benchmark', 'error', 'Benchmark Error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (dataset?.train_X && dataset.train_X.length > 0 && results.length === 0) {
      handleBenchmark();
    }
  }, [dataset]);

  if (!dataset?.train_X || dataset.train_X.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <DatasetRequiredBanner
          labName="Benchmark Arena"
          onLoadDefaultDataset={onQuickLoadDataset || (() => {})}
          onGoToDataLab={() => onNavigateTab?.('datalab')}
        />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Benchmark Banner */}
      <div className="glass-panel">
        <div className="panel-header">
          <div className="panel-title">
            <Trophy size={20} style={{ color: 'var(--amber)' }} />
            <span>Quantum vs Classical Machine Learning Arena</span>
          </div>
          <button 
            className="btn btn-primary btn-sm"
            onClick={handleBenchmark}
            disabled={loading || !dataset?.train_X}
          >
            {loading ? <RefreshCw size={14} className="animate-spin" /> : <Zap size={14} />}
            <span>{loading ? 'Benchmarking Baselines...' : 'Re-Run All Baselines'}</span>
          </button>
        </div>

        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
          Evaluate empirical quantum advantage on identical train/test splits against industry-standard classical machine learning classifiers.
        </p>
      </div>

      {/* Head to Head Comparison Cards */}
      <div className="grid-benchmark">
        {(results || []).map((item, idx) => {
          const isQuantum = item.type === 'Quantum';
          return (
            <div 
              key={idx} 
              className="glass-panel" 
              style={{ 
                borderLeft: `4px solid ${isQuantum ? 'var(--primary)' : 'var(--accent)'}`,
                background: isQuantum ? 'var(--color-primary-soft)' : 'var(--color-surface)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.05rem', color: 'var(--color-text-primary)' }}>{item.model}</h3>
                  <span className={`tag-chip ${isQuantum ? 'primary' : ''}`} style={{ marginTop: '0.25rem' }}>
                    {item.type} Engine
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: isQuantum ? 'var(--primary)' : 'var(--color-text-primary)' }}>
                    {item.test_accuracy}%
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Test Accuracy</div>
                </div>
              </div>

              {/* Progress Bars */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span>Generalization F1-Score</span>
                    <span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>{item.f1_score}</span>
                  </div>
                  <div className="compare-bar-track">
                    <div 
                      className="compare-bar-fill" 
                      style={{ 
                        width: `${item.f1_score * 100}%`, 
                        background: isQuantum ? 'linear-gradient(90deg, var(--primary), var(--secondary))' : 'var(--accent)' 
                      }} 
                    />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span>Training Runtime</span>
                    <span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>{item.train_time_ms} ms</span>
                  </div>
                  <div className="compare-bar-track">
                    <div 
                      className="compare-bar-fill" 
                      style={{ 
                        width: `${Math.min(100, (item.train_time_ms / 350) * 100)}%`, 
                        background: 'var(--text-dim)' 
                      }} 
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', paddingTop: '0.5rem', borderTop: '1px solid var(--border-subtle)' }}>
                  <span>Trainable Parameters: <strong style={{ color: 'var(--color-text-primary)' }}>{item.n_parameters}</strong></span>
                  {item.advantage_score && (
                    <span style={{ color: 'var(--emerald)', fontWeight: 600 }}>
                      Advantage Index: {item.advantage_score}/100
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Usability Next Steps Action Bar */}
      {results.length > 0 && onNavigateTab && (
        <div className="workflow-next-steps-card glass-panel">
          <div className="next-steps-info">
            <h4 className="next-steps-title">Arena Benchmark Completed!</h4>
            <p className="next-steps-desc">
              Synthesize these comparative empirical metrics into a publication-ready academic manuscript or inspect decision geometry in the Analysis Engine.
            </p>
          </div>
          <div className="next-steps-buttons">
            <button className="btn btn-secondary btn-sm" onClick={() => onNavigateTab('analysis')}>
              <Activity size={14} />
              <span>Inspect in Analysis Engine</span>
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => onNavigateTab('reports')}>
              <FileText size={14} />
              <span>Generate Academic Paper Report</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
