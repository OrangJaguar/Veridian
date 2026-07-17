import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";
import { requireAdmin } from "../_shared/requireAdmin.ts";
import { logServerError } from "../_shared/logServerError.ts";
import {
  BLOG_SCHEMA_VERSION,
  estimateReadTimeMinutes,
  writeAudit,
} from "../_shared/blogValidation.ts";

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  try {
    const auth = await requireAdmin(base44);
    if (auth.error) return auth.error;
    const adminEmail = (auth.user as { email?: string }).email ?? "";
    const body = await req.json().catch(() => ({})) as Record<string, unknown>;
    const dryRun = Boolean(body.dryRun);
    const posts = Array.isArray(body.posts) ? body.posts as Record<string, unknown>[] : [];

    if (!posts.length) {
      return Response.json({ error: { message: "posts array required" } }, { status: 400 });
    }

    const existing = await base44.entities.BlogPost.list() as Record<string, unknown>[];
    const byStatic = new Map(
      existing
        .filter((p) => p.staticSourceSlug)
        .map((p) => [String(p.staticSourceSlug), p]),
    );
    const bySlug = new Map(existing.map((p) => [String(p.slug), p]));

    const created: Record<string, unknown>[] = [];
    const skipped: Record<string, unknown>[] = [];
    const bySlugOut: Record<string, unknown> = {};

    for (const post of posts) {
      const slug = String(post.slug ?? "");
      const staticKey = String(post.staticSourceSlug ?? slug);
      const already = byStatic.get(staticKey) ?? bySlug.get(slug);
      if (already) {
        skipped.push(already);
        bySlugOut[slug] = already;
        continue;
      }

      const now = Date.now();
      const blocks = Array.isArray(post.blocks) ? post.blocks : [];
      const row = {
        postId: `bpost_${crypto.randomUUID()}`,
        slug,
        title: String(post.title ?? ""),
        author: String(post.author ?? "Veridian"),
        description: String(post.description ?? ""),
        metaTitle: post.metaTitle ? String(post.metaTitle) : undefined,
        metaDescription: post.metaDescription ? String(post.metaDescription) : undefined,
        category: post.category ? String(post.category) : null,
        tags: Array.isArray(post.tags) ? post.tags : [],
        status: "published",
        featured: Boolean(post.featured),
        coverImageUrl: null,
        coverImageAlt: null,
        readTimeMinutes: Number(post.readTimeMinutes)
          || estimateReadTimeMinutes(blocks as unknown[]),
        blocks,
        publishedAt: Number(post.publishedAt) || now,
        archivedAt: null,
        createdAt: now,
        updatedAt: now,
        createdBy: adminEmail,
        updatedBy: adminEmail,
        ownerEmail: adminEmail,
        schemaVersion: BLOG_SCHEMA_VERSION,
        staticSourceSlug: staticKey,
      };

      if (dryRun) {
        created.push(row);
        bySlugOut[slug] = row;
      } else {
        const saved = await base44.entities.BlogPost.create(row) as Record<string, unknown>;
        created.push(saved);
        bySlugOut[slug] = saved;
      }
    }

    if (!dryRun) {
      await writeAudit(base44, {
        adminEmail,
        action: "blogMigrateStatic",
        targetType: "BlogPost",
        detail: { created: created.length, skipped: skipped.length },
      });
    }

    return Response.json({
      data: {
        dryRun,
        created,
        skipped,
        bySlug: bySlugOut,
        posts,
        counts: { created: created.length, skipped: skipped.length },
      },
    });
  } catch (err) {
    await logServerError(base44, "migrateStaticBlogPosts", err);
    const message = err instanceof Error ? err.message : "Migration failed";
    return Response.json({ error: { message } }, { status: 500 });
  }
});
