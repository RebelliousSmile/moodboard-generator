import type { MoodboardData, RecentEntry } from '../types';

const STORAGE_KEY = 'moodboard:recent';
const MAX_ENTRIES = 10;

export function saveRecent(data: MoodboardData, hash: string): void {
  try {
    const list = loadRecent().filter(r => r.hash !== hash);
    list.unshift({
      scenario: data.scenario,
      contexte: data.contexte,
      hash,
      timestamp: Date.now(),
      imageCount: data.images.length,
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, MAX_ENTRIES)));
  } catch { /* private browsing */ }
}

export function loadRecent(): RecentEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as RecentEntry[];
  } catch {
    return [];
  }
}
