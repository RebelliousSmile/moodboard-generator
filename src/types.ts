export type Usage = 'voyage' | 'fiction' | 'illustration' | 'decoration' | 'mode' | 'jeu_de_role';

export type Taille = 'full' | 'tall' | 'half' | 'square';

export type Theme =
  | 'lieu_emblematique'
  | 'ambiance_lumiere_saison'
  | 'detail_texture'
  | 'moment_activite'
  | 'contraste_tension'
  | 'element_humain_echelle';

export type ApiSource =
  | 'flickr'
  | 'europeana'
  | 'met_museum'
  | 'artic'
  | 'cleveland_art'
  | 'jikan'
  | 'tmdb'
  | 'wikimedia';

export type SourceTier = 1 | 2 | 3 | 4;

export interface ImageEntry {
  id?: number;
  theme?: Theme | string;

  // Metadata
  lieu?: string;
  date?: string;
  taille?: Taille;

  // Cascade resolution — app stops at first that works
  url?: string;
  source_page?: string;
  api?: ApiSource | string;
  query?: string;

  // Vision selection
  tags?: string[];
  exclure?: string[];
  intention?: string;

  // Pipeline metadata
  source_domaine?: string;
  source_tier?: SourceTier;
  hotlink_safe?: boolean;
}

export interface MoodboardData {
  scenario: string;
  contexte?: string;
  usage?: Usage | string;
  ambiance?: string;
  palette?: string;
  images: ImageEntry[];
}

export interface BoardSettings {
  bgColor: string;
  textColor: string;
  tagColor: string;
  annotationOpacity: number;
  gap: number;
  borderRadius: number;
  columns: number;
  brightness: number;
  contrast: number;
  saturation: number;
}

export interface RecentEntry {
  scenario: string;
  contexte?: string;
  hash: string;
  timestamp: number;
  imageCount: number;
}

export type ResolutionStrategy = 'resolved' | 'pending_scrape' | 'pending_api';

export function getResolutionStrategy(entry: ImageEntry): ResolutionStrategy {
  if (entry.url) return 'resolved';
  if (entry.source_page) return 'pending_scrape';
  return 'pending_api';
}

export const DEFAULT_SETTINGS: BoardSettings = {
  bgColor: '#EAE4DA',
  textColor: 'rgba(205,192,172,.68)',
  tagColor: '#8CB88C',
  annotationOpacity: 0.9,
  gap: 5,
  borderRadius: 0,
  columns: 2,
  brightness: 0.88,
  contrast: 1.06,
  saturation: 0.88,
};
