import type { Usage } from '../types';

export type AgentType = 'claude-ia' | 'chatgpt';

export type UsageType = Usage;

export interface ThemeOption {
  id: string;
  label: string;
}

export interface SkillOptions {
  sujet: string;
  contexte: string;
  themes: string[];
  agent: AgentType;
  usage: UsageType;
}

export const DEFAULT_THEMES: ThemeOption[] = [
  { id: 'lieu_emblematique', label: 'Lieu principal ou emblématique' },
  { id: 'ambiance_lumiere_saison', label: 'Ambiance (lumière, saison, atmosphère)' },
  { id: 'detail_texture', label: 'Détail ou texture caractéristique' },
  { id: 'moment_activite', label: 'Moment ou activité liée au sujet' },
  { id: 'contraste_tension', label: 'Contraste ou tension visuelle' },
  { id: 'element_humain_echelle', label: 'Élément humain ou d\'échelle' },
];

const USAGE_LABELS: Record<UsageType, string> = {
  voyage: 'VOYAGE',
  fiction: 'FICTION',
  illustration: 'ILLUSTRATION',
  decoration: 'DECORATION',
  mode: 'MODE',
  jeu_de_role: 'JEU_DE_ROLE',
};

function getAgentStrategy(agent: AgentType): string {
  if (agent === 'claude-ia') {
    return `Si agent = claude_web :
  Tu fetch les pages sources et tu extrais les src / data-src / og:image
  directement dans le HTML. Tu renseignes url: quand tu trouves,
  source_page: sinon.
  Tu cherches aussi : __NEXT_DATA__, __NUXT__, balises <figure>, <picture>.`;
  }

  return `Si agent = chatgpt | autre :
  Tu ne peux pas fetch. Tu renseignes uniquement source_page: et query:.
  L'app fera l'extraction elle-même via son pipeline de résolution.`;
}

function buildThemesBlock(themes: string[]): string {
  return themes.map(t => `# - ${t}`).join('\n');
}

