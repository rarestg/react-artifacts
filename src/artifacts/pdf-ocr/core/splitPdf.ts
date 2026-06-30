import { PDFDocument } from 'pdf-lib';

const LOAD_OPTS = { updateMetadata: false, ignoreEncryption: true } as const;

const ENCRYPTED_PDF_MESSAGE =
  'This PDF is protected (password- or permission-encrypted), which the in-browser reader can’t open. ' +
  'Re-save an unprotected copy: open it and choose Print → Save as PDF (or in macOS Preview, File → Export without encryption), then upload that copy.';

const MALFORMED_PDF_MESSAGE =
  'This PDF couldn’t be read; it may be damaged or use an unusual structure. ' +
  'Try re-saving it (Print → Save as PDF) and uploading again.';

/** Load a PDF once; reuse it to extract pages lazily (bounds memory). */
export async function loadPdf(pdfBytes: Uint8Array): Promise<PDFDocument> {
  // pdf-lib can't decrypt and is a strict parser, so its raw failures (e.g.
  // "Expected instance of PDFDict, but got undefined") are meaningless to users.
  let doc: PDFDocument;
  try {
    doc = await PDFDocument.load(pdfBytes, LOAD_OPTS);
  } catch {
    // Encrypted docs sometimes fail outright; otherwise it's a malformed/unsupported file.
    throw new Error(looksEncrypted(pdfBytes) ? ENCRYPTED_PDF_MESSAGE : MALFORMED_PDF_MESSAGE);
  }
  // ignoreEncryption lets an encrypted doc load, but its content is undecipherable —
  // fail early with a clear reason instead of a cryptic error in getPageCount/copyPages.
  if (doc.isEncrypted) throw new Error(ENCRYPTED_PDF_MESSAGE);
  return doc;
}

/** Heuristic fallback (when load throws outright): an /Encrypt entry marks a protected doc. */
function looksEncrypted(pdfBytes: Uint8Array): boolean {
  const needle = [0x2f, 0x45, 0x6e, 0x63, 0x72, 0x79, 0x70, 0x74]; // "/Encrypt"
  outer: for (let i = pdfBytes.length - needle.length; i >= 0; i--) {
    for (let j = 0; j < needle.length; j++) {
      if (pdfBytes[i + j] !== needle[j]) continue outer;
    }
    return true;
  }
  return false;
}

/** Number of pages in a PDF, without splitting it. */
export async function getPageCount(pdfBytes: Uint8Array): Promise<number> {
  const doc = await loadPdf(pdfBytes);
  return doc.getPageCount();
}

/**
 * Validate a 1-based inclusive page window. Mirrors the Python reference's
 * resolve_page_window: rejects out-of-bounds ranges rather than silently clamping.
 */
export function validatePageRange(total: number, startPage: number, endPage: number): void {
  if (total < 1) throw new Error('The PDF has no pages.');
  if (!Number.isInteger(startPage) || startPage < 1) {
    throw new Error(`startPage must be an integer ≥ 1 (got ${startPage}).`);
  }
  if (!Number.isInteger(endPage) || endPage < startPage) {
    throw new Error(`endPage must be an integer ≥ startPage (got ${startPage}–${endPage}).`);
  }
  if (endPage > total) {
    throw new Error(`endPage ${endPage} exceeds the document's ${total} page(s).`);
  }
}

/**
 * Parse a free-text page spec ("14, 15, 19-22, 32") against a known page count, also reporting which
 * tokens were dropped. Lenient: splits on commas and/or whitespace; supports inclusive ranges ("a-b",
 * reversed ranges swapped); clamps every page to 1..maxPage. `pages` is deduped and sorted ascending.
 * Any raw token that contributed ZERO pages — unparseable junk, an out-of-range single, or a range that
 * lands fully outside 1..maxPage — is collected into `ignored` (a partially-in-range range still
 * contributes, so it is NOT ignored). Parse against the DOCUMENT's page count so any real page can be
 * requested after a subset run.
 */
export function parsePageSpecDetailed(input: string, maxPage: number): { pages: number[]; ignored: string[] } {
  const pages = new Set<number>();
  const ignored: string[] = [];
  for (const raw of input.split(/[\s,]+/).filter(Boolean)) {
    const range = /^(\d+)\s*[-–]\s*(\d+)$/.exec(raw);
    if (range) {
      let a = Number(range[1]);
      let b = Number(range[2]);
      if (a > b) [a, b] = [b, a];
      let added = false;
      for (let p = Math.max(1, a); p <= Math.min(maxPage, b); p++) {
        pages.add(p);
        added = true;
      }
      if (!added) ignored.push(raw);
    } else if (/^\d+$/.test(raw)) {
      const p = Number(raw);
      if (p >= 1 && p <= maxPage) pages.add(p);
      else ignored.push(raw);
    } else {
      ignored.push(raw);
    }
  }
  return { pages: [...pages].sort((x, y) => x - y), ignored };
}

/**
 * Parse a free-text page spec to a concrete 1-based page list (deduped, sorted ascending). Thin wrapper
 * over {@link parsePageSpecDetailed} that drops the ignored-token report — leniency is unchanged.
 */
export function parsePageSpec(input: string, maxPage: number): number[] {
  return parsePageSpecDetailed(input, maxPage).pages;
}

/** Extract a single page (1-based) into a standalone single-page PDF. */
export async function extractPage(source: PDFDocument, pageNumber: number): Promise<Uint8Array> {
  const out = await PDFDocument.create();
  const [copied] = await out.copyPages(source, [pageNumber - 1]);
  out.addPage(copied);
  return out.save();
}
