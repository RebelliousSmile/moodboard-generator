import { useState, useRef, useCallback } from 'react';
import { Editor } from './components/Editor/Editor';
import { Board } from './components/Board/Board';
import { SettingsPanel } from './components/Settings/SettingsPanel';
import { ExportBar } from './components/ExportBar/ExportBar';
import { useBoardSettings } from './hooks/useBoardSettings';
import type { MoodboardData } from './types';
import './App.css';

type View = 'editor' | 'board';

export default function App() {
  const [view, setView] = useState<View>('editor');
  const [data, setData] = useState<MoodboardData | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const boardRef = useRef<HTMLDivElement>(null);
  const { settings, update, reset } = useBoardSettings();

  const handleGenerate = useCallback((d: MoodboardData) => {
    setData(d);
    setView('board');
    window.scrollTo(0, 0);
  }, []);

  const handleBack = useCallback(() => {
    setView('editor');
    setSettingsOpen(false);
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
        <Editor onGenerate={handleGenerate} />
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
