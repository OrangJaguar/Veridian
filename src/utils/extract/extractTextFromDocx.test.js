import { describe, it, expect, vi } from 'vitest';

vi.mock('mammoth', () => ({
  default: {
    extractRawText: vi.fn(),
  },
}));

import { extractTextFromDocx, MAX_DOCX_BYTES } from './extractTextFromDocx';
import mammoth from 'mammoth';

function mockFile(name, size, type = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
  const content = new Uint8Array(Math.min(size, 100));
  const file = new File([content], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
}

describe('extractTextFromDocx', () => {
  it('rejects files exceeding size limit', async () => {
    const file = mockFile('big.docx', MAX_DOCX_BYTES + 1);
    await expect(extractTextFromDocx(file)).rejects.toThrow('exceeds 20MB');
  });

  it('extracts text from a valid DOCX', async () => {
    mammoth.extractRawText.mockResolvedValue({
      value: '  Hello world.  This is   a test document.  ',
    });

    const file = mockFile('notes.docx', 1024);
    const text = await extractTextFromDocx(file);
    expect(text).toBe('Hello world. This is a test document.');
    expect(mammoth.extractRawText).toHaveBeenCalled();
  });

  it('throws when DOCX contains no readable text', async () => {
    mammoth.extractRawText.mockResolvedValue({ value: '' });

    const file = mockFile('empty.docx', 1024);
    await expect(extractTextFromDocx(file)).rejects.toThrow("doesn't appear to contain readable text");
  });
});
