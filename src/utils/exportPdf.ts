import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export type PdfFormat = 'a4-portrait' | 'a4-landscape' | 'a3-portrait';

const FORMAT_DIMS: Record<PdfFormat, { w: number; h: number; orient: 'p' | 'l'; format: string }> = {
  'a4-portrait':  { w: 210, h: 297, orient: 'p', format: 'a4' },
  'a4-landscape': { w: 297, h: 210, orient: 'l', format: 'a4' },
  'a3-portrait':  { w: 297, h: 420, orient: 'p', format: 'a3' },
};

/**
 * Tente de fetcher chaque image en CORS et remplace le src par un blob: URL.
 * Les images dont le serveur refuse CORS sont masquées temporairement
 * (sinon elles "taintent" le canvas et toDataURL() echoue pour tout).
 * Retourne une fonction de restauration.
 */
async function prepareImagesForCapture(root: HTMLElement): Promise<() => void> {
  const imgs = Array.from(root.querySelectorAll<HTMLImageElement>('img'));
  const originals: { img: HTMLImageElement; src: string; hidden: boolean }[] = [];

  await Promise.all(
    imgs.map(async (img) => {
      const src = img.src;
      originals.push({ img, src, hidden: false });
      try {
        const res = await fetch(src, { mode: 'cors' });
        if (!res.ok) throw new Error();
        const blob = await res.blob();
        img.src = URL.createObjectURL(blob);
      } catch {
        // Le serveur refuse CORS — on masque l'image pour ne pas tainter le canvas
        originals[originals.length - 1].hidden = true;
        img.style.visibility = 'hidden';
      }
    }),
  );

  return () => {
    for (const entry of originals) {
      if (entry.img.src.startsWith('blob:')) {
        URL.revokeObjectURL(entry.img.src);
      }
      entry.img.src = entry.src;
      if (entry.hidden) {
        entry.img.style.visibility = '';
      }
    }
  };
}

export async function exportPdf(
  element: HTMLElement,
  filename: string,
  format: PdfFormat = 'a4-portrait',
): Promise<void> {
  const dims = FORMAT_DIMS[format];
  const margin = 8;
  const contentW = dims.w - margin * 2;
  const contentH = dims.h - margin * 2;

  const restore = await prepareImagesForCapture(element);

  let canvas: HTMLCanvasElement;
  try {
    canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      backgroundColor: null,
    });
  } finally {
    restore();
  }

  const pdf = new jsPDF(dims.orient, 'mm', dims.format);

  const imgWidthMm = contentW;
  const pxPerMm = canvas.width / imgWidthMm;
  const pageHeightPx = contentH * pxPerMm;

  const totalPages = Math.ceil(canvas.height / pageHeightPx);

  for (let page = 0; page < totalPages; page++) {
    if (page > 0) pdf.addPage();

    const srcY = page * pageHeightPx;
    const sliceH = Math.min(pageHeightPx, canvas.height - srcY);

    const pageCanvas = document.createElement('canvas');
    pageCanvas.width = canvas.width;
    pageCanvas.height = sliceH;
    const ctx = pageCanvas.getContext('2d')!;
    ctx.drawImage(canvas, 0, srcY, canvas.width, sliceH, 0, 0, canvas.width, sliceH);

    const imgData = pageCanvas.toDataURL('image/jpeg', 0.92);
    const sliceHMm = sliceH / pxPerMm;
    pdf.addImage(imgData, 'JPEG', margin, margin, imgWidthMm, sliceHMm);
  }

  pdf.save(filename);
}
