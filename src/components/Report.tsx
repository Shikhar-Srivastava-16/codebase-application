import React from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { cpp } from '@codemirror/lang-cpp';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorState } from '@codemirror/state';
import { CodeEntry } from '../types';

interface ReportProps {
  entry: CodeEntry;
  userCode: string;
  onBack: () => void;
}

function getLangExtension(fileName: string) {
  if (fileName.endsWith('.py')) return python();
  if (fileName.endsWith('.cpp') || fileName.endsWith('.c') || fileName.endsWith('.h')) return cpp();
  return javascript({ typescript: true });
}

const Report: React.FC<ReportProps> = ({ entry, userCode, onBack }) => {
  const reportColor = entry.reportStatus.color;
  const height = '750px';
  const testOutput = entry.reportStatus.testOutput;

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

      {testOutput && (
        <div className={`test-output-panel test-output-panel-${reportColor}`}>
          <div className="panel-label">Test Output</div>
          <pre className="test-output-content">{testOutput}</pre>
        </div>
      )}

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
              <span className="toolbar-filename">{entry.fileName}</span>
            </div>
            <div className="diff-badge diff-badge-user">Your code</div>
          </div>
          <CodeMirror
            value={userCode}
            height={height}
            theme={oneDark}
            extensions={[getLangExtension(entry.fileName)]}
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
              <span className="toolbar-filename">{entry.fileName}</span>
            </div>
            <div className="diff-badge diff-badge-ref">Reference</div>
          </div>
          <CodeMirror
            value={entry.reportCode}
            height={height}
            theme={oneDark}
            extensions={[
              getLangExtension(entry.fileName),
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
