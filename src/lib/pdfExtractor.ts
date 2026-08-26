/**
 * Client-side and server-side PDF text extraction utility
 * Extracts raw textual streams, transactions, and tables from PDFs in milliseconds
 */

export async function extractTextFromPdf(data: ArrayBuffer | Uint8Array): Promise<string> {
  try {
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
    
    // Disable worker for reliable standalone execution in Next.js / browser
    if (pdfjsLib.GlobalWorkerOptions) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = '';
    }

    const uint8 = data instanceof Uint8Array ? data : new Uint8Array(data);
    const loadingTask = pdfjsLib.getDocument({
      data: uint8,
      useSystemFonts: true,
      stopAtErrors: false
    });

    const pdf = await loadingTask.promise;
    const numPages = pdf.numPages;
    const textPieces: string[] = [];

    for (let i = 1; i <= numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      
      let lastY: number | null = null;
      let pageText = '';

      for (const item of textContent.items as any[]) {
        if ('str' in item) {
          const currentY = item.transform ? item.transform[5] : null;
          if (lastY !== null && currentY !== null && Math.abs(currentY - lastY) > 5) {
            pageText += '\n';
          } else if (pageText.length > 0 && !pageText.endsWith('\n') && !pageText.endsWith(' ')) {
            pageText += ' ';
          }
          pageText += item.str;
          lastY = currentY;
        }
      }

      textPieces.push(`--- Page ${i} ---\n` + pageText.trim());
    }

    return textPieces.join('\n\n');
  } catch (err) {
    console.warn('[PDF_EXTRACTOR] Failed to extract text via pdfjs:', err);
    return '';
  }
}

export async function extractTextFromPdfBase64(base64: string): Promise<string> {
  try {
    const cleanBase64 = base64.replace(/^data:application\/pdf;base64,/, '').replace(/^data:.*?;base64,/, '');
    const binaryString = atob(cleanBase64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return await extractTextFromPdf(bytes);
  } catch (e) {
    console.warn('[PDF_EXTRACTOR] Failed to decode base64 PDF:', e);
    return '';
  }
}
