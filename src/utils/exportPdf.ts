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

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: null,
  });

  const imgData = canvas.toDataURL('image/jpeg', 0.92);
  const pdf = new jsPDF(dims.orient, 'mm', dims.format);

  const pageW = dims.w;
  const pageH = dims.h;
  const margin = 8;
  const contentW = pageW - margin * 2;

  const imgRatio = canvas.height / canvas.width;
  const contentH = contentW * imgRatio;

  if (contentH <= pageH - margin * 2) {
    pdf.addImage(imgData, 'JPEG', margin, margin, contentW, contentH);
  } else {
    // Scale to fit page height
    const fitH = pageH - margin * 2;
    const fitW = fitH / imgRatio;
    const offsetX = (pageW - fitW) / 2;
    pdf.addImage(imgData, 'JPEG', offsetX, margin, fitW, fitH);
  }

  pdf.save(filename);
}
