# Project Brief

## Ce que c'est

Un outil de navigateur, local, pour composer à la main des planches de moodboard à partir de liens d'images externes, chacune portant un descriptif et des tags, et pour exporter le résultat en PDF multipage ou en PNG par planche. Aucun compte, aucun serveur, aucun envoi.

## Pourquoi il existe

Le projet d'origine (`Moodboard/app`, laissé en l'état) cherchait à récupérer des images automatiquement. Le vrai besoin s'est révélé ailleurs : obtenir une mise en page intéressante et exportable. Atelier repart donc du principe de Lantern (`Code/Perso/obsidian/lantern`) : un document validé par un schéma, un rendu fidèle à l'écran de ce qui sera exporté.

## Décisions de cadrage

- **C'est la personne qui compose.** Aucune mise en page automatique : chaque image est posée et dimensionnée à la main sur une grille.
- **Les images sont des liens.** Le document ne contient pas de fichiers image, seulement des URL, un descriptif, des tags et un point de focus.
- **Une image n'est posée qu'une fois.** Les images non posées restent dans la réserve.
- **L'apparence se règle une fois pour tout le document**, pas par planche.
- **Le document est un fichier YAML**, aux clés en français, qui s'exporte et se réimporte sans perte. Le stockage local du navigateur n'est qu'un confort.
- **Projet autonome** à la racine de `Moodboard/`, amorcé comme Lantern, sans rien reprendre de `Moodboard/app` hormis la forme de ses anciennes listes d'images (alias `lieu` et `description` pour le descriptif).

## Hors périmètre

Récupération automatique d'images, recherche, comptes, partage en ligne, collaboration.

La liste des fonctions vit dans `README.md` et n'est pas reprise ici.
