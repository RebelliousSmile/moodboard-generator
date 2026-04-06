import { forwardRef } from 'react';
import { Card } from './Card';
import type { MoodboardData, BoardSettings } from '../../types';
import './Board.css';

interface BoardProps {
  data: MoodboardData;
  settings: BoardSettings;
}

export const Board = forwardRef<HTMLDivElement, BoardProps>(({ data, settings }, ref) => {
  const wrapStyle = {
    '--board-gap': `${settings.gap}px`,
    '--card-radius': `${settings.borderRadius}px`,
    '--img-brightness': settings.brightness,
    '--img-contrast': settings.contrast,
    '--img-saturation': settings.saturation,
    '--ann-opacity': settings.annotationOpacity,
    '--tag-color': settings.tagColor,
    background: settings.bgColor,
  } as React.CSSProperties;

  const boardStyle: React.CSSProperties = {
    columnCount: settings.columns,
    columnGap: `${settings.gap}px`,
  };

  const cardGap: React.CSSProperties = {
    marginBottom: `${settings.gap}px`,
  };

  return (
    <div ref={ref} className="mb-wrap" style={wrapStyle}>
      <div className="mb-header">
        <h1>{data.scenario}</h1>
        {data.contexte && (
          <p>{data.contexte.split('·').join(' · ')}</p>
        )}
      </div>

      <div className="board" style={boardStyle}>
        {data.images.map((img, i) => (
          <Card key={img.id ?? img.url ?? i} image={img} index={i} gapStyle={cardGap} />
        ))}
      </div>
    </div>
  );
});
