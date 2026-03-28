import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';
import type { MoodboardData } from '../types';

const HASH_PREFIX = 'mb=';

export function encodeToHash(data: MoodboardData): string {
  const json = JSON.stringify(data);
  return HASH_PREFIX + compressToEncodedURIComponent(json);
}

export function decodeRawHash(raw: string): MoodboardData | null {
  if (!raw.startsWith(HASH_PREFIX)) return null;
  try {
    const compressed = raw.slice(HASH_PREFIX.length);
    const json = decompressFromEncodedURIComponent(compressed);
    if (!json) return null;
    const data = JSON.parse(json) as MoodboardData;
    if (!data.scenario || !Array.isArray(data.images)) return null;
    return data;
  } catch {
    return null;
  }
}

export function decodeFromHash(): MoodboardData | null {
  return decodeRawHash(location.hash.slice(1));
}

export function pushHash(data: MoodboardData): void {
  const hash = encodeToHash(data);
  history.replaceState(null, '', '#' + hash);
}

export function clearHash(): void {
  history.replaceState(null, '', location.pathname + location.search);
}

export async function copyPermalink(): Promise<boolean> {
  const url = location.href;

  // Clipboard API (HTTPS uniquement)
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(url);
      return true;
    } catch { /* fallback ci-dessous */ }
  }

  // Fallback pour HTTP : textarea + execCommand
  const ta = document.createElement('textarea');
  ta.value = url;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  const ok = document.execCommand('copy');
  document.body.removeChild(ta);
  return ok;
}
