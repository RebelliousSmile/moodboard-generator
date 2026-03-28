const cache = new Map<string, string>();
const pending = new Map<string, Promise<string>>();

export function getCachedSrc(url: string): string | undefined {
  return cache.get(url);
}

export function preloadImage(url: string): Promise<string> {
  const cached = cache.get(url);
  if (cached) return Promise.resolve(cached);

  const inflight = pending.get(url);
  if (inflight) return inflight;

  const p = fetch(url)
    .then((r) => {
      if (!r.ok) throw new Error(r.statusText);
      return r.blob();
    })
    .then((blob) => {
      const objectUrl = URL.createObjectURL(blob);
      cache.set(url, objectUrl);
      pending.delete(url);
      return objectUrl;
    })
    .catch(() => {
      pending.delete(url);
      return url;
    });

  pending.set(url, p);
  return p;
}
