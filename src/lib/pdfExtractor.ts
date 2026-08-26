/**
 * Client-side and server-side PDF text extraction utility
 * Extracts raw textual streams, transactions, and tables from PDFs in milliseconds
 */

export async function extractTextFromPdf(data: ArrayBuffer | Uint8Array): Promise<string> {
  const uint8 = data instanceof Uint8Array ? data : new Uint8Array(data);

  // Method 1: Try pdfjs-dist
  try {
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
    
    // Set standard cdn worker if in browser
    if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.10.38'}/pdf.worker.min.mjs`;
    }

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

      if (pageText.trim()) {
        textPieces.push(`--- Page ${i} ---\n` + pageText.trim());
      }
    }

    if (textPieces.length > 0 && textPieces.join('\n').trim().length > 20) {
      return textPieces.join('\n\n');
    }
  } catch (err) {
    console.warn('[PDF_EXTRACTOR] pdfjs method note:', err);
  }

  // Method 2: Direct ASCII/Unicode stream scanner fallback
  try {
    const decoder = new TextDecoder('latin1');
    const rawPdf = decoder.decode(uint8);
    const textMatches: string[] = [];
    
    // Match strings in Tj / TJ / () operators
    const tjRegex = /\(([^()]{2,150})\)\s*Tj/g;
    let match;
    while ((match = tjRegex.exec(rawPdf)) !== null) {
      const cleaned = match[1].replace(/\\([()\\])/g, '$1').trim();
      if (cleaned && cleaned.length > 1 && !cleaned.startsWith('/') && !cleaned.startsWith('%')) {
        textMatches.push(cleaned);
      }
    }

    if (textMatches.length > 5) {
      return textMatches.join(' ');
    }
  } catch (rawErr) {
    console.warn('[PDF_EXTRACTOR] Raw stream extraction note:', rawErr);
  }

  return '';
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
