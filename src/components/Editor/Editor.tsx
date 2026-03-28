import { useState, useRef, useCallback, type DragEvent } from 'react';
import { parseInput } from '../../utils/parseInput';
import { EXAMPLE_DATA } from '../../utils/exampleData';
import { downloadSkill, DEFAULT_THEMES, type AgentType } from '../../utils/skillContent';
import type { MoodboardData } from '../../types';
import './Editor.css';

interface EditorProps {
  onGenerate: (data: MoodboardData) => void;
}

const USAGES: { value: string; label: string; sujet: string; contexte: string }[] = [
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
    value: 'deco',
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
    value: 'jdr',
    label: 'Jeu de rôle',
    sujet: 'ex : scénario cyberpunk, campagne fantasy médiévale...',
    contexte: 'ex : Futuriste · Dystopie · Mégalopole asiatique',
  },
];

const AGENTS: { value: AgentType; label: string; desc: string }[] = [
  { value: 'claude-ia',   label: 'Claude IA (claude.ai)',        desc: 'recherche web intégrée' },
  { value: 'cursor',      label: 'Cursor / Windsurf / Copilot', desc: 'recherche web + IDE' },
  { value: 'chatgpt',     label: 'ChatGPT / Gemini / Autre',    desc: 'recherche web + URLs manuelles' },
];

export function Editor({ onGenerate }: EditorProps) {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [skillOpen, setSkillOpen] = useState(false);
  const [usage, setUsage] = useState(USAGES[0].value);
  const [sujet, setSujet] = useState('');
  const [contexte, setContexte] = useState('');
  const [agent, setAgent] = useState<AgentType>('claude-ia');
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
    downloadSkill({ sujet: sujet.trim(), contexte: contexte.trim(), themes, agent });
  }, [sujet, contexte, themes, agent]);

  return (
    <div className="editor">
      <header className="editor-header">
        <h1>Moodboard</h1>
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

            {/* Usage */}
            <div className="skill-field">
              <span className="skill-field-label">Usage</span>
              <div className="usage-pills">
                {USAGES.map(u => (
                  <button
                    key={u.value}
                    className={`usage-pill${usage === u.value ? ' selected' : ''}`}
                    onClick={() => setUsage(u.value)}
                    type="button"
                  >
                    {u.label}
                  </button>
                ))}
              </div>
            </div>

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
              >
                ↓ Télécharger la skill
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Presentation / SEO ── */}
      <section className="about-section">
        <h2>Qu'est-ce qu'un moodboard ?</h2>
        <p className="about-text">
          Un moodboard est une planche d'images qui capture l'atmosphere d'un projet. On y rassemble des photos, des lieux, des textures, des ambiances — tout ce qui donne le ton et aide a se projeter. C'est un outil de travail pour tous ceux qui pensent en images : auteurs, voyageurs, decorateurs, illustrateurs, equipes creatives.
        </p>

        {/* ── Visuels exemples (degrades CSS) ── */}
        <div className="about-preview">
          <div className="about-preview-card about-preview-wide about-mood-voyage">
            <div className="about-preview-ann">
              <span className="about-preview-loc">Cote amalfitaine, Italie · ete 2024</span>
              <div className="about-preview-tags">
                <span>lumiere-doree</span>
                <span>falaises</span>
                <span>mer-ouverte</span>
                <span>depart</span>
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
            <p>Assemblez vos images dans une grille qui s'adapte : choisissez entre 2, 3 ou 4 colonnes, et donnez a chaque image la place qu'elle merite — pleine largeur pour les images-cles, format compact pour les details.</p>
          </div>
          <div className="about-card">
            <strong>Donner le ton</strong>
            <p>Ajustez les couleurs, la luminosite, le contraste et la saturation. Chaque lieu, chaque date et chaque tag s'affiche en surimpression pour ancrer vos images dans leur contexte.</p>
          </div>
          <div className="about-card">
            <strong>Exporter et imprimer</strong>
            <p>Generez un PDF multi-pages en A4 ou A3, portrait ou paysage. Imprimez vos planches pour les afficher a votre table de jeu ou les integrer a un dossier.</p>
          </div>
          <div className="about-card">
            <strong>Partager en un lien</strong>
            <p>Chaque moodboard genere un lien permanent. Envoyez-le a vos joueurs, co-auteurs ou collaborateurs — ils voient exactement ce que vous voyez, sans inscription.</p>
          </div>
        </div>

        <h2>Pour qui ?</h2>
        <ul className="about-usecases">
          <li><strong>Voyageurs</strong> — composez un carnet d'inspiration avant le depart ou un souvenir au retour</li>
          <li><strong>Auteurs et autrices</strong> — gardez sous les yeux les lieux et les visages de votre recit</li>
          <li><strong>Decorateurs et architectes</strong> — planches tendance pour vos projets d'amenagement</li>
          <li><strong>Illustrateurs et graphistes</strong> — rassemblez vos references de couleurs, textures et compositions</li>
          <li><strong>Equipes creatives</strong> — partagez une vision commune en un seul lien, sans outil complique</li>
          <li><strong>Scenaristes</strong> — installez une ambiance visuelle pour vos recits ou vos parties</li>
        </ul>
      </section>
    </div>
  );
}
