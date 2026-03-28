export interface ImageEntry {
  url: string;
  lieu?: string;
  date?: string;
  taille?: 'full' | 'tall' | 'half' | 'third';
  tags?: string[];
}

export interface MoodboardData {
  scenario: string;
  contexte?: string;
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
