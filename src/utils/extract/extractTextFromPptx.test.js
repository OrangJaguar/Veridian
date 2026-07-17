import { describe, it, expect, vi, beforeAll } from 'vitest';

const mockSlide1Xml = `<?xml version="1.0"?>
<p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"
       xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
  <p:cSld><p:spTree>
    <p:sp><p:txBody><a:p><a:r><a:t>Title Slide</a:t></a:r></a:p></p:txBody></p:sp>
    <p:sp><p:txBody><a:p><a:r><a:t>Subtitle here</a:t></a:r></a:p></p:txBody></p:sp>
  </p:spTree></p:cSld>
</p:sld>`;

const mockSlide2Xml = `<?xml version="1.0"?>
<p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"
       xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
  <p:cSld><p:spTree>
    <p:sp><p:txBody><a:p><a:r><a:t>Bullet point one</a:t></a:r></a:p></p:txBody></p:sp>
    <p:sp><p:txBody><a:p><a:r><a:t>Bullet point two</a:t></a:r></a:p></p:txBody></p:sp>
  </p:spTree></p:cSld>
</p:sld>`;

vi.mock('jszip', () => ({
  default: {
    loadAsync: vi.fn(),
  },
}));

// Provide DOMParser for Node test environment using linkedom
beforeAll(async () => {
  if (typeof globalThis.DOMParser === 'undefined') {
    // Minimal DOMParser polyfill using regex extraction
    globalThis.DOMParser = class {
      parseFromString(str) {
        const textContents = [];
        const re = /<a:t[^>]*>([\s\S]*?)<\/a:t>/g;
        let m;
        while ((m = re.exec(str)) !== null) {
          textContents.push(m[1]);
        }
        return {
          getElementsByTagNameNS(_ns, tag) {
            if (tag !== 't') return [];
            return textContents.map((t) => ({ textContent: t }));
          },
        };
      }
    };
  }
});

import { extractTextFromPptx, MAX_PPTX_BYTES } from './extractTextFromPptx';
import JSZip from 'jszip';

function mockFile(name, size) {
  const content = new Uint8Array(Math.min(size, 100));
  const file = new File([content], name, {
    type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  });
  Object.defineProperty(file, 'size', { value: size });
  return file;
}

describe('extractTextFromPptx', () => {
  it('rejects files exceeding size limit', async () => {
    const file = mockFile('big.pptx', MAX_PPTX_BYTES + 1);
    await expect(extractTextFromPptx(file)).rejects.toThrow('exceeds 20MB');
  });

  it('extracts text from slides in order', async () => {
    JSZip.loadAsync.mockResolvedValue({
      files: {
        'ppt/slides/slide1.xml': { async: () => mockSlide1Xml },
        'ppt/slides/slide2.xml': { async: () => mockSlide2Xml },
        'ppt/theme/theme1.xml': { async: () => '' },
      },
    });

    const file = mockFile('lecture.pptx', 2048);
    const text = await extractTextFromPptx(file);

    expect(text).toContain('--- Slide 1 ---');
    expect(text).toContain('Title Slide');
    expect(text).toContain('Subtitle here');
    expect(text).toContain('--- Slide 2 ---');
    expect(text).toContain('Bullet point one');
    expect(text).toContain('Bullet point two');

    const slide1Pos = text.indexOf('Slide 1');
    const slide2Pos = text.indexOf('Slide 2');
    expect(slide1Pos).toBeLessThan(slide2Pos);
  });

  it('throws when PPTX has no slide entries', async () => {
    JSZip.loadAsync.mockResolvedValue({
      files: { 'ppt/theme/theme1.xml': { async: () => '' } },
    });

    const file = mockFile('empty.pptx', 1024);
    await expect(extractTextFromPptx(file)).rejects.toThrow("doesn't appear to be a valid PowerPoint");
  });
});
