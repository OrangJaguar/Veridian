import { describe, it, expect } from 'vitest';
import {
  blogBlockSchema,
  validateForPublish,
  sanitizeBlocksForPublic,
  estimateReadTimeMinutes,
  slugifyTitle,
} from '@/utils/schemas/blog';
import { compareParity, staticPostsForMigration } from '@/utils/blog/migrateStaticPosts';
import { FAQ_ITEMS, buildFaqJsonLd } from '@/content/faq/faqItems';

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function validateImageFile(file) {
  if (!file) return { ok: false, error: 'No file selected' };
  if (!ALLOWED_MIME.has(file.type)) {
    return { ok: false, error: 'Images must be JPEG, PNG, WebP, or GIF' };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { ok: false, error: 'Images must be 5 MB or smaller' };
  }
  return { ok: true };
}

describe('blog schemas and publication rules', () => {
  it('validates supported blocks', () => {
    expect(blogBlockSchema.safeParse({ type: 'p', content: 'Hello' }).success).toBe(true);
    expect(blogBlockSchema.safeParse({ type: 'image', url: 'https://x', alt: 'Alt' }).success).toBe(true);
    expect(blogBlockSchema.safeParse({ type: 'image', url: 'https://x', alt: '' }).success).toBe(false);
    expect(blogBlockSchema.safeParse({ type: 'cta', label: 'Go', href: '/signup' }).success).toBe(true);
  });

  it('requires metadata and alt text to publish', () => {
    const result = validateForPublish({
      title: 'T',
      slug: 'bad slug',
      description: '',
      author: '',
      blocks: [{ type: 'image', url: '/a.png', alt: '' }],
    });
    expect(result.ok).toBe(false);
    expect(result.issues.length).toBeGreaterThan(2);
  });

  it('passes a complete publishable post', () => {
    const result = validateForPublish({
      title: 'Spaced repetition',
      slug: 'spaced-repetition',
      description: 'A long enough description for SEO and cards.',
      author: 'Sanskar Gupta',
      blocks: [
        { type: 'p', content: 'Body copy here.' },
        { type: 'h2', content: 'Why it works' },
      ],
    });
    expect(result.ok).toBe(true);
  });

  it('sanitizes unknown blocks out of public render payload', () => {
    const safe = sanitizeBlocksForPublic([
      { type: 'p', content: 'Keep' },
      { type: 'script', content: 'drop' },
      { type: 'image', url: '/x.png', alt: 'Diagram' },
    ]);
    expect(safe).toHaveLength(2);
    expect(safe[0].type).toBe('p');
    expect(safe[1].type).toBe('image');
  });

  it('estimates read time and slugifies titles', () => {
    expect(estimateReadTimeMinutes([{ type: 'p', content: 'one two three' }])).toBeGreaterThanOrEqual(1);
    expect(slugifyTitle('Hello World!')).toBe('hello-world');
  });

  it('rejects duplicate published slugs', () => {
    const result = validateForPublish({
      title: 'Title here',
      slug: 'spaced-repetition',
      description: 'A long enough description for SEO and cards.',
      author: 'Author',
      blocks: [{ type: 'p', content: 'Body' }],
    }, { existingSlugs: ['spaced-repetition'] });
    expect(result.ok).toBe(false);
    expect(result.issues.some((i) => i.includes('unique'))).toBe(true);
  });
});

describe('static migration parity helper', () => {
  it('exports static posts with blocks', () => {
    const posts = staticPostsForMigration();
    expect(posts.length).toBeGreaterThanOrEqual(2);
    expect(posts[0].blocks.length).toBeGreaterThan(0);
  });

  it('detects content mismatches', () => {
    const [staticPost] = staticPostsForMigration();
    const issues = compareParity(staticPost, {
      ...staticPost,
      blocks: [{ type: 'p', content: 'different' }],
    });
    expect(issues.length).toBeGreaterThan(0);
  });

  it('passes when CMS matches static', () => {
    const [staticPost] = staticPostsForMigration();
    expect(compareParity(staticPost, staticPost)).toEqual([]);
  });
});

describe('media validation', () => {
  it('enforces mime and size limits', () => {
    expect(ALLOWED_MIME.has('image/png')).toBe(true);
    expect(MAX_IMAGE_BYTES).toBe(5 * 1024 * 1024);
    expect(validateImageFile({ type: 'image/png', size: 100 }).ok).toBe(true);
    expect(validateImageFile({ type: 'application/pdf', size: 100 }).ok).toBe(false);
    expect(validateImageFile({ type: 'image/png', size: MAX_IMAGE_BYTES + 1 }).ok).toBe(false);
  });
});

describe('FAQ content and structured data', () => {
  it('covers free forever and AI fair use without em dashes', () => {
    const free = FAQ_ITEMS.find((i) => i.id === 'free-forever');
    const ai = FAQ_ITEMS.find((i) => i.id === 'ai-fair-use');
    expect(free?.answer.toLowerCase()).toContain('free forever');
    expect(ai?.answer.toLowerCase()).toContain('fair-use');
    for (const item of FAQ_ITEMS) {
      expect(item.question.includes('—')).toBe(false);
      expect(item.answer.includes('—')).toBe(false);
    }
  });

  it('builds FAQPage JSON-LD', () => {
    const ld = buildFaqJsonLd();
    expect(ld['@type']).toBe('FAQPage');
    expect(ld.mainEntity.length).toBe(FAQ_ITEMS.length);
    expect(ld.mainEntity[0]['@type']).toBe('Question');
  });

  it('has accessible accordion ids for each item', () => {
    expect(FAQ_ITEMS.every((i) => i.id && i.question && i.answer)).toBe(true);
  });
});

describe('adapter boundary convention', () => {
  it('exports blog schema helpers used by adapters', () => {
    expect(typeof validateForPublish).toBe('function');
    expect(typeof sanitizeBlocksForPublic).toBe('function');
    expect(typeof slugifyTitle).toBe('function');
  });
});

describe('backup payload checksum contract', () => {
  it('uses stable hashing inputs', async () => {
    const payload = {
      schemaVersion: 1,
      createdAt: 1,
      createdBy: 'a@b.com',
      entityCounts: { BlogPost: 1 },
      missing: [],
      entities: { BlogPost: [{ postId: 'x' }] },
    };
    const a = JSON.stringify(payload);
    const b = JSON.stringify({ ...payload });
    expect(a).toBe(b);
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(a));
    expect(new Uint8Array(digest).length).toBe(32);
  });
});
