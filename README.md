# Moodboard Generator

Outil de creation de moodboards visuels a partir de donnees JSON ou YAML. Concu pour les scenarios JDR, le voyage, la fiction, l'illustration, la deco ou la mode.

## Fonctionnalites

### Editeur

- **JSON et YAML** — coller du JSON ou YAML dans l'editeur, auto-detection du format
- **Import fichier** — importer un `.json`, `.yaml` ou `.yml` via le bouton ou par glisser-deposer
- **Exemple integre** — charger un moodboard de demonstration en un clic
- **Validation** — messages d'erreur clairs sur les champs manquants ou invalides

### Affichage

- **Layout masonry** — grille en colonnes CSS (2, 3 ou 4 colonnes)
- **4 tailles de cartes** — `full` (pleine largeur, hero), `tall` (pleine largeur, moyenne), `half` (une colonne), `third` (compact)
- **Annotations** — lieu, date et tags affiches en overlay sur chaque image
- **Positionnement intelligent** — detection automatique du point de focus de l'image (centre, haut, bas) selon les mots-cles et tags
- **Filtres image** — luminosite, contraste et saturation ajustables en temps reel

### Personnalisation

- Couleur de fond et couleur des tags
- Opacite des annotations
- Espacement et arrondi des cartes
- Nombre de colonnes (2 / 3 / 4)
- Filtres image avec reset

### Export et partage

- **PDF multi-pages** — export en A4 portrait, A4 paysage ou A3 portrait, avec pagination automatique
- **Impression** — `@page` injectee dynamiquement selon le format choisi
- **Permalink** — les donnees du moodboard sont compressees (lz-string) dans le hash de l'URL. Recharger la page ou partager le lien restaure le board
- **Bouton Partager** — copie le permalink dans le presse-papier

### Skill IA

Generateur de prompts pour demander a une IA (Claude, ChatGPT, Cursor...) de creer le fichier de donnees du moodboard :

- Choix de l'agent IA cible
- Categories d'usage (voyage, fiction, illustration, deco, mode, JDR)
- Sujet et contexte optionnels
- Themes visuels configurables
- Telechargement d'un fichier `.md` avec les instructions completes

## Format des donnees

```yaml
scenario: Titre du scenario
contexte: Systeme · Epoque · Lieu
images:
  - url: https://...
    lieu: Nom du lieu
    date: "2024"
    taille: full
    tags: [ambiance, tag-deux]
```

Equivalent JSON accepte. Seuls `scenario` et `images[].url` sont obligatoires.

**Tailles** : `full` (pleine largeur, haute) · `tall` (pleine largeur) · `half` (une colonne) · `third` (compact)

## Lancer le projet

```bash
pnpm install
pnpm dev
```

## Deploiement

```bash
pnpm deploy:prod
```

Build Vite + transfert SSH vers Alwaysdata (`/home/jdrspace/www/moodboard`).

## Stack

React 19 · TypeScript · Vite · js-yaml · lz-string · html2canvas · jsPDF

