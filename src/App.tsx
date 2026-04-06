import { useState, useRef, useCallback } from 'react';
import { Editor } from './components/Editor/Editor';
import { Board } from './components/Board/Board';
import { ReviewPanel } from './components/Review/ReviewPanel';
import { SettingsPanel } from './components/Settings/SettingsPanel';
import { ExportBar } from './components/ExportBar/ExportBar';
import { useBoardSettings } from './hooks/useBoardSettings';
import { decodeFromHash, encodeToHash, pushHash, clearHash } from './utils/permalink';
import { saveRecent } from './utils/recentBoards';
import type { MoodboardData } from './types';
import './App.css';

type View = 'editor' | 'board';

const restored = decodeFromHash();

export default function App() {
  const [view, setView] = useState<View>(restored ? 'board' : 'editor');
  const [data, setData] = useState<MoodboardData | null>(restored);
  const [rawInput, setRawInput] = useState(restored ? JSON.stringify(restored, null, 2) : '');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const boardRef = useRef<HTMLDivElement>(null);
  const { settings, update, reset } = useBoardSettings();

  const handleGenerate = useCallback((d: MoodboardData, raw: string) => {
    setData(d);
    setRawInput(raw);
    setView('board');
    const hash = encodeToHash(d);
    pushHash(d);
    saveRecent(d, hash);
    window.scrollTo(0, 0);
  }, []);

  const handleBack = useCallback(() => {
    setView('editor');
    setSettingsOpen(false);
    clearHash();
  }, []);

  const toggleSettings = useCallback(() => {
    setSettingsOpen(prev => !prev);
  }, []);

  const filename = data
    ? `moodboard-${data.scenario.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pdf`
    : 'moodboard.pdf';

  return (
    <>
      {view === 'editor' && (
        <Editor onGenerate={handleGenerate} initialValue={rawInput} />
      )}

      {view === 'board' && data && (
        <>
          <ExportBar
            boardRef={boardRef}
            filename={filename}
            onBack={handleBack}
            onToggleSettings={toggleSettings}
          />
          <Board ref={boardRef} data={data} settings={settings} />
          <ReviewPanel data={data} />
          <SettingsPanel
            settings={settings}
            onUpdate={update}
            onReset={reset}
            open={settingsOpen}
            onToggle={toggleSettings}
          />
        </>
      )}
    </>
  );
}
