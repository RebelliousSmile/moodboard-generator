# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com),
and this project adheres to [Semantic Versioning](https://semver.org).

## [0.6.0] - 2026-04-07

### Added

- Loading overlay (pulse 0.8s) on resolved cards while image fetches from network (#13)
- Derived URL state pattern for `imgLoaded` and `imgError` — both auto-reset when URL changes (#13)
- Open link `↗` hidden until image fully loaded (#13)

## [0.5.0] - 2026-04-07

### Added

- Enriched pending card visuals: pulse animation, tier badge (SCRAPE/API), and source label (#12)
- Error state on resolved cards with broken URL: message "Image non disponible" + suggestion (#12)
- Shared `.overlay-label` CSS class for centered card overlays

## [0.4.0] - 2026-04-07

### Added

- Typed resolution strategy dispatch for pending images — `ResolutionStrategy` type and `getResolutionStrategy()` helper in `types.ts` (#11)
- Visual distinction between `pending_scrape` (amber border) and `pending_api` (blue border) cards
- `title` attribute on pending cards for accessibility

## [0.3.0] - 2026-04-07

### Added

- Inject learned sources into skill prompt from ImgSrcRater API (#10)
- One-click copy button for generated prompt with visual feedback

## [0.2.0] - 2026-04-07

### Added

- Agent LLM selector visible immediately after usage selection (#9)

## [0.1.0] - 2026-04-07

### Added

- Usage selector with API source fetch from ImgSrcRater (#6)
- Sujet/contexte fields visible immediately after usage selection (#7)
- Visual themes checkboxes visible immediately after usage selection (#8)
- Configurable skill IA generator with sujet, contexte, themes fields
- Agent selector (Claude IA, ChatGPT)
- Masonry layout for moodboard display
- PDF export and permalink sharing
- Recent boards history
- YAML/JSON descriptor input support
- Snake_case convention for all business identifiers (DEC-001)

### Changed

- Aligned UI components to new YAML descriptor schema
- Aligned schema and prompt to new moodboard descriptor scope
