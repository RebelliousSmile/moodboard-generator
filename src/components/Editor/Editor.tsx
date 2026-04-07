import { useState, useRef, useCallback, type DragEvent } from 'react';
import { parseInput } from '../../utils/parseInput';
import { EXAMPLE_DATA } from '../../utils/exampleData';
import { downloadSkill, DEFAULT_THEMES, type AgentType, type UsageType } from '../../utils/skillContent';
import { fetchSources, type SourceEntry } from '../../utils/sourcesApi';
import { loadRecent } from '../../utils/recentBoards';
import { decodeRawHash } from '../../utils/permalink';
import type { MoodboardData } from '../../types';
import './Editor.css';

function formatDate(ts: number): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(ts));
}

interface EditorProps {
  onGenerate: (data: MoodboardData, raw: string) => void;
  initialValue?: string;
}

const USAGES: { value: UsageType; label: string; sujet: string; contexte: string }[] = [
  {
    value: 'voyage',
    label: 'Voyage',
    sujet: 'ex : Norvège en hiver, road trip côte pacifique...',
    contexte: 'ex : Printemps · 2 semaines · Villes et nature',
  },
  {
    value: 'fiction',
    label: 'Fiction',
    sujet: 'ex : polar noir années 50, fantasy nordique...',
    contexte: 'ex : Chicago · Ambiance sombre · Années 1950',
  },
  {
    value: 'illustration',
    label: 'Illustration',
    sujet: 'ex : portrait en lumière tamisée, architecture gothique...',
    contexte: 'ex : Style graphique · Noir et blanc · Ombres fortes',
  },
  {
    value: 'decoration',
    label: 'Décoration',
    sujet: 'ex : salon minimaliste, cuisine rustique...',
    contexte: 'ex : Palette terreuse · Matières naturelles · Lumière douce',
  },
  {
    value: 'mode',
    label: 'Mode',
    sujet: 'ex : vestiaire automne-hiver, allure sportswear...',
    contexte: 'ex : Palette neutre · Oversized · Textures',
  },
  {
    value: 'jeu_de_role',
    label: 'Jeu de rôle',
    sujet: 'ex : scénario cyberpunk, campagne fantasy médiévale...',
    contexte: 'ex : Futuriste · Dystopie · Mégalopole asiatique',
  },
];

const AGENTS: { value: AgentType; label: string; desc: string }[] = [
  { value: 'claude-ia',   label: 'Claude IA (claude.ai)',        desc: 'fetch HTML + extraction directe' },
  { value: 'chatgpt',     label: 'ChatGPT / Gemini / Autre',    desc: 'source_page + query (pas de fetch)' },
];

