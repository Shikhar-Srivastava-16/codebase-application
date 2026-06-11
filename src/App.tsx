import React, { useState, useEffect } from 'react';
import GiveCode from './components/GiveCode';
import Report from './components/Report';
import { Stage } from './types';
import { useApi } from './hooks/useApi';
import './App.css';

const STORAGE_KEY = 'codereview-user-codes';

function loadSavedCodes(): Record<string, string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveCodes(codes: Record<string, string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(codes));
  } catch { /* quota exceeded, ignore */ }
}

const App: React.FC = () => {
  const { entries, loading, error, submitCode } = useApi();
  const [stage, setStage] = useState<Stage>('give-code');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userCodes, setUserCodes] = useState<Record<string, string>>(loadSavedCodes);

  useEffect(() => {
    if (entries.length > 0) {
      setUserCodes((prev) => {
        const merged = { ...prev };
        let changed = false;
        entries.forEach((e) => {
          if (!(e.id in merged)) {
            merged[e.id] = e.starterCode;
            changed = true;
          }
        });
        if (changed) saveCodes(merged);
        return merged;
      });
    }
  }, [entries]);

  useEffect(() => {
    saveCodes(userCodes);
  }, [userCodes]);

  const handleViewReport = () => {
    const entry = entries[currentIndex];
    const code = userCodes[entry.id] ?? entry.starterCode;
    submitCode(entry.id, code);
    setStage('report');
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>Loading exercises…</p>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="loading-screen">
        <p>No entries available.</p>
      </div>
    );
  }

  const entry = entries[currentIndex];
  const userCode = userCodes[entry.id] ?? entry.starterCode;

  const handleCodeChange = (code: string) => {
    setUserCodes((prev) => ({ ...prev, [entry.id]: code }));
  };

  return (
    <div className="app">
      {error && (
        <div className="banner-warning" role="alert">
          {error}
        </div>
      )}

      {stage === 'give-code' && (
        <GiveCode
          entry={entry}
          userCode={userCode}
          currentIndex={currentIndex}
          totalEntries={entries.length}
          onCodeChange={handleCodeChange}
          onNext={() => setCurrentIndex((i) => Math.min(i + 1, entries.length - 1))}
          onPrev={() => setCurrentIndex((i) => Math.max(i - 1, 0))}
          onViewReport={handleViewReport}
        />
      )}

      {stage === 'report' && (
        <Report
          entry={entry}
          userCode={userCode}
          onBack={() => setStage('give-code')}
        />
      )}
    </div>
  );
};

export default App;