export function generateSkillContent({ sujet, contexte, themes, agent, usage }: SkillOptions): string {
  const hasSujet = sujet.trim().length > 0;
  const hasContexte = contexte.trim().length > 0;

  const sujetVal = hasSujet ? sujet.trim() : '{sujet}';
  const contexteVal = hasContexte ? contexte.trim() : '{contexte}';
  const usageVal = USAGE_LABELS[usage] || usage.toUpperCase();
  const agentVal = agent === 'claude-ia' ? 'claude_web' : 'chatgpt';

  const themesBlock = buildThemesBlock(
    themes.length > 0 ? themes : DEFAULT_THEMES.map(t => t.id)
  );

  const agentStrategy = getAgentStrategy(agent);

  return `# Moodboard — Prompt Système LLM Étape 1

Tu constitues le descripteur YAML d'un moodboard visuel.

━━ CONTEXTE DE LA REQUÊTE ━━

Usage : ${usageVal}
Agent : ${agentVal}
Sujet : ${sujetVal}
Contexte : ${contexteVal}

Thèmes visuels demandés :
${themesBlock}

━━ SOURCES PRIORITAIRES (apprises) ━━

{sources_apprises_par_usage}
# Injecté dynamiquement par l'app depuis url_learning.yml
# Ces domaines ont fonctionné pour cet usage — commence par eux.
# Les domaines en echecs[] sont à éviter.

━━ STRATÉGIE SELON L'AGENT ━━

${agentStrategy}

━━ STRATÉGIE DE RECHERCHE ━━

Pour chaque image à trouver, tu cherches dans cet ordre de priorité :

TIER 1 — Sites institutionnels spécialisés
  Offices du tourisme, musées, archives, fondations culturelles.
  Ces sites ont du contenu situé et photographié localement.
  Tu fetch la page et tu lis les src / data-src directement dans le HTML.

TIER 2 — Blogs spécialisés
  WordPress, sites de voyage, sites de fans, blogs thématiques.
  CDN S3 publics, pas de hotlink check, HTML statique.
  Tu fetch et tu extrais.

TIER 3 — APIs publiques (si les tiers 1-2 échouent)
  flickr     : photos CC par lieu/tags, URLs directes stables
  europeana  : archives européennes, art, histoire
  met_museum : 400k œuvres domaine public, sans clé
  artic      : Art Institute of Chicago, sans clé
  jikan      : MyAnimeList, personnages anime/manga
  tmdb       : films et séries
  wikimedia  : domaine public, via API (jamais en hotlink direct)
  Tu indiques api: + query: dans le YAML, l'app fait l'appel.

TIER 4 — Source page avec sélection vision
  Tu as trouvé une page pertinente mais pas d'URL directe.
  Tu indiques source_page: + query: + exclure:.
  L'app extrait les candidates, le LLM vision sélectionne.

Tu n'utilises JAMAIS Unsplash, Pexels, Getty, Shutterstock ou similaires
sauf si le sujet est totalement générique et qu'aucune source spécialisée
n'existe.

━━ MAPPING THÈMES → SLOTS ━━

Chaque thème coché devient un ou plusieurs slots YAML.
Tu ne génères pas de slots pour les thèmes décochés.

  lieu_emblematique      → 1-2 images, taille: full ou tall
  ambiance_lumiere       → 1 image,   taille: half ou full
  detail_texture         → 1-2 images, taille: square ou half
  moment_activite        → 1 image,   taille: half
  contraste_tension      → 1 image,   taille: full  (image forte)
  element_humain         → 1 image,   taille: half

Répartition typique sur 9 images : 2 full · 4 half · 2 tall · 1 square

━━ SCHÉMA YAML PRODUIT ━━

\`\`\`yaml
scenario: "${sujetVal}"
contexte: "${contexteVal}"
usage: "${usage}"
ambiance: ""
palette: ""

images:

  - id: 1
    theme: lieu_emblematique
    lieu: ""
    date: ""
    taille: full

    url: ~
    source_page: ~
    api: ~
    query: ~

    tags: []
    exclure: []
    intention: ""

    source_domaine: ""
    source_tier: 1
    hotlink_safe: true
\`\`\`

━━ RÈGLES ━━

SOURCES
- Tu fetch au moins 3 pages sources avant de produire le YAML.
- Tu utilises les sources_apprises en priorité absolue.
- Tu privilégies les URLs directes sur les source_page.
- Tu annotes hotlink_safe: false si le domaine est connu pour bloquer.
- Tu ne répètes pas le même domaine pour plus de 2 images.

SÉMANTIQUE
- Les tags sont en minuscules, sans espaces (kebab-case).
- exclure: est obligatoire — minimum 3 valeurs par image.
- intention: est une phrase courte à la première personne :
  "on doit sentir le vide après la catastrophe".

COHÉRENCE
- Tu vérifies que les images forment un ensemble cohérent
  avec l'ambiance et la palette de l'en-tête.
- Tu varies les tailles selon la répartition typique.
- Tu alternes les temporalités si pertinent (archive + contemporain).

FORMAT
- Tu produis uniquement du YAML valide, rien d'autre.
- Les valeurs nulles s'écrivent ~ (pas null, pas "").
- Les chaînes avec caractères spéciaux sont entre guillemets doubles.

━━ CE QUE TU NE FAIS PAS ━━

- Tu n'inventes pas d'URLs. Si tu n'as pas trouvé d'URL directe,
  tu laisses url: ~ et tu renseignes source_page: ou api:.
- Tu ne produis pas de YAML sans avoir fait au moins une recherche web.
- Tu n'utilises jamais wikimedia.org en url: directe (hotlink bloqué).
- Tu ne mets pas plus de 2 images du même domaine.
`;
}

export function downloadSkill(options: SkillOptions) {
  const content = generateSkillContent(options);
  const blob = new Blob([content], { type: 'text/markdown; charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'moodboard-skill.md';
  a.click();
  URL.revokeObjectURL(url);
}
