import { useState, useCallback } from 'react';
import { getCachedImageUrl } from '../../utils/imageCache';
import type { MoodboardData } from '../../types';
import './ReviewPanel.css';

interface ReviewPanelProps {
  data: MoodboardData;
}

interface ImageReview {
  checked: boolean;
  comment: string;
}

export function ReviewPanel({ data }: ReviewPanelProps) {
  const [open, setOpen] = useState(false);
  const [reviews, setReviews] = useState<ImageReview[]>(
    () => data.images.map(() => ({ checked: false, comment: '' }))
  );
  const [copied, setCopied] = useState(false);

  const toggle = useCallback((i: number) => {
    setReviews(prev => prev.map((r, j) =>
      j === i ? { ...r, checked: !r.checked } : r
    ));
  }, []);

  const setComment = useCallback((i: number, comment: string) => {
    setReviews(prev => prev.map((r, j) =>
      j === i ? { ...r, comment } : r
    ));
  }, []);

  const checkedCount = reviews.filter(r => r.checked).length;

  const buildPrompt = useCallback(() => {
    const lines: string[] = [
      `Moodboard "${data.scenario}" — corrections demandees`,
      '',
    ];
    if (data.contexte) lines.push(`Contexte : ${data.contexte}`, '');

    lines.push(`${checkedCount} image(s) a corriger :`);
    lines.push('');

    data.images.forEach((img, i) => {
      const r = reviews[i];
      if (!r.checked) return;
      const label = img.lieu || img.url;
      lines.push(`- Image ${i + 1} : ${label}`);
      if (img.tags?.length) lines.push(`  Tags : ${img.tags.join(', ')}`);
      if (r.comment) lines.push(`  Commentaire : ${r.comment}`);
      lines.push('');
    });

    lines.push('Remplace ces images et redonne-moi le fichier complet du moodboard avec les corrections integrees (toutes les images, pas seulement celles modifiees).');
    return lines.join('\n');
  }, [data, reviews, checkedCount]);

  const handleCopy = useCallback(async () => {
    const text = buildPrompt();
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [buildPrompt]);

  if (!open) {
    return (
      <div className="review-toggle-wrap">
        <button className="review-toggle" onClick={() => setOpen(true)}>
          Corriger les images
        </button>
      </div>
    );
  }

  return (
    <div className="review-panel">
      <div className="review-header">
        <h2>Corrections</h2>
        <button className="review-close" onClick={() => setOpen(false)}>Fermer</button>
      </div>
      <p className="review-hint">
        Cochez les images a remplacer et ajoutez un commentaire pour guider l'IA.
      </p>

      <div className="review-list">
        {data.images.map((img, i) => (
          <div key={img.url} className={`review-item${reviews[i].checked ? ' selected' : ''}`}>
            <label className="review-check">
              <input
                type="checkbox"
                checked={reviews[i].checked}
                onChange={() => toggle(i)}
              />
              <img
                src={getCachedImageUrl(img.url)}
                alt={img.lieu || ''}
                className="review-thumb"
              />
              <span className="review-label">
                <strong>{img.lieu || `Image ${i + 1}`}</strong>
                {img.tags && <span className="review-tags">{img.tags.map(t => `#${t}`).join(' ')}</span>}
              </span>
            </label>
            {reviews[i].checked && (
              <input
                type="text"
                className="review-comment"
                value={reviews[i].comment}
                onChange={e => setComment(i, e.target.value)}
                placeholder="Pourquoi remplacer ? (optionnel)"
              />
            )}
          </div>
        ))}
      </div>

      {checkedCount > 0 && (
        <div className="review-actions">
          <button className="primary" onClick={handleCopy}>
            {copied ? 'Copie !' : `Copier le prompt (${checkedCount} image${checkedCount > 1 ? 's' : ''})`}
          </button>
        </div>
      )}
    </div>
  );
}
