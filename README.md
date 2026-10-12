# Atelier

Outil local pour composer à la main des planches de moodboard à partir de liens d'images, puis les exporter en PDF ou en PNG. Tout se passe dans le navigateur : pas de compte, pas de serveur, pas d'envoi de fichier.

## Principe

1. Créer un document et y ajouter des images par leur lien, avec un descriptif et des tags.
2. Poser les images sur des planches, à la main, sur une grille.
3. Régler l'apparence générale et les légendes.
4. Exporter : un PDF de toutes les planches, ou un PNG par planche.

Le document est un fichier YAML lisible, qui s'exporte et se réimporte sans perte. Les documents ouverts sont aussi gardés dans le stockage local du navigateur.

## Exporter

Le bouton « Exporter » ouvre un dialogue à trois zones.

- **PDF** : « Imprimer… » ouvre l'impression du navigateur, à la taille exacte du format, une page par planche. Choisir « Enregistrer au format PDF ».
- **PNG** : la planche active ou toutes les planches, à l'échelle ×1, ×2 ou ×3 (le fichier fait le format multiplié par l'échelle, soit 1588 × 2246 px en A4 ×2). Un fichier par planche, nommé d'après le titre.
- **YAML** : le document, à réimporter tel quel.

### Images qui refusent la capture

Un PNG lit les pixels des images : un site qui l'interdit (absence d'en-tête d'autorisation inter-domaines) ne peut pas y figurer, et l'image sort en bloc gris « img ». Le dialogue liste ces images avant l'export, avec leur planche et leur domaine. Le PDF n'est pas concerné, il affiche l'image comme l'écran.

Pour une telle image, « Remplacer par un fichier… » (dans le panneau d'image, ou depuis la liste du dialogue) la sert depuis un fichier du disque. Le fichier reste **dans ce navigateur** (IndexedDB), jamais dans le YAML : le lien reste dans le document, et l'image retrouve son lien sur une autre machine. Supprimer le document ou l'image supprime aussi le fichier ; dupliquer le document copie les fichiers.

## Démarrer

```sh
pnpm install
pnpm dev
```

Le projet déclare sa version de pnpm (`packageManager`) et de Node (`devEngines.runtime`) : pnpm fournit les deux, sans toucher à ceux du poste.

## Scripts

| Script           | Rôle                                   |
| ---------------- | -------------------------------------- |
| `pnpm dev`       | serveur de développement               |
| `pnpm build`     | vérification des types et compilation  |
| `pnpm typecheck` | vérification des types seule           |
| `pnpm lint`      | ESLint                                 |
| `pnpm format`    | Prettier                               |
| `pnpm test`      | tests unitaires (vitest)               |

## Format du document

```yaml
titre: Été à Lisbonne
format: a4_portrait
grille:
    colonnes: 12
    rangees: 16
apparence:
    marge: 32
    gouttiere: 12
images:
    - id: image_1
      url: https://example.com/a.jpg
      descriptif: Une plage
      tags:
          - mer
      focus:
          x: 50
          y: 50
planches:
    - id: planche_1
      titre: Ouverture
      cadres:
          - image: image_1
            x: 0
            y: 0
            w: 6
            h: 8
```

Seul `titre` est obligatoire ; les autres champs reprennent leur valeur par défaut. Un fichier est refusé, avec le nom du champ fautif, si un cadre sort de la grille, pointe une image absente, ou si une image est posée deux fois.
