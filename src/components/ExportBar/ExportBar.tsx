import { useState } from 'react';
import { exportPdf, type PdfFormat } from '../../utils/exportPdf';
import { copyPermalink } from '../../utils/permalink';
import './ExportBar.css';

interface ExportBarProps {
  boardRef: React.RefObject<HTMLDivElement | null>;
  filename: string;
  onBack: () => void;
  onToggleSettings: () => void;
}

const FORMAT_PRINT_SIZE: Record<PdfFormat, string> = {
  'a4-portrait':  'A4 portrait',
  'a4-landscape': 'A4 landscape',
  'a3-portrait':  'A3 portrait',
};

export function ExportBar({ boardRef, filename, onBack, onToggleSettings }: ExportBarProps) {
  const [format, setFormat] = useState<PdfFormat>('a4-portrait');
  const [exporting, setExporting] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleExport = async () => {
    if (!boardRef.current || exporting) return;
    setExporting(true);
    try {
      await exportPdf(boardRef.current, filename, format);
    } catch (e) {
      console.error('Export PDF error:', e);
    } finally {
      setExporting(false);
    }
  };

  const handlePrint = () => {
    const style = document.createElement('style');
    style.setAttribute('data-print-size', '');
    style.textContent = `@media print { @page { size: ${FORMAT_PRINT_SIZE[format]}; margin: 10mm; } }`;
    document.head.appendChild(style);

    const cleanup = () => {
      document.head.removeChild(style);
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    window.print();
  };

  const handleShare = async () => {
    const ok = await copyPermalink();
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="export-bar">
      <div className="export-left">
        <button onClick={onBack}>← Modifier</button>
        <button onClick={onToggleSettings}>⚙ Personnaliser</button>
      </div>
      <div className="export-right">
        <button onClick={handleShare}>
          {copied ? '✓ Lien copié' : '⧉ Partager'}
        </button>
        <select
          value={format}
          onChange={e => setFormat(e.target.value as PdfFormat)}
          className="format-select"
        >
          <option value="a4-portrait">A4 Portrait</option>
          <option value="a4-landscape">A4 Paysage</option>
          <option value="a3-portrait">A3 Portrait</option>
        </select>
        <button onClick={handleExport} disabled={exporting}>
          {exporting ? 'Export...' : 'Exporter PDF'}
        </button>
        <button onClick={handlePrint}>Imprimer</button>
      </div>
    </div>
  );
}
