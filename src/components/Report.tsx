import React from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorState } from '@codemirror/state';
import { CodeEntry } from '../types';

interface ReportProps {
  entry: CodeEntry;
  userCode: string;
  onBack: () => void;
}

const Report: React.FC<ReportProps> = ({ entry, userCode, onBack }) => {
  const reportColor = entry.reportStatus.color;

  return (
    <div className="stage-container">
      <div className="stage-header">
        <button className="back-btn" onClick={onBack} aria-label="Back to editor">
          ← back to editor
        </button>
        <div className={`stage-badge stage-badge-${reportColor}`}>REPORT</div>
        <h1 className="entry-title">{entry.title}</h1>
      </div>

      <div
        className={`report-summary report-summary-${reportColor}`}
      >
        <span className="report-summary-icon">{reportColor === 'green' ? '✓' : '✗'}</span>
        <span>{entry.reportStatus.message ?? (reportColor === 'green' ? 'All checks passed' : 'Issues found')}</span>
      </div>

      <div className="report-feedback-panel">
        <div className="panel-label">Feedback</div>
        <p className="report-feedback-text">{entry.reportText}</p>
      </div>

      <div className="diff-section">
        <div className="diff-col">
          <div className="editor-toolbar">
            <div className="toolbar-left">
              <span className="toolbar-label">
                <span className="dot dot-red" />
                <span className="dot dot-yellow" />
                <span className="dot dot-green" />
              </span>
              <span className="toolbar-filename">your-solution.ts</span>
            </div>
            <div className="diff-badge diff-badge-user">Your code</div>
          </div>
          <CodeMirror
            value={userCode}
            height="320px"
            theme={oneDark}
            extensions={[javascript({ typescript: true })]}
            className="code-editor"
          />
        </div>

        <div className="diff-col">
          <div className="editor-toolbar">
            <div className="toolbar-left">
              <span className="toolbar-label">
                <span className="dot dot-red" />
                <span className="dot dot-yellow" />
                <span className="dot dot-green" />
              </span>
              <span className="toolbar-filename">reference.ts</span>
            </div>
            <div className="diff-badge diff-badge-ref">Reference</div>
          </div>
          <CodeMirror
            value={entry.reportCode}
            height="320px"
            theme={oneDark}
            extensions={[
              javascript({ typescript: true }),
              EditorState.readOnly.of(true),
            ]}
            className="code-editor code-editor-immutable"
            editable={false}
          />
        </div>
      </div>
    </div>
  );
};

export default Report;
