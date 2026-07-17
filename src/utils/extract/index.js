export {
  extractTextFromPdf,
  extractTextFromPdfFiles,
  extractTextFromTxt,
  MAX_PDF_BYTES,
  MAX_PDF_FILES,
  MIN_EXTRACTED_CHARS,
} from '@/utils/pdf/extractTextFromPdf';

export { extractTextFromDocx } from './extractTextFromDocx';
export { extractTextFromPptx } from './extractTextFromPptx';
export { extractTextFromImages } from './extractTextFromImages';
export { convertImageForOcr, MAX_IMAGE_BYTES, MAX_IMAGE_FILES } from './convertImageForOcr';
export { fetchLinkContent } from './fetchLinkContent';
export { isValidUrl, isYouTubeUrl, extractYouTubeVideoId } from './validateUrl';

const IMAGE_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.webp', '.bmp', '.gif',
  '.heic', '.heif', '.tiff', '.tif', '.avif',
]);

function getExtension(name) {
  const dot = name.lastIndexOf('.');
  return dot >= 0 ? name.slice(dot).toLowerCase() : '';
}

/**
 * Route a File to the correct text extractor by MIME type / extension.
 * @param {File} file
 * @returns {Promise<string>}
 */
export async function extractTextFromFile(file) {
  const ext = getExtension(file.name);

  if (file.type === 'application/pdf' || ext === '.pdf') {
    const { extractTextFromPdf: extract } = await import('@/utils/pdf/extractTextFromPdf');
    return extract(file);
  }

  if (file.type === 'text/plain' || ext === '.txt') {
    const { extractTextFromTxt: extract } = await import('@/utils/pdf/extractTextFromPdf');
    return extract(file);
  }

  if (
    file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    || ext === '.docx'
  ) {
    const { extractTextFromDocx: extract } = await import('./extractTextFromDocx');
    return extract(file);
  }

  if (
    file.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    || ext === '.pptx'
  ) {
    const { extractTextFromPptx: extract } = await import('./extractTextFromPptx');
    return extract(file);
  }

  if (IMAGE_EXTENSIONS.has(ext)) {
    throw new Error(
      `${file.name} is an image file. Use the Image tab to extract text from images via OCR.`,
    );
  }

  throw new Error(`Unsupported file type: ${file.name}. Supported formats: PDF, DOCX, PPTX, TXT.`);
}
