import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';
import type { MoodboardData } from '../types';

const HASH_PREFIX = 'mb=';

export function encodeToHash(data: MoodboardData): string {
  const json = JSON.stringify(data);
  return HASH_PREFIX + compressToEncodedURIComponent(json);
}

export function decodeFromHash(): MoodboardData | null {
  const hash = location.hash.slice(1); // remove #
  if (!hash.startsWith(HASH_PREFIX)) return null;

  try {
    const compressed = hash.slice(HASH_PREFIX.length);
    const json = decompressFromEncodedURIComponent(compressed);
    if (!json) return null;
    const data = JSON.parse(json) as MoodboardData;
    if (!data.scenario || !Array.isArray(data.images)) return null;
    return data;
  } catch {
    return null;
  }
}

export function pushHash(data: MoodboardData): void {
  const hash = encodeToHash(data);
  history.replaceState(null, '', '#' + hash);
}

export function clearHash(): void {
  history.replaceState(null, '', location.pathname + location.search);
}

export async function copyPermalink(): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(location.href);
    return true;
  } catch {
    return false;
  }
}
