import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { MultiLevelExplanation, AcademicReport, DatasetResponse } from '../types';
import { FileText, Sparkles, Download, Cpu, HelpCircle, Layers, Award, CheckCircle, RefreshCw } from 'lucide-react';

interface ResearchReportsProps {
  dataset: DatasetResponse | null;
}

export const ResearchReports: React.FC<ResearchReportsProps> = ({ dataset }) => {
  const [report, setReport] = useState<AcademicReport | null>(null);
  const [explanation, setExplanation] = useState<MultiLevelExplanation | null>(null);
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<string>("Does increasing VQC depth improve classification performance or induce barren plateaus?");
  const [loading, setLoading] = useState<boolean>(false);

  const loadData = async () => {
    setLoading(true);
    const tmpls = await api.getResearchTemplates();
    setTemplates(tmpls);

    const expReq = {
      research_question: selectedQuestion,
      hypothesis: "Shallower circuits (depth <= 3) retain non-vanishing gradient variance while matching classical SVM accuracy.",
      dataset_name: dataset?.feature_names ? 'Dataset' : 'Iris Flower (PCA 2D)',
      quantum_accuracy: 94.2,
      classical_accuracy: 91.5,
      gradient_variance: 0.038,
      qubits: 2,
      depth: 2,
      shots: 1024
    };

    const exp = await api.getMultilevelExplanation(expReq);
    setExplanation(exp);

    const rep = await api.generateAcademicReport(expReq);
    setReport(rep);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [selectedQuestion]);

  const handleDownloadMarkdown = () => {
    if (!report) return;
    const blob = new Blob([report.full_markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `academic-qml-research-report.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Banner */}
      <div className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', color: 'var(--color-text-primary)' }}>Explainable QML & Automated Research Report Generator</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Multi-level scientific interpretations and peer-review ready 19-Section academic manuscripts.
          </p>
        </div>

        <button 
          className="btn btn-primary btn-sm"
          onClick={handleDownloadMarkdown}
          disabled={!report}
        >
          <Download size={14} />
          <span>Export 19-Section Paper (.md)</span>
        </button>
      </div>

      {/* 4-Tier Explainable QML Section */}
      {explanation && (
        <div className="glass-panel">
          <div className="panel-header">
            <div className="panel-title">
              <Sparkles size={18} style={{ color: 'var(--primary)' }} />
              <span>4-Tier Multi-Level Explainable QML Engine</span>
            </div>
            <span className="tag-chip primary">AI Scientific Interpretation</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginTop: '0.5rem' }}>
            {/* Level 1: Circuit */}
            <div className="metric-card" style={{ borderLeft: '3px solid var(--primary)' }}>
              <span className="metric-card-label" style={{ color: 'var(--primary)' }}>Level 1: Circuit Level</span>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-primary)', marginTop: '0.5rem', lineHeight: '1.4' }}>
                {explanation.circuit_level.explanation}
              </p>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.5rem', fontFamily: 'var(--font-mono)' }}>
                {explanation.circuit_level.gate_breakdown}
              </div>
            </div>

            {/* Level 2: Model */}
            <div className="metric-card" style={{ borderLeft: '3px solid var(--accent)' }}>
              <span className="metric-card-label" style={{ color: 'var(--accent)' }}>Level 2: Model Dynamics</span>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-primary)', marginTop: '0.5rem', lineHeight: '1.4' }}>
                {explanation.model_level.explanation}
              </p>
              <div style={{ fontSize: '0.75rem', color: 'var(--emerald)', marginTop: '0.5rem', fontWeight: 600 }}>
                {explanation.model_level.trainability_verdict}
              </div>
            </div>

            {/* Level 3: Hardware */}
            <div className="metric-card" style={{ borderLeft: '3px solid var(--coral)' }}>
              <span className="metric-card-label" style={{ color: 'var(--coral)' }}>Level 3: Hardware Compilation</span>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-primary)', marginTop: '0.5rem', lineHeight: '1.4' }}>
                {explanation.hardware_level.explanation}
              </p>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.5rem' }}>
                {explanation.hardware_level.noise_exposure_verdict}
              </div>
            </div>

            {/* Level 4: Research */}
            <div className="metric-card" style={{ borderLeft: '3px solid var(--purple)' }}>
              <span className="metric-card-label" style={{ color: 'var(--purple)' }}>Level 4: Scientific Evidence</span>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-primary)', marginTop: '0.5rem', lineHeight: '1.4' }}>
                {explanation.research_level.explanation}
              </p>
              <div style={{ fontSize: '0.75rem', color: 'var(--primary)', marginTop: '0.5rem', fontWeight: 600 }}>
                {explanation.research_level.formal_conclusion}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 19-Section Academic Report Live Preview */}
      {report && (
        <div className="glass-panel">
          <div className="panel-header">
            <div className="panel-title">
              <FileText size={18} style={{ color: 'var(--accent)' }} />
              <span>Full Academic Manuscript Preview (19 Structured Sections)</span>
            </div>
            <span className="tag-chip">{report.sections.length} Sections Formatted</span>
          </div>

          <div style={{ 
            maxHeight: '520px', 
            overflowY: 'auto', 
            padding: '1.5rem', 
            background: 'rgba(5, 8, 18, 0.75)', 
            borderRadius: '8px', 
            border: '1px solid var(--border-subtle)' 
          }}>
            <h1 style={{ fontSize: '1.3rem', color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>{report.title}</h1>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              Generated for Academic Review • Date: {report.date_generated}
            </div>

            {report.sections.map((sec) => (
              <div key={sec.num} style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem' }}>
                <h3 style={{ fontSize: '0.95rem', color: 'var(--primary)', marginBottom: '0.4rem' }}>
                  § {sec.num}. {sec.heading}
                </h3>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)', lineHeight: '1.6', whiteSpace: 'pre-line' }}>
                  {sec.content.replace(/^#.*\n\n/, '')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
