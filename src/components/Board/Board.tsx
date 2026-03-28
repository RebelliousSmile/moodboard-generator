import { forwardRef } from 'react';
import { Card } from './Card';
import type { MoodboardData, BoardSettings } from '../../types';
import './Board.css';

interface BoardProps {
  data: MoodboardData;
  settings: BoardSettings;
}

export const Board = forwardRef<HTMLDivElement, BoardProps>(({ data, settings }, ref) => {
  const cssVars = {
    '--board-columns': settings.columns,
    '--board-gap': `${settings.gap}px`,
    '--card-radius': `${settings.borderRadius}px`,
    '--img-brightness': settings.brightness,
    '--img-contrast': settings.contrast,
    '--img-saturation': settings.saturation,
    '--ann-opacity': settings.annotationOpacity,
    '--tag-color': settings.tagColor,
    background: settings.bgColor,
  } as React.CSSProperties;

  return (
    <div ref={ref} className="mb-wrap" style={cssVars}>
      <div className="mb-header">
        <h1>{data.scenario}</h1>
        {data.contexte && (
          <p>{data.contexte.split('·').join(' · ')}</p>
        )}
      </div>

      <div className="board">
        {data.images.map((img, i) => (
          <Card key={`${img.url}-${i}`} image={img} index={i} />
        ))}
      </div>
    </div>
  );
});
