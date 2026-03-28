import type { MoodboardData } from '../types';

export function parseInput(raw: string): MoodboardData {
  const data = JSON.parse(raw);

  if (!data || typeof data !== 'object') {
    throw new Error('Le JSON doit être un objet.');
  }
  if (!Array.isArray(data.images)) {
    throw new Error('Le champ "images" est requis et doit être un tableau.');
  }
  if (!data.scenario || typeof data.scenario !== 'string') {
    throw new Error('Le champ "scenario" est requis.');
  }

  for (let i = 0; i < data.images.length; i++) {
    const img = data.images[i];
    if (!img.url || typeof img.url !== 'string') {
      throw new Error(`Image ${i + 1} : le champ "url" est requis.`);
    }
    if (img.taille && !['full', 'tall', 'half', 'third'].includes(img.taille)) {
      throw new Error(`Image ${i + 1} : taille "${img.taille}" invalide (full/tall/half/third).`);
    }
  }

  return data as MoodboardData;
}
