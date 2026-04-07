import { useState } from 'react';
import { detectPosition } from '../../utils/detectPosition';
import { getCachedImageUrl } from '../../utils/imageCache';
import { type ImageEntry, getResolutionStrategy } from '../../types';

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
  const strategy = getResolutionStrategy(image);

  const pendingClass = strategy === 'pending_scrape' ? 'pending pending-scrape' : strategy === 'pending_api' ? 'pending pending-api' : '';
  const pendingTitle = strategy === 'pending_scrape' ? `En attente : ${image.source_page}` : strategy === 'pending_api' ? `En attente : api ${image.api}` : undefined;
  const pendingLabel = strategy === 'pending_scrape' ? (image.source_page || '~') : strategy === 'pending_api' ? `api: ${image.api}` : null;

  return (
    <div className={`card ${taille}${pendingClass ? ` ${pendingClass}` : ''}`} style={{ background: fb, ...gapStyle }} title={pendingTitle}>
      {cachedUrl && !imgError && (
        <img
          src={cachedUrl}
          alt={image.lieu || ''}
          style={{ objectPosition: pos }}
          onError={() => setImgError(true)}
        />
      )}

      {strategy !== 'resolved' && (
        <div className="pending-label">
          {pendingLabel}
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
