---
objective: "Un outil local permet de composer à la main des planches de moodboard à partir de liens d'images, puis de les exporter en PDF multipage et en PNG par planche."
status: implemented
---

# Plan: Atelier de planches de moodboard

## Overview

| Field      | Value                                                                                                                                             |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Goal**   | Nouveau projet `Moodboard/atelier/`, amorcé comme Lantern : réserve d'images, composition sur grille magnétique, apparence générale, export PDF et PNG. |
| **Source** | Brief « Atelier de planches de moodboard » issu du brainstorm du 2026-10-12 (texte de conversation, aucun ticket).                                  |

## Phases

| #   | Phase                                  | File                         |
| --- | -------------------------------------- | ---------------------------- |
| 1   | Socle, document et persistance         | [`phase-1.md`](./phase-1.md) |
| 2   | Images et réserve                      | [`phase-2.md`](./phase-2.md) |
| 3   | Planches et composition sur grille     | [`phase-3.md`](./phase-3.md) |
| 4   | Apparence générale et légendes         | [`phase-4.md`](./phase-4.md) |
| 5   | Export PDF, export PNG, fichiers locaux | [`phase-5.md`](./phase-5.md) |

## Resources

| Source                                                                              | Verified                                                                                                                                                                                                   |
| ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| https://github.com/zumerlab/snapdom/blob/main/docs/docs/options/index.html          | Une image externe illisible ne fait pas échouer la capture : snapdom tente `fallbackURL`, puis pose un bloc de substitution aux mêmes dimensions. `useProxy` n'est qu'un repli optionnel, non retenu ici. Le signalement doit donc être fait par l'application, avant capture. |
| https://github.com/react-grid-layout/react-grid-layout/blob/master/README.md        | La v2 expose `gridConfig` (`cols`, `rowHeight`, `margin`, `containerPadding`, `maxRows`), `dragConfig.bounded`, `dropConfig` pour le dépôt depuis l'extérieur, et un `compactor` dont `allowOverlap: false` + `preventCollision: true` bloque les chevauchements sans pousser les voisins. |
| https://github.com/react-grid-layout/react-grid-layout/blob/master/rfcs/0002-pluggable-constraints.md | `noCompactor` laisse les éléments là où ils sont déposés, vides compris.                                                                                                                 |
| https://github.com/react-grid-layout/react-grid-layout/blob/master/rfcs/0001-v2-typescript-rewrite.md | Sous un parent mis à l'échelle par transformation, `createScaledStrategy(echelle)` (importé de `react-grid-layout/core`) passé à `positionStrategy` corrige les coordonnées du glisser. Le dépôt externe repose sur les événements de glisser-déposer natifs ; `dropConfig.onDragOver` peut refuser un dépôt en renvoyant `false`. |
| https://www.npmjs.com/package/react-grid-layout                                      | Version 2.3.0, dépendance paire `react >= 16.3.0` : React 19 est accepté. Relevé le 2026-10-12.                                                                                                            |
| https://www.npmjs.com/package/typescript-eslint                                      | Version 8.71.1, dépendance paire `typescript >=4.8.4 <6.1.0` : TypeScript 7.0.2, dernière version publiée, est exclu. Le plan retient TypeScript 6.0.3.                                                    |
| https://www.npmjs.com/package/vitest                                                 | Vitest 5.0.4 exige Node `^22.12.0 \|\| ^24.0.0 \|\| >=26.0.0` ; jsdom 30.1.2 et ESLint 10.12.0 posent des contraintes équivalentes. Le Node 23.4.0 installé sur le poste est exclu par les trois.           |
| https://pnpm.io/package_json                                                         | `devEngines.runtime` (`name: node`, plage de version, `onFail: download`) fait télécharger par pnpm le Node du projet et l'inscrit au fichier de verrouillage. https://pnpm.io/blog/releases/11.0 : `useNodeVersion` est retiré. pnpm 12.11.2 est la dernière version, le poste a la 10.5.2. |
| https://github.com/zumerlab/snapdom/blob/main/docs/docs/api/index.html               | snapdom 3 : `snapdom(element, options)` renvoie un objet réutilisable avec `download({ format, filename })` et un tableau `warnings`. La densité se règle par `dpr`, distinct de `scale`. Lantern est en 2.1 : son appel n'est pas à recopier tel quel. |

## Decisions