```mermaid
---
title: Moodboard — Architecture post-refonte
---
flowchart TB

    subgraph Utilisateur
        Brief["Brief créatif"]
        BoardUI["Board — mise en page"]
    end

    subgraph FormulaireGuide["Formulaire guidé (client)"]
        StepUsage["1. Choix usage"]
        StepSujet["2. Sujet + contexte"]
        StepThemes["3. Thèmes visuels"]
        StepAgent["4. Choix agent LLM"]
        SourcesCall["GET /sources?usage=X"]
        PromptAssembly["Prompt généré avec sources injectées"]
        CopyPrompt["Copier le prompt"]
    end

    subgraph LLMExterne["LLM Externe — Dialogue créatif"]
        Dialogue["Dialogue + affinage"]
        WebSearch["Recherche web"]
        HTMLExtract["Extraction src / data-src"]
        YAMLGen["Production YAML"]
    end

    subgraph CollerYAML["Retour dans l'app (client)"]
        PasteYAML["Coller YAML"]
        ParseValidate["Parse + validation"]
        DispatchImages["Dispatch images"]
    end

    subgraph APIScoring["API ImgSrcRater — Scoring + Search"]
        GetSources["GET /sources"]
        PostFeedback["POST /feedback"]
        WilsonScore["Score Wilson"]
        SearchEndpoint["POST /search"]
        FlickrAPI["Flickr"]
        EuropeanaAPI["Europeana"]
        MetAPI["Met Museum"]
        ArticAPI["Art Institute Chicago"]
        JikanAPI["Jikan"]
        TMDBAPI["TMDB"]
    end

    subgraph APIResolve["API Resolve — Extraction"]
        ResolveEndpoint["POST /resolve"]
        DirectFetch["1. Fetch direct + Referer"]
        OGExtract["2. og$image / data-src"]
        NextData["3. __NEXT_DATA__ / __NUXT__"]
        PlaywrightHeadless["4. Playwright headless"]
    end

    subgraph APIVision["API Vision — Sélection LLM"]
        VisionEndpoint["POST /vision/select"]
        Candidates["Images candidates"]
        HaikuVision["Haiku Vision + miniatures"]
        SelectBest["Sélection contextuelle"]
    end

    subgraph APIProxy["API Proxy — Image"]
        ProxyEndpoint["GET /proxy?url=X"]
        RefererSpoof["Referer spoofing"]
    end

    subgraph CacheClient["Cache client (existant)"]
        Cache["Cache navigateur"]
    end

    subgraph FeedbackAuto["Feedback automatique (client)"]
        ImgLoad["Image chargée OK"]
        ImgFail["Image échouée"]
    end

    %% --- Formulaire guidé ---
    Brief -- "saisie" --> StepUsage
    StepUsage --> StepSujet
    StepSujet --> StepThemes
    StepThemes --> StepAgent
    StepAgent --> SourcesCall
    SourcesCall --> GetSources
    GetSources -- "domaines triés par score" --> SourcesCall
    SourcesCall -- "sources injectées" --> PromptAssembly
    PromptAssembly --> CopyPrompt

    %% --- LLM externe ---
    CopyPrompt -- "coller dans LLM" --> Dialogue
    Dialogue --> WebSearch
    WebSearch -- "pages trouvées" --> HTMLExtract
    HTMLExtract -- "URLs extraites" --> YAMLGen

    %% --- Retour YAML ---
    YAMLGen -- "YAML produit" --> PasteYAML
    PasteYAML --> ParseValidate
    ParseValidate --> DispatchImages

    %% --- Dispatch : URL directe ou pending ---
    DispatchImages -- "url présente" --> Cache
    DispatchImages -- "source_page présente" --> ResolveEndpoint
    DispatchImages -- "api + query" --> SearchEndpoint

    %% --- Cascade résolution ---
    ResolveEndpoint --> DirectFetch
    DirectFetch -- "OK" --> Cache
    DirectFetch -.-> OGExtract
    OGExtract -- "trouvé" --> Cache
    OGExtract -.-> NextData
    NextData -- "trouvé" --> Cache
    NextData -.-> PlaywrightHeadless
    PlaywrightHeadless -- "1 image claire" --> Cache
    PlaywrightHeadless -- "plusieurs candidates" --> Candidates

    %% --- APIs publiques ---
    SearchEndpoint --> FlickrAPI
    SearchEndpoint --> EuropeanaAPI
    SearchEndpoint --> MetAPI
    SearchEndpoint --> ArticAPI
    SearchEndpoint --> JikanAPI
    SearchEndpoint --> TMDBAPI
    FlickrAPI -- "URL" --> Cache
    EuropeanaAPI -- "URL" --> Cache
    MetAPI -- "URL" --> Cache
    ArticAPI -- "URL" --> Cache
    JikanAPI -- "URL" --> Cache
    TMDBAPI -- "URL" --> Cache

    %% --- Vision sélection ---
    Candidates -- "tags + exclure + intention" --> HaikuVision
    HaikuVision --> SelectBest
    SelectBest -- "meilleure image" --> Cache

    %% --- Proxy hotlink ---
    Cache -- "hotlink bloqué" --> ProxyEndpoint
    ProxyEndpoint --> RefererSpoof
    RefererSpoof -- "image proxifiée" --> Cache

    %% --- Affichage + feedback ---
    Cache --> BoardUI
    BoardUI -- "succès" --> ImgLoad
    BoardUI -- "échec" --> ImgFail
    ImgLoad -- "success$true" --> PostFeedback
    ImgFail -- "success$false" --> PostFeedback
    PostFeedback --> WilsonScore

    %% Styles — Utilisateur (bleu)
    style Brief fill:#4a9eff,color:#fff
    style BoardUI fill:#4a9eff,color:#fff

    %% Styles — Formulaire (bleu clair)
    style StepUsage fill:#74b9ff,color:#fff
    style StepSujet fill:#74b9ff,color:#fff
    style StepThemes fill:#74b9ff,color:#fff
    style StepAgent fill:#74b9ff,color:#fff
    style PromptAssembly fill:#74b9ff,color:#fff
    style CopyPrompt fill:#74b9ff,color:#fff

    %% Styles — LLM externe (violet)
    style Dialogue fill:#a29bfe,color:#fff
    style WebSearch fill:#a29bfe,color:#fff
    style HTMLExtract fill:#a29bfe,color:#fff
    style YAMLGen fill:#a29bfe,color:#fff

    %% Styles — Retour YAML (bleu)
    style PasteYAML fill:#4a9eff,color:#fff
    style ParseValidate fill:#4a9eff,color:#fff
    style DispatchImages fill:#4a9eff,color:#fff

    %% Styles — ImgSrcRater (orange)
    style GetSources fill:#ff9f43,color:#fff
    style PostFeedback fill:#ff9f43,color:#fff
    style WilsonScore fill:#ff9f43,color:#fff
    style SearchEndpoint fill:#ff9f43,color:#fff
    style FlickrAPI fill:#ff9f43,color:#fff
    style EuropeanaAPI fill:#ff9f43,color:#fff
    style MetAPI fill:#ff9f43,color:#fff
    style ArticAPI fill:#ff9f43,color:#fff
    style JikanAPI fill:#ff9f43,color:#fff
    style TMDBAPI fill:#ff9f43,color:#fff

    %% Styles — Résolution (vert)
    style ResolveEndpoint fill:#00b894,color:#fff
    style DirectFetch fill:#00b894,color:#fff
    style OGExtract fill:#00b894,color:#fff
    style NextData fill:#00b894,color:#fff
    style PlaywrightHeadless fill:#00b894,color:#fff

    %% Styles — Vision (rose)
    style VisionEndpoint fill:#fd79a8,color:#fff
    style Candidates fill:#fd79a8,color:#fff
    style HaikuVision fill:#fd79a8,color:#fff
    style SelectBest fill:#fd79a8,color:#fff

    %% Styles — Proxy (gris)
    style ProxyEndpoint fill:#636e72,color:#fff
    style RefererSpoof fill:#636e72,color:#fff

    %% Styles — Cache
    style Cache fill:#b2bec3,color:#2d3436

    %% Styles — Feedback
    style ImgLoad fill:#00b894,color:#fff
    style ImgFail fill:#d63031,color:#fff

```  
