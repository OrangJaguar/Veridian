export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_IMAGE_FILES = 5;

const NATIVE_OCR_TYPES = new Set([
  'image/png', 'image/jpeg', 'image/webp', 'image/bmp', 'image/gif',
]);

const HEIC_EXTENSIONS = new Set(['.heic', '.heif']);

function getExtension(name) {
  const dot = name.lastIndexOf('.');
  return dot >= 0 ? name.slice(dot).toLowerCase() : '';
}

function isHeic(file) {
  const ext = getExtension(file.name);
  return HEIC_EXTENSIONS.has(ext) || file.type === 'image/heic' || file.type === 'image/heif';
}

function canvasConvert(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url);
          if (!blob) {
            reject(new Error(`Could not convert ${file.name}. Try converting to JPEG first.`));
            return;
          }
          resolve(blob);
        },
        'image/jpeg',
        0.92,
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Could not process ${file.name}. The format may not be supported by your browser.`));
    };
    img.src = url;
  });
}

/**
 * Ensure an image File is in a format Tesseract.js can process.
 * Returns { blob, mimeType, originalName }.
 */
export async function convertImageForOcr(file) {
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error(`${file.name} exceeds the 10MB image size limit.`);
  }

  if (NATIVE_OCR_TYPES.has(file.type)) {
    return { blob: file, mimeType: file.type, originalName: file.name };
  }

  if (isHeic(file)) {
    try {
      const { default: heic2any } = await import('heic2any');
      const converted = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.92 });
      const blob = Array.isArray(converted) ? converted[0] : converted;
      return { blob, mimeType: 'image/jpeg', originalName: file.name };
    } catch {
      throw new Error(
        `Could not process ${file.name}. Try converting this HEIC image to JPEG first.`,
      );
    }
  }

  // AVIF, TIFF, and anything else the browser can decode via <img>
  const blob = await canvasConvert(file);
  return { blob, mimeType: 'image/jpeg', originalName: file.name };
}