| Decision                                                                                                   | Why                                                                                                                                                                                                                         |
| ---------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Projet autonome dans `Moodboard/atelier/`, avec son propre dépôt git, sans dépendance de code vers Lantern | Le brief exclut de loger l'outil dans Lantern ; les quatre projets voisins sont déjà des dépôts indépendants. Le socle de Lantern est recopié comme modèle, pas importé.                                                    |
| Même socle que Lantern (Vite, React 19, TypeScript, Zustand, Zod, Tailwind 4, shadcn/ui, snapdom), géré par pnpm, sans i18n ni routeur | « Amorcé comme Lantern » lu comme le même socle technique. i18next et react-router servent des besoins de Lantern (deux langues, onglets adressables) que cet outil personnel n'a pas.                    |
| Dernières versions stables de chaque dépendance au 2026-10-12, et non celles de Lantern ; seule exception, TypeScript 6.0.3 | Projet neuf, sans rien à migrer. TypeScript 7 est exclu par typescript-eslint. Les versions exactes sont listées en phase 1.                                                                |
| Node 24 et pnpm 12 fournis au projet par pnpm lui-même (`devEngines.runtime`, `packageManager`), sans toucher au Node 23 ni au pnpm 10 du poste | L'outillage actuel refuse Node 23. Changer le Node du système toucherait les autres projets du poste ; pnpm sait télécharger et utiliser des versions propres au projet. `useNodeVersion` est écarté : pnpm l'a retiré en version 11. |
| `grid.ts` est la seule source de géométrie : il fournit la configuration de la grille d'édition et la position des cadres en lecture seule | L'édition passe par react-grid-layout, l'impression et la capture par un rendu sans bibliothèque. Si chacun calculait ses positions, l'écran et l'export divergeraient au pixel. |
| Pas d'annulation des actions dans ce plan                                                                  | Le brief ne la demande pas. Les suppressions sont confirmées, les autres gestes se défont à la main, et le fichier YAML sert de point de retour.                                                                            |
| Navigateurs visés : Chrome ou Edge, et Firefox                                                             | L'export PDF dépend du moteur d'impression ; il est contrôlé sur ces deux moteurs. Safari n'est ni visé ni testé.                                                                                                           |
| Une planche est un élément aux dimensions fixes en pixels CSS (96 px par pouce), mise à l'échelle à l'écran par transformation | C'est ce qui garantit que l'aperçu, le PNG et le PDF imprimé partagent exactement la même géométrie : 96 px CSS valent un pouce à l'impression. Une planche fluide rendrait l'export imprévisible.               |
| Le même composant de cadre (image, rognage, légende) sert à l'édition, à l'impression et à la capture       | Principe repris de Lantern : ce qui est affiché est ce qui est exporté. Seul le conteneur diffère : grille interactive en édition, positions fixes en lecture seule.                                                        |
| YAML comme unique format de fichier, pour le document complet comme pour la liste collée                    | Les listes de l'ancien flux sont en YAML ; un seul analyseur, un format lisible et modifiable à la main. Le TOML de Lantern est verbeux pour des tableaux d'objets imbriqués (planches, cadres).                             |
| Deux tranches d'état comme Lantern : le document (exporté) et la vue (zoom, sélection) ; seul le document va dans le fichier | Seul le document traverse la frontière du fichier ; tout état d'interface rangé dedans fuirait dans chaque export.                                                                                                  |
| Le PDF passe par l'impression du navigateur, pas par une bibliothèque de génération                         | L'impression affiche les images externes sans restriction inter-domaines et gère nativement les pages ; c'est l'export de référence du brief.                                                                              |
| L'impression PDF est mise en place et contrôlée dès la phase 3, puis finalisée en phase 5                  | La fidélité entre l'écran et le PDF est le principal risque technique ; un défaut de géométrie découvert après les légendes et l'apparence obligerait à les reprendre.                                                      |
| Les fichiers locaux de remplacement vivent en IndexedDB et ne sont pas inclus dans le fichier YAML          | `localStorage` ne supporte pas des images de plusieurs mégaoctets. Le YAML garde le lien d'origine ; la limite (document non reconstituable ailleurs sans les fichiers) est signalée à l'export.                            |
| Une image est posée au plus une fois ; la réserve contient les images non posées                            | Simplifie le modèle (un cadre référence une image) et rend la réserve lisible. Dupliquer une image reste possible en l'ajoutant deux fois.                                                                                  |
