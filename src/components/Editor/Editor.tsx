import { useState, useRef, useCallback, type DragEvent } from 'react';
import { parseInput } from '../../utils/parseInput';
import { EXAMPLE_DATA } from '../../utils/exampleData';
import { downloadSkill, DEFAULT_THEMES, type AgentType } from '../../utils/skillContent';
import type { MoodboardData } from '../../types';
import './Editor.css';

interface EditorProps {
  onGenerate: (data: MoodboardData) => void;
}

const AGENTS: { value: AgentType; label: string; desc: string }[] = [
  { value: 'claude-code', label: 'Claude Code',                  desc: 'extraction DOM automatique' },
  { value: 'claude-ia',   label: 'Claude IA (claude.ai)',         desc: 'recherche web intégrée' },
  { value: 'cursor',      label: 'Cursor / Windsurf / Copilot',  desc: 'recherche web + IDE' },
  { value: 'chatgpt',     label: 'ChatGPT / Gemini / Autre',     desc: 'recherche web + URLs manuelles' },
];

export function Editor({ onGenerate }: EditorProps) {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [skillOpen, setSkillOpen] = useState(false);
  const [sujet, setSujet] = useState('');
  const [contexte, setContexte] = useState('');
  const [agent, setAgent] = useState<AgentType>('claude-code');
  const [themes, setThemes] = useState<string[]>([...DEFAULT_THEMES]);
  const [customTheme, setCustomTheme] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleGenerate = useCallback(() => {
    const raw = value.trim();
    if (!raw) {
      setError('Le champ est vide.');
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
    if (!file.name.match(/\.(json|yaml|yml)$/)) {
      setError('Seuls les fichiers .json, .yaml ou .yml sont acceptés.');
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

  const toggleTheme = useCallback((theme: string) => {
    setThemes(prev =>
      prev.includes(theme) ? prev.filter(t => t !== theme) : [...prev, theme]
    );
  }, []);

  const addCustomTheme = useCallback(() => {
    const t = customTheme.trim();
    if (!t) return;
    if (!themes.includes(t)) setThemes(prev => [...prev, t]);
    setCustomTheme('');
  }, [customTheme, themes]);

  const handleDownloadSkill = useCallback(() => {
    if (!sujet.trim()) return;
    downloadSkill({ sujet: sujet.trim(), contexte: contexte.trim(), themes, agent });
  }, [sujet, contexte, themes, agent]);

  return (
    <div className="editor">
      <div className="editor-header">
        <h1>Moodboard Generator</h1>
        <p>JSON · YAML</p>
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
          placeholder='Collez votre JSON ou YAML ici, ou glissez un fichier .json / .yaml...'
        />
        {dragOver && <div className="drop-overlay">Déposez le fichier</div>}
      </div>

      {error && <div className="error-msg">{error}</div>}

      <div className="btn-row">
        <button className="primary" onClick={handleGenerate}>Générer →</button>
        <button onClick={loadExample}>Charger l'exemple</button>
        <button onClick={() => fileRef.current?.click()}>Importer un fichier</button>
        <input
          ref={fileRef}
          type="file"
          accept=".json,.yaml,.yml"
          onChange={handleFileInput}
          style={{ display: 'none' }}
        />
      </div>

      <div className="hint">
        <code>"scenario"</code> ou <code>scenario:</code> &nbsp;·&nbsp;
        <code>"contexte"</code> &nbsp;·&nbsp;
        <code>"images"</code> avec <code>url</code>, <code>lieu</code>, <code>date</code>, <code>taille</code> (full/tall/half/third), <code>tags</code>
      </div>

      {/* ── Skill IA ── */}
      <div className="skill-section">
        <button
          className="skill-toggle"
          onClick={() => setSkillOpen(o => !o)}
        >
          {skillOpen ? '✕' : '↓'} Skill IA — générer le fichier de référence
        </button>

        {skillOpen && (
          <div className="skill-form">
            <p className="skill-form-desc">
              Génère un fichier d'instructions pour demander à votre IA de créer le fichier de données du moodboard.
            </p>

            {/* Agent */}
            <div className="skill-field">
              <span className="skill-field-label">Agent IA</span>
              <div className="agent-list">
                {AGENTS.map(a => (
                  <label key={a.value} className={`agent-option${agent === a.value ? ' selected' : ''}`}>
                    <input
                      type="radio"
                      name="agent"
                      value={a.value}
                      checked={agent === a.value}
                      onChange={() => setAgent(a.value)}
                    />
                    <span className="agent-name">{a.label}</span>
                    <span className="agent-desc">{a.desc}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Sujet */}
            <label className="skill-label">
              Sujet du moodboard <span className="required">*</span>
              <input
                type="text"
                value={sujet}
                onChange={e => setSujet(e.target.value)}
                placeholder="ex : voyage au Japon, scénario JDR Nagasaki, architecture brutaliste..."
                className="skill-input"
              />
            </label>

            {/* Contexte */}
            <label className="skill-label">
              Contexte <span className="optional">(optionnel)</span>
              <input
                type="text"
                value={contexte}
                onChange={e => setContexte(e.target.value)}
                placeholder="ex : Demon Thrills · Contemporain · Îles Goto"
                className="skill-input"
              />
            </label>

            {/* Thèmes */}
            <div className="skill-field">
              <span className="skill-field-label">
                Thèmes visuels à couvrir <span className="optional">(décocher pour exclure)</span>
              </span>
              <div className="themes-list">
                {[...DEFAULT_THEMES, ...themes.filter(t => !DEFAULT_THEMES.includes(t))].map(theme => (
                  <label key={theme} className={`theme-option${themes.includes(theme) ? ' checked' : ''}`}>
                    <input
                      type="checkbox"
                      checked={themes.includes(theme)}
                      onChange={() => toggleTheme(theme)}
                    />
                    <span>{theme}</span>
                  </label>
                ))}
              </div>
              <div className="theme-add">
                <input
                  type="text"
                  value={customTheme}
                  onChange={e => setCustomTheme(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addCustomTheme()}
                  placeholder="Ajouter un thème..."
                  className="skill-input theme-add-input"
                />
                <button onClick={addCustomTheme} disabled={!customTheme.trim()} className="theme-add-btn">+</button>
              </div>
            </div>

            <div className="skill-form-actions">
              <button
                className="primary"
                onClick={handleDownloadSkill}
                disabled={!sujet.trim()}
              >
                ↓ Télécharger la skill
              </button>
              {!sujet.trim() && (
                <span className="skill-form-hint">Le sujet est requis</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
