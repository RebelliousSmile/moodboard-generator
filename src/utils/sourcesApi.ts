import type { Usage } from '../types';

const BASE = import.meta.env.VITE_IMGSRCRATER_URL;
const TOKEN = import.meta.env.VITE_IMGSRCRATER_TOKEN;

export interface SourceEntry {
  domain: string;
  tier: number;
  hotlink_safe: boolean;
  score: number;
  succes: number;
  echecs: number;
  notes: string;
}

interface SourcesResponse {
  usage: string;
  count: number;
  sources: SourceEntry[];
}

export async function fetchSources(usage: Usage, signal?: AbortSignal): Promise<SourceEntry[]> {
  if (!BASE || !TOKEN) {
    throw new Error('API ImgSrcRater non configurée — vérifiez VITE_IMGSRCRATER_URL et VITE_IMGSRCRATER_TOKEN dans .env');
  }

  const url = `${BASE}/sources?usage=${encodeURIComponent(usage)}`;

  let res: Response;
  try {
    res = await fetch(url, {
      headers: { Authorization: `Bearer ${TOKEN}` },
      signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    throw new Error('Impossible de contacter l\'API ImgSrcRater — vérifiez votre connexion.');
  }

  if (res.status === 401) {
    throw new Error('Token ImgSrcRater invalide — vérifiez VITE_IMGSRCRATER_TOKEN dans .env');
  }

  if (!res.ok) {
    throw new Error(`Erreur API ImgSrcRater (${res.status})`);
  }

  const data: SourcesResponse = await res.json();
  return data.sources;
}
