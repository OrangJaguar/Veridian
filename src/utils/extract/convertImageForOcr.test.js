import { describe, it, expect } from 'vitest';
import { convertImageForOcr, MAX_IMAGE_BYTES } from './convertImageForOcr';

function mockFile(name, type, size = 1024) {
  const content = new Uint8Array(Math.min(size, 100));
  const file = new File([content], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
}

describe('convertImageForOcr', () => {
  it('rejects images exceeding 10MB', async () => {
    const file = mockFile('huge.png', 'image/png', MAX_IMAGE_BYTES + 1);
    await expect(convertImageForOcr(file)).rejects.toThrow('exceeds the 10MB');
  });

  it('passes PNG through without conversion', async () => {
    const file = mockFile('notes.png', 'image/png', 500);
    const result = await convertImageForOcr(file);
    expect(result.blob).toBe(file);
    expect(result.mimeType).toBe('image/png');
    expect(result.originalName).toBe('notes.png');
  });

  it('passes JPEG through without conversion', async () => {
    const file = mockFile('photo.jpg', 'image/jpeg', 500);
    const result = await convertImageForOcr(file);
    expect(result.blob).toBe(file);
    expect(result.mimeType).toBe('image/jpeg');
  });

  it('passes WebP through without conversion', async () => {
    const file = mockFile('screen.webp', 'image/webp', 500);
    const result = await convertImageForOcr(file);
    expect(result.blob).toBe(file);
    expect(result.mimeType).toBe('image/webp');
  });

  it('passes BMP through without conversion', async () => {
    const file = mockFile('old.bmp', 'image/bmp', 500);
    const result = await convertImageForOcr(file);
    expect(result.blob).toBe(file);
    expect(result.mimeType).toBe('image/bmp');
  });

  it('passes GIF through without conversion', async () => {
    const file = mockFile('anim.gif', 'image/gif', 500);
    const result = await convertImageForOcr(file);
    expect(result.blob).toBe(file);
    expect(result.mimeType).toBe('image/gif');
  });

  it('identifies HEIC by extension and attempts conversion', async () => {
    const file = mockFile('photo.heic', '', 500);
    await expect(convertImageForOcr(file)).rejects.toThrow();
  });

  it('identifies HEIF by extension', async () => {
    const file = mockFile('photo.heif', '', 500);
    await expect(convertImageForOcr(file)).rejects.toThrow();
  });
});
