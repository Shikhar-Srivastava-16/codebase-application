import React, { useState, useEffect } from 'react';
import GiveCode from './components/GiveCode';
import Report from './components/Report';
import { Stage } from './types';
import { useApi } from './hooks/useApi';
import './App.css';

const App: React.FC = () => {
  const { entries, loading, error } = useApi();
  const [stage, setStage] = useState<Stage>('give-code');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userCodes, setUserCodes] = useState<Record<string, string>>({});

  useEffect(() => {
    if (entries.length > 0) {
      const initial: Record<string, string> = {};
      entries.forEach((e) => {
        initial[e.id] = e.starterCode;
      });
      setUserCodes(initial);
    }
  }, [entries]);

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
          onViewReport={() => setStage('report')}
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
