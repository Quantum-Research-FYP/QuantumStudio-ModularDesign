import React from 'react';
import { TabType, DatasetResponse } from '../types';
import { 
  Database, Cpu, TrendingDown, Grid, Activity, AlertTriangle
} from 'lucide-react';

interface HeaderProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  backendOnline: boolean;
  dataset: DatasetResponse | null;
  datasetName?: string;
  onQuickLoadDataset: () => void;
}

export const QML_NAV_TABS: { id: TabType; label: string; icon: any }[] = [
  { id: 'datalab', label: '1. Dataset', icon: Database },
  { id: 'modellab', label: '2. Model & Training', icon: Cpu },
  { id: 'barrenplateau', label: '3. Trainability Analysis', icon: TrendingDown },
  { id: 'experiments', label: '4. Experiment Runs', icon: Grid },
];

export const Header: React.FC<HeaderProps> = ({ 
  activeTab, 
  setActiveTab, 
  backendOnline,
  dataset,
  datasetName = 'Moons',
  onQuickLoadDataset
}) => {
  const sampleCount = dataset?.X?.length || 0;
  const featureCount = dataset?.feature_names?.length || (dataset?.X?.[0]?.length ?? 2);

  return (
    <header className="header-wrapper">
      <div className="header-bar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.65rem 1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        {/* Brand Section */}
        <div className="brand-section" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div className="brand-icon-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '8px', background: 'var(--color-primary-soft)', color: 'var(--color-primary)' }}>
            <Activity size={18} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <h1 className="brand-title" style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>QML Experiments</h1>
              <span className="brand-tag" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', borderRadius: '4px', background: 'var(--color-primary-soft)', color: 'var(--color-primary)', fontWeight: 600 }}>Lab</span>
            </div>
          </div>
        </div>

        {/* Focused Experiment Tabs */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'var(--color-surface-soft)', padding: '0.2rem 0.3rem', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
          {QML_NAV_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.45rem 0.85rem',
                  borderRadius: '6px',
                  border: isActive ? '1px solid var(--color-brand-start, var(--color-primary))' : '1px solid transparent',
                  fontSize: '0.82rem',
                  fontWeight: isActive ? 600 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  background: isActive ? 'var(--color-brand-start, var(--color-primary))' : 'transparent',
                  color: isActive ? 'var(--color-on-accent)' : 'var(--color-text-secondary)',
                  boxShadow: isActive ? '0 1px 3px rgba(0, 0, 0, 0.15)' : 'none',
                }}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Global Context & Backend Status */}
        <div className="header-controls" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {/* Active Dataset Status Pill */}
          {dataset?.train_X && dataset.train_X.length > 0 ? (
            <button 
              className="dataset-status-pill ready"
              onClick={() => setActiveTab('datalab')}
              title="View active dataset in Data Lab"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.3rem 0.65rem', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text-primary)', cursor: 'pointer', fontSize: '0.78rem' }}
            >
              <span className="status-dot green" style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-success)' }}></span>
              <span style={{ fontWeight: 600 }}>{datasetName}</span>
              <span style={{ color: 'var(--color-text-muted)', fontSize: '0.72rem' }}>({sampleCount} pts · {featureCount} feats)</span>
            </button>
          ) : (
            <button 
              className="dataset-status-pill empty"
              onClick={onQuickLoadDataset}
              title="Load default 2-qubit Moons benchmark"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.3rem 0.65rem', borderRadius: '6px', border: '1px solid var(--color-gold-border)', background: 'var(--color-gold-soft)', color: 'var(--color-gold-text)', cursor: 'pointer', fontSize: '0.78rem' }}
            >
              <AlertTriangle size={12} />
              <span>Load Dataset</span>
            </button>
          )}

          {/* Backend Status */}
          <div 
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.3rem 0.6rem', borderRadius: '6px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}
            title={backendOnline ? 'Simulation service online' : 'Simulation service offline'}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: backendOnline ? 'var(--color-success)' : 'var(--color-danger)' }}></span>
            <span>{backendOnline ? 'Simulation Ready' : 'Offline'}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
