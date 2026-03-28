import { useState, useRef, useCallback, type DragEvent } from 'react';
import { parseInput } from '../../utils/parseInput';
import { EXAMPLE_DATA } from '../../utils/exampleData';
import type { MoodboardData } from '../../types';
import './Editor.css';

interface EditorProps {
  onGenerate: (data: MoodboardData) => void;
}

export function Editor({ onGenerate }: EditorProps) {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleGenerate = useCallback(() => {
    const raw = value.trim();
    if (!raw) {
      setError('Le champ JSON est vide.');
      return;
    }
    try {
      const data = parseInput(raw);
      setError('');
      onGenerate(data);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [value, onGenerate]);

  const loadExample = useCallback(() => {
    setValue(JSON.stringify(EXAMPLE_DATA, null, 2));
    setError('');
  }, []);

  const handleFile = useCallback((file: File) => {
    if (!file.name.endsWith('.json')) {
      setError('Seuls les fichiers .json sont acceptés.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setValue(reader.result as string);
      setError('');
    };
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <div className="editor">
      <div className="editor-header">
        <h1>Moodboard Generator</h1>
        <p>Scénario JDR · Format JSON</p>
      </div>

      <div
        className={`textarea-wrap${dragOver ? ' drag-over' : ''}`}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <textarea
          value={value}
          onChange={e => { setValue(e.target.value); setError(''); }}
          spellCheck={false}
          placeholder='Collez votre JSON ici ou glissez un fichier .json...'
        />
        {dragOver && <div className="drop-overlay">Déposez le fichier .json</div>}
      </div>

      {error && <div className="error-msg">{error}</div>}

      <div className="btn-row">
        <button className="primary" onClick={handleGenerate}>Générer →</button>
        <button onClick={loadExample}>Charger l'exemple</button>
        <button onClick={() => fileRef.current?.click()}>Importer un fichier</button>
        <input
          ref={fileRef}
          type="file"
          accept=".json"
          onChange={handleFileInput}
          style={{ display: 'none' }}
        />
      </div>

      <div className="hint">
        Structure JSON attendue :<br />
        <code>"scenario"</code> : Titre &nbsp;·&nbsp;
        <code>"contexte"</code> : Ligne courte &nbsp;·&nbsp;
        <code>"images"</code> : tableau avec <code>url</code>, <code>lieu</code>, <code>date</code>, <code>taille</code> (full/tall/half/third), <code>tags</code>
      </div>
    </div>
  );
}
