import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Lecture manuelle de .env.local (pas de dépendance dotenv)
function loadEnv() {
  const envPath = resolve(__dirname, '..', '.env.local');
  const vars = {};
  try {
    for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq > 0) vars[trimmed.slice(0, eq)] = trimmed.slice(eq + 1);
    }
  } catch { /* pas de .env.local */ }
  return vars;
}

const env = loadEnv();
const BASE = env.VITE_IMGCACHE_BASE_URL || 'https://imagesforaday.scriptami.com';
const TOKEN = env.IMGCACHE_ADMIN_TOKEN;

if (!TOKEN) {
  console.error('IMGCACHE_ADMIN_TOKEN manquant dans .env.local');
  process.exit(1);
}

// Extraction des URLs depuis un fichier JSON ou une liste d'URLs en arguments
function getUrls() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('Usage: node scripts/precache.mjs <fichier.json> | <url1> <url2> ...');
    process.exit(1);
  }

  // Si le premier argument ressemble à un fichier
  if (args.length === 1 && !args[0].startsWith('http')) {
    const raw = readFileSync(resolve(args[0]), 'utf-8');
    // Essayer JSON d'abord, sinon extraire les URLs https par regex
    try {
      const data = JSON.parse(raw);
      const images = data.images || data;
      return images.map(img => typeof img === 'string' ? img : img.url);
    } catch {
      const urls = [...raw.matchAll(/https?:\/\/[^\s"'`,]+/g)].map(m => m[0]);
      if (urls.length === 0) {
        console.error('Aucune URL trouvée dans le fichier.');
        process.exit(1);
      }
      return urls;
    }
  }

  return args;
}

async function precache(url) {
  const cacheUrl = `${BASE}/cache?url=${encodeURIComponent(url)}`;
  try {
    const res = await fetch(cacheUrl, {
      headers: { Authorization: `Bearer ${TOKEN}` },
    });
    const hit = res.headers.get('x-cache') || '';
    if (res.ok) {
      console.log(`✓ ${hit.padEnd(4)} ${url}`);
    } else {
      console.log(`✗ ${res.status} ${url}`);
    }
  } catch (err) {
    console.log(`✗ ERR  ${url} — ${err.message}`);
  }
}

const urls = getUrls();
console.log(`Pré-cache de ${urls.length} image(s)...\n`);

for (const url of urls) {
  await precache(url);
}

console.log('\nTerminé.');
