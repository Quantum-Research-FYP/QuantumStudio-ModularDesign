import React, { useState, useEffect, useRef } from 'react';
import { TabType } from '../types';
import { 
  Search, Database, Cpu, Server, TrendingDown, Layers, 
  Sliders, Grid, FileText, Zap, Activity, ArrowRight, CornerDownLeft, X, Sparkles
} from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tab: TabType) => void;
  onOpenPresets: () => void;
  onQuickLoadDataset: () => void;
  onToggleGuidedMode: () => void;
  isGuidedMode: boolean;
}

interface PaletteItem {
  id: string;
  type: 'tab' | 'action';
  tabId?: TabType;
  title: string;
  category: string;
  description: string;
  icon: any;
  action?: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onSelectTab,
  onOpenPresets,
  onQuickLoadDataset,
  onToggleGuidedMode,
  isGuidedMode
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const items: PaletteItem[] = [
    // Tabs
    {
      id: 'tab-datalab',
      type: 'tab',
      tabId: 'datalab',
      title: 'Data Laboratory',
      category: '1. Data & Encoding',
      description: 'Generate synthetic benchmarks, inspect quantum readiness, upload custom CSVs',
      icon: Database
    },
    {
      id: 'tab-encodinglab',
      type: 'tab',
      tabId: 'encodinglab',
      title: 'Encoding Cost Laboratory',
      category: '1. Data & Encoding',
      description: 'Compare Angle, Amplitude, Basis, and Pauli Feature Maps gate overheads',
      icon: Layers
    },
    {
      id: 'tab-ansatzdesigner',
      type: 'tab',
      tabId: 'ansatzdesigner',
      title: 'Circuit & Ansatz Designer',
      category: '2. Circuit Architecture',
      description: 'Design custom parameterized quantum circuits with interactive gate canvas',
      icon: Sliders
    },
    {
      id: 'tab-ansatzsearch',
      type: 'tab',
      tabId: 'ansatzsearch',
      title: 'Ansatz Architecture Search',
      category: '2. Circuit Architecture',
      description: 'Pareto frontier exploration for expressibility vs CNOT gate depth',
      icon: Search
    },
    {
      id: 'tab-reuploading',
      type: 'tab',
      tabId: 'reuploading',
      title: 'Data Re-Uploading Study',
      category: '2. Circuit Architecture',
      description: 'Multi-layer interleaved encoding for expanded Fourier harmonics on few qubits',
      icon: Layers
    },
    {
      id: 'tab-modellab',
      type: 'tab',
      tabId: 'modellab',
      title: 'Model Laboratory',
      category: '3. Training & Hardware',
      description: 'Train Quantum Kernel Estimators (QKE) and Variational Quantum Classifiers (VQC)',
      icon: Cpu
    },
    {
      id: 'tab-barrenplateau',
      type: 'tab',
      tabId: 'barrenplateau',
      title: 'Trainability & Barren Plateau',
      category: '3. Training & Hardware',
      description: 'Analyze gradient variance decay and expressibility against qubit register size',
      icon: TrendingDown
    },
    {
      id: 'tab-hardwarelab',
      type: 'tab',
      tabId: 'hardwarelab',
      title: 'Hardware & Noise Laboratory',
      category: '3. Training & Hardware',
      description: 'Transpile to IBM Falcon topologies with thermal relaxation and depolarizing errors',
      icon: Server
    },
    {
      id: 'tab-benchmark',
      type: 'tab',
      tabId: 'benchmark',
      title: 'Quantum Advantage Arena',
      category: '4. Evaluation & Insights',
      description: 'Head-to-head empirical testing against Random Forest, SVM, and Logistic Regression',
      icon: Zap
    },
    {
      id: 'tab-analysis',
      type: 'tab',
      tabId: 'analysis',
      title: 'Analysis Engine',
      category: '4. Evaluation & Insights',
      description: 'Confusion matrix heatmap, Quantum Fisher Information (QFI), ROC AUC curve',
      icon: Activity
    },
    {
      id: 'tab-experiments',
      type: 'tab',
      tabId: 'experiments',
      title: 'Experiment Manager',
      category: '4. Evaluation & Insights',
      description: 'Reproducibility logging, hypothesis validation, hyperparameter trials',
      icon: Grid
    },
    {
      id: 'tab-reports',
      type: 'tab',
      tabId: 'reports',
      title: 'Research Reports & AI',
      category: '4. Evaluation & Insights',
      description: 'Multi-level explainability and IEEE/ACM formatted academic paper generation',
      icon: FileText
    },
    // Quick Actions
    {
      id: 'action-quick-moons',
      type: 'action',
      title: 'Quick Load Moons Dataset (2 Qubits)',
      category: 'Quick Actions',
      description: 'Immediately generate default non-linear 120-sample dataset',
      icon: Zap,
      action: onQuickLoadDataset
    },
    {
      id: 'action-presets',
      type: 'action',
      title: 'Open 1-Click Research Presets',
      category: 'Quick Actions',
      description: 'Browse 6 pre-configured validated quantum experiment recipes',
      icon: Sparkles,
      action: onOpenPresets
    },
    {
      id: 'action-guided-mode',
      type: 'action',
      title: isGuidedMode ? 'Switch to Studio Mode' : 'Switch to Guided Pipeline Mode',
      category: 'Quick Actions',
      description: isGuidedMode ? 'Free exploration across all 12 modules' : 'Step-by-step guided research workflow stepper',
      icon: Activity,
      action: onToggleGuidedMode
    }
  ];

  const filteredItems = items.filter((item) => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return (
      item.title.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
    );
  });

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredItems.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const current = filteredItems[selectedIndex];
      if (current) executeItem(current);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const executeItem = (item: PaletteItem) => {
    if (item.type === 'tab' && item.tabId) {
      onSelectTab(item.tabId);
    } else if (item.action) {
      item.action();
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="command-palette-card"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="palette-input-wrapper">
          <Search size={18} className="palette-search-icon" />
          <input
            ref={inputRef}
            type="text"
            className="palette-search-input"
            placeholder="Type a laboratory, tool, or action... (e.g. 'VQC', 'Circuit', 'Moons')"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button className="palette-clear-btn" onClick={() => setQuery('')}>
              <X size={15} />
            </button>
          )}
          <span className="kbd-badge">ESC</span>
        </div>

        <div className="palette-list">
          {filteredItems.length === 0 ? (
            <div className="palette-empty-state">
              <span>No laboratory or action matching "{query}"</span>
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const Icon = item.icon;
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={item.id}
                  className={`palette-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => executeItem(item)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div className="palette-item-icon">
                    <Icon size={18} />
                  </div>
                  <div className="palette-item-text">
                    <div className="palette-item-title-row">
                      <span className="palette-item-title">{item.title}</span>
                      <span className="palette-item-category">{item.category}</span>
                    </div>
                    <div className="palette-item-desc">{item.description}</div>
                  </div>
                  {isSelected && (
                    <div className="palette-enter-hint">
                      <span>Select</span>
                      <CornerDownLeft size={12} />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="palette-footer">
          <div className="palette-tips">
            <span><kbd>↑</kbd> <kbd>↓</kbd> Navigate</span>
            <span><kbd>↵</kbd> Choose</span>
            <span><kbd>ESC</kbd> Close</span>
          </div>
          <span className="palette-shortcut-hint">Shortcuts: <strong>Ctrl+K</strong> or <strong>⌘+K</strong></span>
        </div>
      </div>
    </div>
  );
};
