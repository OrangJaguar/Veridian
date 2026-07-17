import { createWorker } from 'tesseract.js';
import { convertImageForOcr, MAX_IMAGE_FILES } from './convertImageForOcr';

/**
 * Run OCR on an array of image Files.
 * @param {File[]} files
 * @param {(progress: { current: number, total: number, fileProgress: number }) => void} [onProgress]
 * @returns {Promise<string>} combined extracted text
 */
export async function extractTextFromImages(files, onProgress) {
  const list = Array.from(files).slice(0, MAX_IMAGE_FILES);
  if (!list.length) throw new Error('No images provided.');

  const worker = await createWorker('eng', 1, {
    logger: (m) => {
      if (m.status === 'recognizing text' && typeof m.progress === 'number') {
        onProgress?.({ current: currentIndex + 1, total: list.length, fileProgress: m.progress });
      }
    },
  });

  let currentIndex = 0;
  const parts = [];

  try {
    for (let i = 0; i < list.length; i++) {
      currentIndex = i;
      onProgress?.({ current: i + 1, total: list.length, fileProgress: 0 });

      const { blob, originalName } = await convertImageForOcr(list[i]);
      const { data } = await worker.recognize(blob);
      const text = (data.text ?? '').trim();

      if (text) {
        parts.push(`--- Image: ${originalName} ---\n${text}`);
      }
    }
  } finally {
    await worker.terminate();
  }

  return parts.join('\n\n').trim();
}
