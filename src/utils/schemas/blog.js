import { z } from 'zod';

export const BLOG_STATUSES = ['draft', 'published', 'archived'];
export const BLOG_BLOCK_TYPES = [
  'p',
  'h2',
  'h3',
  'image',
  'ul',
  'ol',
  'quote',
  'callout',
  'divider',
  'cta',
];

export const blogBlockSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('p'),
    content: z.string().min(1),
  }),
  z.object({
    type: z.literal('h2'),
    content: z.string().min(1),
  }),
  z.object({
    type: z.literal('h3'),
    content: z.string().min(1),
  }),
  z.object({
    type: z.literal('image'),
    assetId: z.string().optional(),
    url: z.string().min(1),
    alt: z.string().min(1, 'Image blocks require alt text'),
    caption: z.string().optional(),
    width: z.number().nullable().optional(),
    height: z.number().nullable().optional(),
  }),
  z.object({
    type: z.literal('ul'),
    items: z.array(z.string().min(1)).min(1),
  }),
  z.object({
    type: z.literal('ol'),
    items: z.array(z.string().min(1)).min(1),
  }),
  z.object({
    type: z.literal('quote'),
    content: z.string().min(1),
    attribution: z.string().optional(),
  }),
  z.object({
    type: z.literal('callout'),
    content: z.string().min(1),
    tone: z.enum(['info', 'tip', 'warning']).optional(),
  }),
  z.object({
    type: z.literal('divider'),
  }),
  z.object({
    type: z.literal('cta'),
    label: z.string().min(1),
    href: z.string().min(1),
    description: z.string().optional(),
  }),
]);

export const blogPostSchema = z.object({
  postId: z.string(),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase kebab-case'),
  title: z.string().min(3).max(160),
  author: z.string().min(1).max(80),
  description: z.string().min(10).max(320),
  metaTitle: z.string().min(3).max(70).optional(),
  metaDescription: z.string().min(10).max(160).optional(),
  category: z.string().max(60).nullable().optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(BLOG_STATUSES),
  featured: z.boolean().optional(),
  coverImageUrl: z.string().nullable().optional(),
  coverImageAlt: z.string().nullable().optional(),
  readTimeMinutes: z.number().int().min(1).max(120).nullable().optional(),
  blocks: z.array(blogBlockSchema),
  publishedAt: z.number().nullable().optional(),
  archivedAt: z.number().nullable().optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
  createdBy: z.string().optional(),
  updatedBy: z.string().optional(),
  ownerEmail: z.string().optional(),
  schemaVersion: z.number().int().optional(),
});

export const createBlogPostSchema = blogPostSchema.partial({
  postId: true,
  createdAt: true,
  updatedAt: true,
  publishedAt: true,
  archivedAt: true,
  status: true,
}).extend({
  title: z.string().min(3).max(160),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  blocks: z.array(blogBlockSchema).default([]),
});

export const blogAssetSchema = z.object({
  assetId: z.string(),
  url: z.string().min(1),
  mimeType: z.string(),
  sizeBytes: z.number().int().min(0),
  fileName: z.string().optional(),
  altText: z.string().default(''),
  caption: z.string().optional(),
  width: z.number().nullable().optional(),
  height: z.number().nullable().optional(),
  referenceCount: z.number().int().min(0).optional(),
  createdAt: z.number(),
  updatedAt: z.number().optional(),
  ownerEmail: z.string().optional(),
});

export const BLOG_SCHEMA_VERSION = 1;

/** Estimate read time from blocks (~220 wpm). */
export function estimateReadTimeMinutes(blocks = []) {
  let words = 0;
  for (const block of blocks) {
    if (typeof block.content === 'string') {
      words += block.content.trim().split(/\s+/).filter(Boolean).length;
    }
    if (Array.isArray(block.items)) {
      words += block.items.join(' ').trim().split(/\s+/).filter(Boolean).length;
    }
    if (typeof block.label === 'string') words += block.label.split(/\s+/).length;
    if (typeof block.description === 'string') {
      words += block.description.split(/\s+/).filter(Boolean).length;
    }
  }
  return Math.max(1, Math.ceil(words / 220));
}

/**
 * Validate a post for publication. Returns { ok, issues }.
 */
export function validateForPublish(post, { existingSlugs = [] } = {}) {
  const issues = [];
  if (!post?.title?.trim()) issues.push('Title is required');
  if (!post?.slug?.trim()) issues.push('Slug is required');
  if (!post?.description?.trim()) issues.push('Description is required');
  if (!post?.author?.trim()) issues.push('Author is required');
  if (!Array.isArray(post?.blocks) || post.blocks.length < 1) {
    issues.push('At least one content block is required');
  }

  const slugParse = blogPostSchema.shape.slug.safeParse(post?.slug);
  if (!slugParse.success) issues.push('Slug must be lowercase kebab-case');

  if (existingSlugs.includes(post?.slug)) {
    issues.push('Slug must be unique among published posts');
  }

  const blocks = post?.blocks ?? [];
  for (let i = 0; i < blocks.length; i += 1) {
    const parsed = blogBlockSchema.safeParse(blocks[i]);
    if (!parsed.success) {
      issues.push(`Block ${i + 1}: ${parsed.error.issues[0]?.message ?? 'invalid'}`);
      continue;
    }
    if (blocks[i].type === 'image' && !String(blocks[i].alt ?? '').trim()) {
      issues.push(`Block ${i + 1}: image alt text is required`);
    }
  }

  if (post?.coverImageUrl && !String(post?.coverImageAlt ?? '').trim()) {
    issues.push('Cover image requires alt text');
  }

  return { ok: issues.length === 0, issues };
}

/** Sanitize blocks for public rendering (strip unknown fields). */
export function sanitizeBlocksForPublic(blocks = []) {
  return (blocks ?? []).map((block) => {
    const parsed = blogBlockSchema.safeParse(block);
    return parsed.success ? parsed.data : null;
  }).filter(Boolean);
}

export function slugifyTitle(title = '') {
  return String(title)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}
