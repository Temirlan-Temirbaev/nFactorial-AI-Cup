import { PDFDocument, PDFPage } from 'pdf-lib';

export async function extractPages(pdfBytes: Uint8Array, start: number, end: number): Promise<Uint8Array> {
  const originalPdf: PDFDocument = await PDFDocument.load(pdfBytes);
  const newPdf: PDFDocument = await PDFDocument.create();

  const pagesToCopy: number[] = Array.from({ length: end - start + 1 }, (_, i) => start - 1 + i);
  const copiedPages: PDFPage[] = await newPdf.copyPages(originalPdf, pagesToCopy);

  copiedPages.forEach((page) => newPdf.addPage(page));
  const newPdfBytes: Uint8Array = await newPdf.save();

  return newPdfBytes;
}