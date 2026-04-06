import * as yaml from 'js-yaml';
import type { MoodboardData } from '../types';

const VALID_TAILLES = ['full', 'tall', 'half', 'square'];

export function parseInput(raw: string): MoodboardData {
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

    // Cascade: at least one resolution strategy must be present
    const hasUrl = img.url && typeof img.url === 'string';
    const hasSourcePage = img.source_page && typeof img.source_page === 'string';
    const hasApi = img.api && typeof img.api === 'string';

    if (!hasUrl && !hasSourcePage && !hasApi) {
      throw new Error(
        `Image ${i + 1} : au moins un champ de résolution est requis (url, source_page, ou api).`
      );
    }

    if (img.taille && !VALID_TAILLES.includes(img.taille)) {
      throw new Error(
        `Image ${i + 1} : taille "${img.taille}" invalide (${VALID_TAILLES.join('/')}).`
      );
    }
  }

  return d;
}
