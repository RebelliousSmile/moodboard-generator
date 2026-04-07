import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fetchHtml } from './resolvers/fetchHtml';
import { resolveS1, resolveS2, resolveS3, resolveS4, resolveS5 } from './resolvers/strategies';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean);

app.use(express.json());
app.use(cors({ origin: ALLOWED_ORIGINS }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// helper: make absolute URL
function toAbsolute(url: string | null, base: string): string | null {
  if (!url) return null;
  try {
    return new URL(url, base).toString();
  } catch {
    return null;
  }
}

// helper: is private/loopback IP (basic SSRF protection)
function isPrivateUrl(urlStr: string): boolean {
  try {
    const { hostname } = new URL(urlStr);
    return /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(hostname);
  } catch {
    return true;
  }
}

app.post('/resolve', async (req, res) => {
  const { source_page } = req.body as { source_page?: string };

  if (!source_page || typeof source_page !== 'string') {
    res.status(400).json({ error: 'source_page is required' });
    return;
  }

  // validate URL
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(source_page);
  } catch {
    res.status(400).json({ error: 'invalid_url' });
    return;
  }

  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    res.status(400).json({ error: 'invalid_url' });
    return;
  }

  // SSRF protection
  if (isPrivateUrl(source_page)) {
    res.status(400).json({ error: 'forbidden_url' });
    return;
  }

  const html = await fetchHtml(source_page);
  if (!html) {
    res.status(404).json({ error: 'not_found' });
    return;
  }

  const strategies = [
    () => resolveS2(html),                        // og:image first (most reliable)
    () => resolveS1(html, source_page),            // largest img
    () => resolveS3(html),                         // data-src
    () => resolveS4(html),                         // __NEXT_DATA__
    () => resolveS5(html),                         // Playwright (disabled)
  ];

  for (const strategy of strategies) {
    const raw = strategy();
    const url = toAbsolute(raw, source_page);
    if (url) {
      res.json({ url });
      return;
    }
  }

  res.status(404).json({ error: 'not_found' });
});

app.listen(PORT, () => {
  console.log(`api-resolve listening on port ${PORT}`);
});

export default app;
