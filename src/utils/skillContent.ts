export const SKILL_CONTENT = `---
name: moodboard-scenario
description: Génère un fichier YAML de données pour alimenter l'application moodboard-generator. Recherche des images réelles via image_search et Claude in Chrome, extrait les vraies URLs src depuis le DOM, et produit un fichier YAML structuré prêt à coller dans l'application. À utiliser quand l'auteur a besoin d'inspiration visuelle pour un scénario de jeu de rôle.
---

# Moodboard scénario — instructions

## Objectif

Produire un fichier YAML de données qui alimentera l'application moodboard-generator. Ce skill ne génère pas de HTML — il génère uniquement le fichier de données. L'application se charge de l'affichage.

## Pourquoi YAML et pas JSON

YAML est préféré à JSON pour l'édition humaine : pas de guillemets obligatoires sur les clés, pas de virgules de fin de ligne, pas d'accolades imbriquées, les listes s'écrivent avec de simples tirets. Moins d'erreurs de syntaxe lors d'une édition manuelle ou assistée par IA.

## Format YAML produit

\`\`\`yaml
scenario: Titre du scénario
contexte: Système · Genre · Lieu · Époque

images:

  - url: https://domaine.com/chemin/image.jpg
    lieu: Lieu précis, région, pays
    date: "2020"
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

### Champs obligatoires par image

- **url** : URL directe de l'image, extraite depuis le DOM — jamais devinée ou inventée
- **lieu** : lieu précis (ville, île, bâtiment) — pas juste le pays
- **date** : année si connue, décennie (\`années 1950\`), \`aujourd'hui\`, ou \`lieu et date inconnus\`
- **taille** : \`full\` (pleine largeur, fort impact), \`tall\` (pleine largeur secondaire), \`half\` (demi-largeur), \`third\` (demi-largeur faible)
- **tags** : entre 4 et 6 hashtags de lecture scénaristique, en liste YAML

### Champs absents intentionnellement

- **position** : calculée automatiquement par l'application selon l'URL et les tags — ne pas l'inclure
- **source** : l'URL suffit pour retrouver l'origine — ne pas l'inclure

## Workflow de collecte

### Étape 1 — Identifier les thèmes visuels

Définir entre 6 et 10 familles thématiques. Pour tout scénario JDR couvrir au minimum :
lieu principal · ambiance climatique · lieu d'arrivée des PJ · lieu de tension maximale · trace de l'antagoniste · ancrage historique · lieu de résolution

### Étape 2 — Trouver les sources via image_search

Pour chaque famille, lancer une recherche \`image_search\` ciblée sur des photographies réelles. Retenir les sites dont les images sont directement accessibles.

**Sources fiables** :
- \`voyapon.s3.amazonaws.com\` — photographies Japon, pas de restriction CORS
- \`nagasaki-tabinet.com\` — tourisme officiel Nagasaki
- \`kanpai.fr\`, \`ichiban-japan.com\` — blogs voyage Japon
- \`upload.wikimedia.org\` — domaine public, toujours accessible
- \`res.cloudinary.com/jnto\` — JNTO office tourisme japonais
- \`encirclephotos.com\` — photographies monde entier

**Sources à éviter** : Getty Images, Alamy, Shutterstock (watermarks et blocages)

### Étape 3 — Extraire les vraies URLs via Claude in Chrome

Ne jamais deviner ou construire une URL. Toujours l'extraire depuis le DOM.

1. Naviguer vers la page avec \`navigate\`
2. Extraire les URLs avec ce script :

\`\`\`javascript
Array.from(document.querySelectorAll('img[src], img[data-src], img[data-lazy-src]'))
  .map(i => i.getAttribute('data-src') || i.getAttribute('data-lazy-src') || i.src)
  .filter(s => s && s.match(/\\.(jpg|jpeg|png|webp)/i)
    && !s.includes('logo') && !s.includes('icon')
    && !s.includes('avatar') && !s.includes('150x') && !s.includes('300x'))
  .slice(0, 20)
\`\`\`

3. Si peu d'images (lazy loading), utiliser \`read_network_requests\` avec \`urlPattern: ".jpg"\` après rechargement.
4. Préférer les URLs avec \`-1024x\`, \`-1280x\` ou sans suffixe de taille.

### Étape 4 — Choisir la taille

- **full** : image la plus forte, sujet clair, grande lisibilité — ouverture et fermeture de planche
- **tall** : image forte secondaire, pleine largeur mais moins haute
- **half** : image de bonne qualité, groupée en paires
- **third** : image faible ou résolution limitée

Ne jamais enchaîner plus de deux \`full\` ou \`tall\` consécutifs.

## Règles des hashtags

Format : mots courts sans accents, reliés par des tirets, minuscules. Le \`#\` est ajouté par l'application — ne pas l'inclure dans le YAML.

**Catégories** :
- Sensoriel : \`silence-portuaire\` \`odeur-sel\` \`beton-froid\` \`humidite\`
- Émotionnel : \`malaise\` \`fausse-securite\` \`melancolie\` \`isolement\`
- Narratif : \`retour-coupe\` \`sans-issue\` \`normalite-brisee\` \`encercle\`
- Détail visuel : \`cables-enchevetre\` \`portes-entrouvertes\` \`rouille\`
- Thématique : \`mort-prematuree\` \`memoire-enfouie\` \`rituel\` \`disparus\`

Jamais de hashtags génériques seuls (\`japon\`, \`nuit\`, \`mer\` sans qualificatif).

## Output final

Produire un bloc YAML valide dans un code block, prêt à copier-coller dans l'application :

\`\`\`yaml
scenario: ...
contexte: ...
images:
  - url: ...
    ...
\`\`\`

Suivi d'un bref rappel des thèmes non couverts si certaines familles n'ont pas pu être illustrées.
`;

export function downloadSkill() {
  const blob = new Blob([SKILL_CONTENT], { type: 'text/markdown; charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'moodboard-scenario.md';
  a.click();
  URL.revokeObjectURL(url);
}
