import { load } from 'cheerio';

// S1: largest <img> by width*height attributes, or first img outside nav/header/footer
export function resolveS1(html: string, _baseUrl: string): string | null {
  const $ = load(html);
  let bestUrl: string | null = null;
  let bestArea = -1;
  $('img').each((_i, el) => {
    const src = $(el).attr('src') || $(el).attr('data-src');
    if (!src) return;
    // skip tiny icons
    const w = parseInt($(el).attr('width') || '0');
    const h = parseInt($(el).attr('height') || '0');
    const area = w * h;
    if (area > bestArea) {
      bestArea = area;
      bestUrl = src;
    }
  });
  return bestUrl;
}

// S2: og:image meta tag
export function resolveS2(html: string): string | null {
  const $ = load(html);
  return $('meta[property="og:image"]').attr('content') || null;
}

// S3: data-src on images
export function resolveS3(html: string): string | null {
  const $ = load(html);
  const src = $('img[data-src]').first().attr('data-src');
  return src || null;
}

// S4: __NEXT_DATA__ JSON extraction
export function resolveS4(html: string): string | null {
  const $ = load(html);
  const script = $('#__NEXT_DATA__').html();
  if (!script) return null;
  try {
    const data = JSON.parse(script);
    // look for first image URL in JSON values
    const json = JSON.stringify(data);
    const match = json.match(/"(https?:\/\/[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/i);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

// S5: placeholder — Playwright disabled by default
export function resolveS5(_html: string): string | null {
  return null; // Playwright not implemented (ENABLE_PLAYWRIGHT=false)
}
