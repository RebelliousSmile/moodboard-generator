const BASE = import.meta.env.VITE_IMGCACHE_BASE_URL;
const TOKEN = import.meta.env.VITE_IMGCACHE_READ_TOKEN;

export function getCachedImageUrl(url: string): string {
  if (!BASE || !TOKEN) return url;
  return `${BASE}/cache?url=${encodeURIComponent(url)}&token=${TOKEN}`;
}
