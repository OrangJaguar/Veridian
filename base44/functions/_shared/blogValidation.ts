/** Shared blog validation for Base44 Deno functions. */

export const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const BLOG_SCHEMA_VERSION = 1;

const BLOCK_TYPES = new Set([
  "p", "h2", "h3", "image", "ul", "ol", "quote", "callout", "divider", "cta",
]);

export function isValidSlug(slug: unknown): boolean {
  return typeof slug === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

export function validateBlock(block: Record<string, unknown>, index: number): string | null {
  const type = String(block?.type ?? "");
  if (!BLOCK_TYPES.has(type)) return `Block ${index + 1}: unknown type`;
  if (type === "divider") return null;
  if (type === "p" || type === "h2" || type === "h3" || type === "quote" || type === "callout") {
    if (!String(block.content ?? "").trim()) return `Block ${index + 1}: content required`;
    return null;
  }
  if (type === "ul" || type === "ol") {
    if (!Array.isArray(block.items) || !(block.items as unknown[]).length) {
      return `Block ${index + 1}: list items required`;
    }
    return null;
  }
  if (type === "image") {
    if (!String(block.url ?? "").trim()) return `Block ${index + 1}: image url required`;
    if (!String(block.alt ?? "").trim()) return `Block ${index + 1}: image alt text required`;
    return null;
  }
  if (type === "cta") {
    if (!String(block.label ?? "").trim() || !String(block.href ?? "").trim()) {
      return `Block ${index + 1}: CTA needs label and href`;
    }
    return null;
  }
  return null;
}

export function validateForPublish(post: Record<string, unknown>, existingSlugs: string[] = []): string[] {
  const issues: string[] = [];
  if (!String(post.title ?? "").trim()) issues.push("Title is required");
  if (!isValidSlug(post.slug)) issues.push("Slug must be lowercase kebab-case");
  if (!String(post.description ?? "").trim()) issues.push("Description is required");
  if (!String(post.author ?? "").trim()) issues.push("Author is required");
  const blocks = Array.isArray(post.blocks) ? post.blocks as Record<string, unknown>[] : [];
  if (!blocks.length) issues.push("At least one content block is required");
  if (existingSlugs.includes(String(post.slug))) {
    issues.push("Slug must be unique among published posts");
  }
  blocks.forEach((b, i) => {
    const err = validateBlock(b, i);
    if (err) issues.push(err);
  });
  if (post.coverImageUrl && !String(post.coverImageAlt ?? "").trim()) {
    issues.push("Cover image requires alt text");
  }
  return issues;
}

export function estimateReadTimeMinutes(blocks: unknown[] = []): number {
  let words = 0;
  for (const raw of blocks) {
    const block = raw as Record<string, unknown>;
    if (typeof block.content === "string") {
      words += block.content.trim().split(/\s+/).filter(Boolean).length;
    }
    if (Array.isArray(block.items)) {
      words += (block.items as string[]).join(" ").trim().split(/\s+/).filter(Boolean).length;
    }
  }
  return Math.max(1, Math.ceil(words / 220));
}

export function publicPostFields(post: Record<string, unknown>) {
  return {
    postId: post.postId,
    slug: post.slug,
    title: post.title,
    author: post.author,
    description: post.description,
    metaTitle: post.metaTitle ?? post.title,
    metaDescription: post.metaDescription ?? post.description,
    category: post.category ?? null,
    tags: post.tags ?? [],
    featured: Boolean(post.featured),
    coverImageUrl: post.coverImageUrl ?? null,
    coverImageAlt: post.coverImageAlt ?? null,
    readTimeMinutes: post.readTimeMinutes ?? null,
    blocks: post.blocks ?? [],
    publishedAt: post.publishedAt ?? null,
  };
}

export async function writeAudit(
  base44: { entities: Record<string, { create: (row: Record<string, unknown>) => Promise<unknown> }> },
  {
    adminEmail,
    action,
    targetType,
    targetId,
    detail,
  }: {
    adminEmail: string;
    action: string;
    targetType: string;
    targetId?: string;
    detail?: Record<string, unknown>;
  },
) {
  try {
    await base44.entities.AdminAuditLog.create({
      adminEmail,
      action,
      targetType,
      targetId: targetId ?? null,
      detail: JSON.stringify(detail ?? {}),
      createdAt: Date.now(),
    });
  } catch {
    // audit is best-effort
  }
}
