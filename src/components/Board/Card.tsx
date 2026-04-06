import { useState } from 'react';
import { detectPosition } from '../../utils/detectPosition';
import { getCachedImageUrl } from '../../utils/imageCache';
import type { ImageEntry } from '../../types';

const FALLBACKS = [
  '#2C2018', '#3A4830', '#3A2818', '#1A3020', '#2A3820',
  '#1A2838', '#1A3040', '#4A4030', '#304048', '#183028',
  '#3A2818', '#2C3828',
];

interface CardProps {
  image: ImageEntry;
  index: number;
  gapStyle?: React.CSSProperties;
}

export function Card({ image, index, gapStyle }: CardProps) {
  const [imgError, setImgError] = useState(false);
  const taille = image.taille || 'half';
  const pos = detectPosition(image.url, image.tags);
  const loc = [image.lieu, image.date].filter(Boolean).join(' · ');
  const fb = FALLBACKS[index % FALLBACKS.length];
  const hasUrl = image.url && typeof image.url === 'string';
  const cachedUrl = hasUrl ? getCachedImageUrl(image.url!) : null;
  const pending = !hasUrl;

  return (
    <div className={`card ${taille}${pending ? ' pending' : ''}`} style={{ background: fb, ...gapStyle }}>
      {cachedUrl && !imgError && (
        <img
          src={cachedUrl}
          alt={image.lieu || ''}
          style={{ objectPosition: pos }}
          onError={() => setImgError(true)}
        />
      )}

      {pending && (
        <div className="pending-label">
          {image.api ? `api: ${image.api}` : image.source_page ? 'source_page' : '~'}
        </div>
      )}

      {cachedUrl && (
        <a
          className="dl"
          href={cachedUrl}
          target="_blank"
          rel="noopener noreferrer"
          title="Ouvrir l'image"
        >
          ↗
        </a>
      )}

      <div className="ann">
        {loc && <span className="loc">{loc}</span>}
        {image.tags && image.tags.length > 0 && (
          <div className="tags">
            {image.tags.map(tag => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
