export interface SkillOptions {
  sujet: string;
  contexte: string;
  themes: string;
}

export function generateSkillContent({ sujet, contexte, themes }: SkillOptions): string {
  const themesBlock = themes.trim()
    ? themes.trim().split('\n').filter(Boolean).map(t => `- ${t.replace(/^-\s*/, '')}`).join('\n')
    : `- Lieu principal ou emblématique
- Ambiance générale (lumière, saison, atmosphère)
- Détail ou texture caractéristique
- Moment ou activité liée au sujet
- Contraste ou tension visuelle
- Élément humain ou d'échelle`;

  return `---
name: moodboard-generator
description: >
  Génère un fichier YAML de données pour alimenter l'application moodboard-generator.
  Sujet : ${sujet}. Recherche des images réelles, extrait les vraies URLs depuis le DOM
  ou via web search, et produit un fichier YAML structuré prêt à coller dans l'application.
---

# Moodboard — ${sujet}

## Contexte

${contexte || `Créer un moodboard visuel sur le sujet : **${sujet}**.`}

## Objectif

Produire un fichier YAML prêt à coller dans l'application moodboard-generator.
Ce fichier contient uniquement les données (URLs, lieux, dates, tags) — l'application se charge de l'affichage.

## Format de sortie

\`\`\`yaml
scenario: ${sujet}
contexte: ${contexte || sujet}

images:

  - url: https://domaine.com/chemin/image.jpg
    lieu: Lieu précis
    date: "2024"
    taille: full
    tags:
      - hashtag-un
      - hashtag-deux
      - hashtag-trois

  - url: https://autre-domaine.com/image.jpg
    lieu: Autre lieu
    date: aujourd'hui
    taille: half
    tags:
      - hashtag-a
      - hashtag-b
\`\`\`

### Champs par image

- **url** : URL directe extraite depuis le DOM ou la page — jamais inventée
- **lieu** : lieu précis (ville, bâtiment, quartier) — pas juste le pays
- **date** : année, décennie, \`aujourd'hui\`, ou \`inconnu\`
- **taille** : \`full\` (grande impact), \`tall\` (secondaire pleine largeur), \`half\` (paire), \`third\` (petit)
- **tags** : 4 à 6 hashtags descriptifs, sans accents, reliés par des tirets

## Workflow

### Étape 1 — Thèmes visuels à couvrir

${themesBlock}

Viser 8 à 12 images au total, en couvrant chaque thème.

### Étape 2 — Trouver les images

Utiliser la recherche d'images disponible *(via \`image_search\` sur Claude Code, ou web search sur les autres LLMs)*.

**Sources fiables (pas de watermark, pas de restriction CORS)** :
- \`upload.wikimedia.org\` — domaine public
- \`encirclephotos.com\` — photographies monde entier
- \`unsplash.com\` — libre de droits
- Blogs et sites de voyage (souvent accessibles)
- Sites officiels de tourisme

**Éviter** : Getty Images, Alamy, Shutterstock (watermarks)

### Étape 3 — Extraire les URLs

**Sur Claude Code** — naviguer vers la page et extraire via ce script :

\`\`\`javascript
Array.from(document.querySelectorAll('img[src], img[data-src], img[data-lazy-src]'))
  .map(i => i.getAttribute('data-src') || i.getAttribute('data-lazy-src') || i.src)
  .filter(s => s && s.match(/\\.(jpg|jpeg|png|webp)/i)
    && !s.includes('logo') && !s.includes('icon')
    && !s.includes('150x') && !s.includes('300x'))
  .slice(0, 20)
\`\`\`

**Sur les autres LLMs** — noter l'URL de l'image telle qu'elle apparaît dans la page visitée, ou demander à l'utilisateur de fournir les URLs des images qu'il a sélectionnées.

### Étape 4 — Choisir les tailles

- **full** : image la plus forte, ouverture ou fermeture de la planche
- **tall** : image forte secondaire, pleine largeur
- **half** : images de bonne qualité, groupées en paires
- **third** : image faible ou résolution limitée

Ne pas enchaîner plus de deux \`full\` ou \`tall\` consécutifs.

## Règles des tags

Format : mots courts sans accents, reliés par des tirets, minuscules.
Le \`#\` est ajouté automatiquement par l'application.

Privilegier des tags de **lecture** plutôt que de simple description :
- Ce que l'image évoque (émotion, tension, atmosphère)
- Ce qu'elle raconte sur le sujet
- Un détail visuel marquant

Éviter les tags génériques sans qualificatif (\`japon\`, \`nuit\`, \`mer\` seuls).

## Livrable

Produire un bloc YAML valide dans un code block, prêt à copier-coller :

\`\`\`yaml
scenario: ${sujet}
contexte: ${contexte || sujet}
images:
  - url: ...
    ...
\`\`\`

Indiquer en fin de réponse les thèmes non couverts, si certains n'ont pas pu être illustrés.
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
