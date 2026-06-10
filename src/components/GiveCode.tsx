import React from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';
import { CodeEntry } from '../types';

interface GiveCodeProps {
  entry: CodeEntry;
  userCode: string;
  currentIndex: number;
  totalEntries: number;
  onCodeChange: (code: string) => void;
  onNext: () => void;
  onPrev: () => void;
  onViewReport: () => void;
}

const GiveCode: React.FC<GiveCodeProps> = ({
  entry,
  userCode,
  currentIndex,
  totalEntries,
  onCodeChange,
  onNext,
  onPrev,
  onViewReport,
}) => {
  const reportColor = entry.reportStatus.color;

  return (
    <div className="stage-container">
      <div className="stage-header">
        <div className="stage-badge">EXERCISE</div>
        <h1 className="entry-title">{entry.title}</h1>
        <div className="entry-counter">
          {currentIndex + 1} / {totalEntries}
        </div>
      </div>

      <div className="description-panel">
        <p>{entry.description}</p>
      </div>

      <div className="editor-section">
        <div className="editor-toolbar">
          <div className="toolbar-left">
            <span className="toolbar-label">
              <span className="dot dot-red" />
              <span className="dot dot-yellow" />
              <span className="dot dot-green" />
            </span>
            <span className="toolbar-filename">solution.ts</span>
          </div>
          <div className="toolbar-right">
            <button
              className="nav-btn"
              onClick={onPrev}
              disabled={currentIndex === 0}
              aria-label="Previous exercise"
            >
              ← previous
            </button>
            <button
              className="nav-btn nav-btn-primary"
              onClick={onNext}
              disabled={currentIndex === totalEntries - 1}
              aria-label="Next exercise"
            >
              next →
            </button>
          </div>
        </div>

        <CodeMirror
          value={userCode}
          height="360px"
          theme={oneDark}
          extensions={[javascript({ typescript: true })]}
          onChange={onCodeChange}
          className="code-editor"
        />
      </div>

      <div
        className={`report-panel report-panel-${reportColor}`}
        onClick={onViewReport}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onViewReport()}
        aria-label="View full report"
      >
        <div className="report-panel-inner">
          <div className="report-icon">{reportColor === 'green' ? '✓' : '✗'}</div>
          <div className="report-panel-text">
            <div className="report-panel-label">Report</div>
            <div className="report-panel-status">
              {entry.reportStatus.message ?? (reportColor === 'green' ? 'Passed' : 'Issues found')}
            </div>
          </div>
          <div className="report-panel-cta">View report →</div>
        </div>
      </div>
    </div>
  );
};

export default GiveCode;