export function Editor({ onGenerate, initialValue = '' }: EditorProps) {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [skillOpen, setSkillOpen] = useState(false);
  const [usage, setUsage] = useState<UsageType | null>(null);
  const [sources, setSources] = useState<SourceEntry[] | null>(null);
  const [sourcesLoading, setSourcesLoading] = useState(false);
  const [sourcesError, setSourcesError] = useState<string | null>(null);
  const [sujet, setSujet] = useState('');
  const [contexte, setContexte] = useState('');
  const [agent, setAgent] = useState<AgentType>('claude-ia');
  const [themes, setThemes] = useState<string[]>(() => DEFAULT_THEMES.map(t => t.id));
  const [customTheme, setCustomTheme] = useState('');
  const [recents] = useState(() => loadRecent());
  const fileRef = useRef<HTMLInputElement>(null);
  const sourcesAbort = useRef<AbortController | null>(null);

  const handleGenerate = useCallback(() => {
    const raw = value.trim();
    if (!raw) {
      setError('Le champ est vide.');
      return;
    }
    try {
      const data = parseInput(raw);
      setError('');
      onGenerate(data, raw);
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

  const handleUsageSelect = useCallback((u: UsageType) => {
    sourcesAbort.current?.abort();
    const ctrl = new AbortController();
    sourcesAbort.current = ctrl;
    setUsage(u);
    setSources(null);
    setSourcesError(null);
    setSourcesLoading(true);
    fetchSources(u, ctrl.signal)
      .then(s => {
        setSources(s);
        setSourcesLoading(false);
      })
      .catch(e => {
        if (e instanceof DOMException && e.name === 'AbortError') return;
        setSourcesError((e as Error).message);
        setSourcesLoading(false);
      });
  }, []);

  const toggleTheme = useCallback((themeId: string) => {
    setThemes(prev =>
      prev.includes(themeId) ? prev.filter(t => t !== themeId) : [...prev, themeId]
    );
  }, []);

  const addCustomTheme = useCallback(() => {
    const t = customTheme.trim().toLowerCase().replace(/\s+/g, '_');
    if (!t) return;
    if (!themes.includes(t)) setThemes(prev => [...prev, t]);
    setCustomTheme('');
  }, [customTheme, themes]);

  const handleDownloadSkill = useCallback(() => {
    if (!usage) return;
    downloadSkill({ sujet: sujet.trim(), contexte: contexte.trim(), themes, agent, usage });
  }, [sujet, contexte, themes, agent, usage]);

  const handleRecentClick = useCallback((hash: string) => {
    const data = decodeRawHash(hash);
    if (data) onGenerate(data, JSON.stringify(data, null, 2));
  }, [onGenerate]);

  // All theme options: defaults + custom ones
  const allThemes = [
    ...DEFAULT_THEMES,
    ...themes
      .filter(id => !DEFAULT_THEMES.some(d => d.id === id))
      .map(id => ({ id, label: id.replace(/_/g, ' ') })),
  ];

  return (
    <div className="editor">
      <header className="editor-header">
        <h1 className="logo">
          <span className="logo-monogram">M</span>
          <span className="logo-text">moodboard</span>
        </h1>
        <p>JSON · YAML</p>
      </header>

      <p className="editor-tagline">
        Rassemblez vos images, donnez le ton, partagez l'ambiance.
      </p>

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
        <code>scenario:</code> &nbsp;·&nbsp;
        <code>contexte:</code> &nbsp;·&nbsp;
        <code>usage:</code> &nbsp;·&nbsp;
        <code>ambiance:</code> &nbsp;·&nbsp;
        <code>palette:</code> &nbsp;·&nbsp;
        <code>images</code> avec <code>url</code> | <code>source_page</code> | <code>api</code>, <code>taille</code> (full/tall/half/square), <code>tags</code>, <code>exclure</code>
      </div>

      {/* -- Skill IA -- */}
      <div className="skill-section">
        <button
          className="skill-toggle"
          onClick={() => setSkillOpen(o => !o)}
        >
          {skillOpen ? '✕' : '↓'} Skill IA — générer le prompt système
        </button>

        {skillOpen && (
          <div className="skill-form">
            <p className="skill-form-desc">
              Génère le prompt système pour demander à votre IA de constituer le descripteur YAML du moodboard.
            </p>

            {/* Usage — step 1, always visible */}
            <div className="skill-field">
              <span className="skill-field-label">Usage</span>
              <div className="usage-pills">
                {USAGES.map(u => (
                  <button
                    key={u.value}
                    className={`usage-pill${usage === u.value ? ' selected' : ''}${sourcesLoading && usage === u.value ? ' loading' : ''}`}
                    onClick={() => handleUsageSelect(u.value)}
                    type="button"
                    disabled={sourcesLoading}
                  >
                    {u.label}
                  </button>
                ))}
              </div>
              {sourcesError && (
                <div className="sources-error">{sourcesError}</div>
              )}
            </div>

            {/* Sujet + Contexte — visible dès la sélection d'un usage */}
            {usage !== null && (
              <>
                {/* Sujet */}
                <label className="skill-label">
                  Sujet du moodboard <span className="optional">(optionnel — laisser vide pour que l'IA le demande)</span>
                  <input
                    type="text"
                    value={sujet}
                    onChange={e => setSujet(e.target.value)}
                    placeholder={USAGES.find(u => u.value === usage)?.sujet ?? ''}
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
                    placeholder={USAGES.find(u => u.value === usage)?.contexte ?? ''}
                    className="skill-input"
                  />
                </label>

                {/* Thèmes — visible dès la sélection d'un usage */}
                <div className="skill-field">
                  <span className="skill-field-label">
                    Thèmes visuels à couvrir <span className="optional">(décocher pour exclure)</span>
                  </span>
                  <div className="themes-list">
                    {allThemes.map(theme => (
                      <label key={theme.id} className={`theme-option${themes.includes(theme.id) ? ' checked' : ''}`}>
                        <input
                          type="checkbox"
                          checked={themes.includes(theme.id)}
                          onChange={() => toggleTheme(theme.id)}
                        />
                        <span>{theme.label}</span>
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

                {/* Agent — visible dès la sélection d'un usage */}
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
              </>
            )}

            {/* Download — revealed after sources loaded */}
            {sources !== null && (
              <>
                <div className="skill-form-actions">
                  <button
                    className="primary"
                    onClick={handleDownloadSkill}
                  >
                    ↓ Télécharger le prompt
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* -- Recents -- */}
      {recents.length > 0 && (
        <div className="recent-section">
          <h2 className="recent-title">Moodboards récents</h2>
          <ul className="recent-list">
            {recents.map(r => (
              <li key={r.hash} className="recent-item">
                <button className="recent-link" onClick={() => handleRecentClick(r.hash)}>
                  <span className="recent-scenario">{r.scenario}</span>
                  {r.contexte && <span className="recent-contexte">{r.contexte}</span>}
                  <span className="recent-meta">
                    {r.imageCount} image{r.imageCount > 1 ? 's' : ''} · {formatDate(r.timestamp)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* -- Presentation / SEO -- */}
      <section className="about-section">
        <h2>Qu'est-ce qu'un moodboard ?</h2>
        <p className="about-text">
          Un moodboard est une planche d'images qui capture l'atmosphère d'un projet. On y rassemble des photos, des lieux, des textures, des ambiances — tout ce qui donne le ton et aide à se projeter. C'est un outil de travail pour tous ceux qui pensent en images : auteurs, voyageurs, décorateurs, illustrateurs, équipes créatives.
        </p>

        {/* -- Visuels exemples (degrades CSS) -- */}
        <div className="about-preview">
          <div className="about-preview-card about-preview-wide about-mood-voyage">
            <div className="about-preview-ann">
              <span className="about-preview-loc">Côte amalfitaine, Italie · été 2024</span>
              <div className="about-preview-tags">
                <span>lumière-dorée</span>
                <span>falaises</span>
                <span>mer-ouverte</span>
                <span>départ</span>
              </div>
            </div>
          </div>
          <div className="about-preview-card about-mood-fiction">
            <div className="about-preview-ann">
              <span className="about-preview-loc">Rue sans nom · nuit</span>
              <div className="about-preview-tags">
                <span>ombre</span>
                <span>silence</span>
                <span>tension</span>
              </div>
            </div>
          </div>
          <div className="about-preview-card about-mood-deco">
            <div className="about-preview-ann">
              <span className="about-preview-loc">Atelier, Bordeaux · 2025</span>
              <div className="about-preview-tags">
                <span>lin</span>
                <span>bois-brut</span>
                <span>chaleur</span>
              </div>
            </div>
          </div>
        </div>

        <h2>Ce que l'outil vous permet</h2>
        <div className="about-grid">
          <div className="about-card">
            <strong>Composer librement</strong>
            <p>Assemblez vos images dans une grille qui s'adapte : choisissez entre 2, 3 ou 4 colonnes, et donnez à chaque image la place qu'elle mérite — pleine largeur pour les images-clés, format compact pour les détails.</p>
          </div>
          <div className="about-card">
            <strong>Donner le ton</strong>
            <p>Ajustez les couleurs, la luminosité, le contraste et la saturation. Chaque lieu, chaque date et chaque tag s'affiche en surimpression pour ancrer vos images dans leur contexte.</p>
          </div>
          <div className="about-card">
            <strong>Exporter et imprimer</strong>
            <p>Générez un PDF multi-pages en A4 ou A3, portrait ou paysage. Imprimez vos planches pour les afficher sur un mur ou les intégrer à un dossier.</p>
          </div>
          <div className="about-card">
            <strong>Partager en un lien</strong>
            <p>Chaque moodboard génère un lien permanent. Envoyez-le à vos co-auteurs ou collaborateurs — ils voient exactement ce que vous voyez, sans inscription.</p>
          </div>
        </div>

        <h2>Pour qui ?</h2>
        <ul className="about-usecases">
          <li><strong>Voyageurs</strong> — composez un carnet d'inspiration avant le départ ou un souvenir au retour</li>
          <li><strong>Auteurs et autrices</strong> — gardez sous les yeux les lieux et les visages de votre récit</li>
          <li><strong>Décorateurs et architectes</strong> — planches tendance pour vos projets d'aménagement</li>
          <li><strong>Illustrateurs et graphistes</strong> — rassemblez vos références de couleurs, textures et compositions</li>
          <li><strong>Équipes créatives</strong> — partagez une vision commune en un seul lien, sans outil compliqué</li>
          <li><strong>Scénaristes</strong> — installez une ambiance visuelle pour vos récits ou vos parties</li>
        </ul>
      </section>
    </div>
  );
}
