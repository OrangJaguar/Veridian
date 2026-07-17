/**
 * Pure static → CMS migration helpers (no SDK imports).
 */
import { BLOG_POSTS } from '@/content/blog';
import { estimateReadTimeMinutes } from '@/utils/schemas/blog';

export function staticPostsForMigration() {
  return BLOG_POSTS.map((post) => ({
    slug: post.slug,
    title: post.title,
    author: post.author,
    description: post.description,
    metaTitle: post.metaTitle,
    metaDescription: post.metaDescription,
    category: post.category ?? null,
    featured: Boolean(post.featured),
    publishedAt: post.publishedAt ?? null,
    readTimeMinutes: post.readTimeMinutes ?? estimateReadTimeMinutes(post.blocks),
    blocks: (post.blocks ?? []).map((b) => (
      b.type === 'p' ? { type: 'p', content: b.content } : b
    )),
    staticSourceSlug: post.slug,
  }));
}

export function compareParity(staticPost, cmsPost) {
  const issues = [];
  if (!cmsPost) {
    issues.push('missing in CMS');
    return issues;
  }
  if (cmsPost.title !== staticPost.title) issues.push('title mismatch');
  if (cmsPost.slug !== staticPost.slug) issues.push('slug mismatch');
  if ((cmsPost.blocks?.length ?? 0) !== (staticPost.blocks?.length ?? 0)) {
    issues.push('block count mismatch');
  } else {
    for (let i = 0; i < (staticPost.blocks?.length ?? 0); i += 1) {
      const a = staticPost.blocks[i];
      const b = cmsPost.blocks[i];
      if (a.type !== b?.type) {
        issues.push(`block ${i + 1} type mismatch`);
        continue;
      }
      if (a.content && a.content !== b.content) {
        issues.push(`block ${i + 1} content mismatch`);
      }
    }
  }
  return issues;
}

/**
 * Run migration and return parity report.
 */
export async function runStaticBlogMigration({ dryRun = false } = {}) {
  const { migrateStaticBlogPosts } = await import('@/api/adapters/blogAdapter');
  const posts = staticPostsForMigration();
  const result = await migrateStaticBlogPosts({ dryRun, posts });
  const parity = posts.map((staticPost) => {
    const cms = (result?.created ?? []).find((p) => p.staticSourceSlug === staticPost.slug
      || p.slug === staticPost.slug)
      ?? (result?.skipped ?? []).find((p) => p.slug === staticPost.slug)
      ?? result?.bySlug?.[staticPost.slug]
      ?? null;
    return {
      slug: staticPost.slug,
      issues: compareParity(staticPost, cms),
    };
  });
  return { ...result, parity, ok: parity.every((p) => p.issues.length === 0) };
}
