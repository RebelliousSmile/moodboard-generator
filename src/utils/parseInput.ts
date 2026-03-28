import * as yaml from 'js-yaml';
import type { MoodboardData } from '../types';

export function parseInput(raw: string): MoodboardData {
  // Détection automatique JSON ou YAML
  const trimmed = raw.trim();
  let data: unknown;

  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    data = JSON.parse(raw);
  } else {
    data = yaml.load(raw);
  }

  if (!data || typeof data !== 'object') {
    throw new Error('Le contenu doit être un objet JSON ou YAML.');
  }
  if (!Array.isArray((data as MoodboardData).images)) {
    throw new Error('Le champ "images" est requis et doit être un tableau.');
  }
  if (!(data as MoodboardData).scenario || typeof (data as MoodboardData).scenario !== 'string') {
    throw new Error('Le champ "scenario" est requis.');
  }

  const d = data as MoodboardData;

  for (let i = 0; i < d.images.length; i++) {
    const img = d.images[i];
    if (!img.url || typeof img.url !== 'string') {
      throw new Error(`Image ${i + 1} : le champ "url" est requis.`);
    }
    if (img.taille && !['full', 'tall', 'half', 'third'].includes(img.taille)) {
      throw new Error(`Image ${i + 1} : taille "${img.taille}" invalide (full/tall/half/third).`);
    }
  }

  return d;
}
