import React, { useState, useEffect, useCallback } from 'react';
import { TabType, DatasetResponse, DatasetConfig, TrainingStatsState } from './types';
import { Header } from './components/Header';
import { DataLab } from './components/DataLab';
import { ModelLab } from './components/ModelLab';
import { BarrenPlateau } from './components/BarrenPlateau';
import { ExperimentManager } from './components/ExperimentManager';
import { ToastProvider, useToast } from './context/ToastContext';
import { api } from './services/api';
import './index.css';
import './globals.css';

const AppContent: React.FC = () => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>('datalab');
  const [backendOnline, setBackendOnline] = useState<boolean>(true);

  // Shared Dataset State across modules
  const [datasetConfig, setDatasetConfig] = useState<DatasetConfig>({
    dataset_type: 'moons',
    n_samples: 120,
    noise: 0.12,
    normalization: 'minmax',
    n_features: 2
  });

  const [dataset, setDataset] = useState<DatasetResponse | null>(null);
  const [, setTrainingStats] = useState<TrainingStatsState | null>(null);

  useEffect(() => {
    // Check backend health on mount
    api.checkHealth().then(res => {
      setBackendOnline(!!res && res.status === 'healthy');
    });
  }, []);

  // 1-Click Quick Load Moons Dataset
  const handleQuickLoadDataset = useCallback(async () => {
    try {
      showToast('Generating 2-qubit Moons benchmark dataset...', 'info', 'Loading Dataset');
      const defaultConfig: DatasetConfig = {
        dataset_type: 'moons',
        n_samples: 120,
        noise: 0.12,
        normalization: 'minmax',
        n_features: 2
      };
      setDatasetConfig(defaultConfig);
      const res = await api.generateDataset(defaultConfig);
      setDataset(res);
      showToast('Moons benchmark ready with 120 samples and 2 features!', 'success', 'Dataset Generated');
    } catch (err: any) {
      showToast(err.message || 'Failed to generate dataset', 'error', 'Error');
    }
  }, [showToast]);

  const getDatasetDisplayTitle = () => {
    if (!datasetConfig) return 'Moons';
    const mapping: Record<string, string> = {
      moons: 'Moons',
      circles: 'Circles',
      blobs: 'Gaussian Blobs',
      spiral: 'Spiral',
      xor: 'XOR',
      iris: 'Iris Flower',
      breast_cancer: 'Breast Cancer',
      wine: 'Wine Dataset',
      custom_csv: 'Custom CSV'
    };
    return mapping[datasetConfig.dataset_type] || datasetConfig.dataset_type;
  };

  return (
    <div className="qml-scope app-container" style={{ background: 'var(--color-canvas)', minHeight: '100vh' }}>
      {/* Streamlined Single-Tier Header */}
      <Header 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        backendOnline={backendOnline}
        dataset={dataset}
        datasetName={getDatasetDisplayTitle()}
        onQuickLoadDataset={handleQuickLoadDataset}
      />

      <main className="main-content" style={{ padding: '1.5rem', maxWidth: '1600px', margin: '0 auto', width: '100%' }}>
        <div key={activeTab} className="tab-pane-transition">
          {activeTab === 'datalab' && (
            <DataLab 
              dataset={dataset} 
              setDataset={setDataset} 
              config={datasetConfig} 
              setConfig={setDatasetConfig}
              onNavigateTab={setActiveTab}
            />
          )}

          {activeTab === 'modellab' && (
            <ModelLab 
              dataset={dataset}
              onQuickLoadDataset={handleQuickLoadDataset}
              onNavigateTab={setActiveTab}
              onTrainingFinished={setTrainingStats}
            />
          )}

          {activeTab === 'barrenplateau' && (
            <BarrenPlateau />
          )}

          {activeTab === 'experiments' && (
            <ExperimentManager />
          )}
        </div>
      </main>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
};

export default App;
