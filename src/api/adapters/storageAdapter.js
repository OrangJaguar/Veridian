/**
 * Provider-neutral media storage adapter.
 * Prefers Base44 Core.UploadFile when available; otherwise stores validated https URLs.
 */
import { invokeBackendFunction } from '@/api/adapters/functionAdapter';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

export function validateImageFile(file) {
  if (!file) return { ok: false, error: 'No file selected' };
  if (!ALLOWED_MIME.has(file.type)) {
    return { ok: false, error: 'Images must be JPEG, PNG, WebP, or GIF' };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { ok: false, error: 'Images must be 5 MB or smaller' };
  }
  return { ok: true };
}

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Upload or register an image asset via the admin blog asset function.
 */
export async function uploadBlogImage({
  file,
  altText = '',
  caption = '',
  width = null,
  height = null,
} = {}) {
  const check = validateImageFile(file);
  if (!check.ok) throw new Error(check.error);

  const dataUrl = await readAsDataUrl(file);
  return invokeBackendFunction('adminBlogAsset', {
    action: 'create',
    mimeType: file.type,
    sizeBytes: file.size,
    fileName: file.name,
    altText,
    caption,
    width,
    height,
    dataUrl,
  });
}

export async function listBlogAssets() {
  return invokeBackendFunction('adminBlogAsset', { action: 'list' });
}

export async function updateBlogAsset(assetId, patch) {
  return invokeBackendFunction('adminBlogAsset', {
    action: 'update',
    assetId,
    ...patch,
  });
}

export async function deleteBlogAsset(assetId) {
  return invokeBackendFunction('adminBlogAsset', {
    action: 'delete',
    assetId,
  });
}

export { MAX_IMAGE_BYTES, ALLOWED_MIME };
