import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export type PdfFormat = 'a4-portrait' | 'a4-landscape' | 'a3-portrait';

const FORMAT_DIMS: Record<PdfFormat, { w: number; h: number; orient: 'p' | 'l'; format: string }> = {
  'a4-portrait':  { w: 210, h: 297, orient: 'p', format: 'a4' },
  'a4-landscape': { w: 297, h: 210, orient: 'l', format: 'a4' },
  'a3-portrait':  { w: 297, h: 420, orient: 'p', format: 'a3' },
};

export async function exportPdf(
  element: HTMLElement,
  filename: string,
  format: PdfFormat = 'a4-portrait',
): Promise<void> {
  const dims = FORMAT_DIMS[format];
  const margin = 8;
  const contentW = dims.w - margin * 2;
  const contentH = dims.h - margin * 2;

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: null,
  });

  const pdf = new jsPDF(dims.orient, 'mm', dims.format);

  // Largeur réelle de l'image en mm, calée sur la largeur de page
  const imgWidthMm = contentW;
  const pxPerMm = canvas.width / imgWidthMm;
  const pageHeightPx = contentH * pxPerMm;

  const totalPages = Math.ceil(canvas.height / pageHeightPx);

  for (let page = 0; page < totalPages; page++) {
    if (page > 0) pdf.addPage();

    const srcY = page * pageHeightPx;
    const sliceH = Math.min(pageHeightPx, canvas.height - srcY);

    // Découper une tranche du canvas pour cette page
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
