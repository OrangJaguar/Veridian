import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";
import { requireAdmin } from "../_shared/requireAdmin.ts";
import { logServerError } from "../_shared/logServerError.ts";
import {
  BLOG_SCHEMA_VERSION,
  estimateReadTimeMinutes,
  isValidSlug,
  validateForPublish,
  writeAudit,
} from "../_shared/blogValidation.ts";

function newPostId() {
  return `bpost_${crypto.randomUUID()}`;
}

function stripAdminOnly(post: Record<string, unknown>) {
  return { ...post };
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  try {
    const auth = await requireAdmin(base44);
    if (auth.error) return auth.error;
    const adminEmail = (auth.user as { email?: string }).email ?? "";

    const body = await req.json().catch(() => ({})) as Record<string, unknown>;
    const action = String(body.action ?? "");

    if (action === "list") {
      const rows = await base44.entities.BlogPost.list();
      let posts = rows as Record<string, unknown>[];
      const status = body.status ? String(body.status) : null;
      const query = String(body.query ?? "").trim().toLowerCase();
      if (status) posts = posts.filter((p) => p.status === status);
      if (query) {
        posts = posts.filter((p) => (
          String(p.title ?? "").toLowerCase().includes(query)
          || String(p.slug ?? "").toLowerCase().includes(query)
          || String(p.description ?? "").toLowerCase().includes(query)
        ));
      }
      posts.sort((a, b) => Number(b.updatedAt ?? 0) - Number(a.updatedAt ?? 0));
      return Response.json({ data: { posts } });
    }

    if (action === "get" || action === "preview") {
      const postId = String(body.postId ?? "");
      const rows = await base44.entities.BlogPost.filter({ postId });
      const post = rows[0];
      if (!post) {
        return Response.json({ error: { message: "Not found" } }, { status: 404 });
      }
      await writeAudit(base44, {
        adminEmail,
        action: action === "preview" ? "blogPreview" : "blogGet",
        targetType: "BlogPost",
        targetId: postId,
      });
      return Response.json({ data: { post: stripAdminOnly(post as Record<string, unknown>) } });
    }

    if (action === "create") {
      const now = Date.now();
      const postId = newPostId();
      const slug = String(body.slug ?? "").trim();
      if (!isValidSlug(slug)) {
        return Response.json({ error: { message: "Invalid slug" } }, { status: 400 });
      }
      const existing = await base44.entities.BlogPost.filter({ slug });
      if (existing.length) {
        return Response.json({ error: { message: "Slug already exists" } }, { status: 409 });
      }
      const blocks = Array.isArray(body.blocks) ? body.blocks : [];
      const row = {
        postId,
        slug,
        title: String(body.title ?? "Untitled"),
        author: String(body.author ?? "Veridian"),
        description: String(body.description ?? ""),
        metaTitle: body.metaTitle ? String(body.metaTitle) : undefined,
        metaDescription: body.metaDescription ? String(body.metaDescription) : undefined,
        category: body.category ? String(body.category) : null,
        tags: Array.isArray(body.tags) ? body.tags : [],
        status: "draft",
        featured: Boolean(body.featured),
        coverImageUrl: body.coverImageUrl ? String(body.coverImageUrl) : null,
        coverImageAlt: body.coverImageAlt ? String(body.coverImageAlt) : null,
        readTimeMinutes: estimateReadTimeMinutes(blocks as unknown[]),
        blocks,
        publishedAt: null,
        archivedAt: null,
        createdAt: now,
        updatedAt: now,
        createdBy: adminEmail,
        updatedBy: adminEmail,
        ownerEmail: adminEmail,
        schemaVersion: BLOG_SCHEMA_VERSION,
      };
      const created = await base44.entities.BlogPost.create(row);
      await writeAudit(base44, {
        adminEmail,
        action: "blogCreate",
        targetType: "BlogPost",
        targetId: postId,
      });
      return Response.json({ data: { post: created } });
    }

    if (action === "update") {
      const postId = String(body.postId ?? "");
      const rows = await base44.entities.BlogPost.filter({ postId });
      const existing = rows[0] as Record<string, unknown> | undefined;
      if (!existing) {
        return Response.json({ error: { message: "Not found" } }, { status: 404 });
      }
      const patch: Record<string, unknown> = { updatedAt: Date.now(), updatedBy: adminEmail };
      for (const key of [
        "title", "slug", "author", "description", "metaTitle", "metaDescription",
        "category", "tags", "featured", "coverImageUrl", "coverImageAlt", "blocks",
      ]) {
        if (key in body) patch[key] = body[key];
      }
      if (patch.slug && !isValidSlug(patch.slug)) {
        return Response.json({ error: { message: "Invalid slug" } }, { status: 400 });
      }
      if (patch.slug && patch.slug !== existing.slug) {
        const clash = await base44.entities.BlogPost.filter({ slug: String(patch.slug) });
        if (clash.length) {
          return Response.json({ error: { message: "Slug already exists" } }, { status: 409 });
        }
      }
      if (Array.isArray(patch.blocks)) {
        patch.readTimeMinutes = estimateReadTimeMinutes(patch.blocks as unknown[]);
      }
      // Never allow direct status flip via update — use publish/archive/restore
      const updated = await base44.entities.BlogPost.update(existing.id as string, patch);
      await writeAudit(base44, {
        adminEmail,
        action: "blogUpdate",
        targetType: "BlogPost",
        targetId: postId,
      });
      return Response.json({ data: { post: updated } });
    }

    if (action === "publish") {
      const postId = String(body.postId ?? "");
      const rows = await base44.entities.BlogPost.filter({ postId });
      const existing = rows[0] as Record<string, unknown> | undefined;
      if (!existing) {
        return Response.json({ error: { message: "Not found" } }, { status: 404 });
      }
      const published = await base44.entities.BlogPost.filter({ status: "published" });
      const otherSlugs = (published as Record<string, unknown>[])
        .filter((p) => p.postId !== postId)
        .map((p) => String(p.slug));
      const issues = validateForPublish(existing, otherSlugs);
      if (issues.length) {
        return Response.json({ error: { message: "Publish validation failed", issues } }, { status: 400 });
      }
      const updated = await base44.entities.BlogPost.update(existing.id as string, {
        status: "published",
        publishedAt: existing.publishedAt ?? Date.now(),
        archivedAt: null,
        updatedAt: Date.now(),
        updatedBy: adminEmail,
        readTimeMinutes: estimateReadTimeMinutes((existing.blocks as unknown[]) ?? []),
      });
      await writeAudit(base44, {
        adminEmail,
        action: "blogPublish",
        targetType: "BlogPost",
        targetId: postId,
      });
      return Response.json({ data: { post: updated } });
    }

    if (action === "archive") {
      const postId = String(body.postId ?? "");
      const rows = await base44.entities.BlogPost.filter({ postId });
      const existing = rows[0] as Record<string, unknown> | undefined;
      if (!existing) {
        return Response.json({ error: { message: "Not found" } }, { status: 404 });
      }
      const updated = await base44.entities.BlogPost.update(existing.id as string, {
        status: "archived",
        archivedAt: Date.now(),
        updatedAt: Date.now(),
        updatedBy: adminEmail,
      });
      await writeAudit(base44, {
        adminEmail,
        action: "blogArchive",
        targetType: "BlogPost",
        targetId: postId,
      });
      return Response.json({ data: { post: updated } });
    }

    if (action === "restore") {
      const postId = String(body.postId ?? "");
      const rows = await base44.entities.BlogPost.filter({ postId });
      const existing = rows[0] as Record<string, unknown> | undefined;
      if (!existing) {
        return Response.json({ error: { message: "Not found" } }, { status: 404 });
      }
      const updated = await base44.entities.BlogPost.update(existing.id as string, {
        status: "draft",
        archivedAt: null,
        updatedAt: Date.now(),
        updatedBy: adminEmail,
      });
      await writeAudit(base44, {
        adminEmail,
        action: "blogRestore",
        targetType: "BlogPost",
        targetId: postId,
      });
      return Response.json({ data: { post: updated } });
    }

    if (action === "delete") {
      const postId = String(body.postId ?? "");
      const rows = await base44.entities.BlogPost.filter({ postId });
      const existing = rows[0] as Record<string, unknown> | undefined;
      if (!existing) {
        return Response.json({ error: { message: "Not found" } }, { status: 404 });
      }
      await base44.entities.BlogPost.delete(existing.id as string);
      await writeAudit(base44, {
        adminEmail,
        action: "blogDelete",
        targetType: "BlogPost",
        targetId: postId,
      });
      return Response.json({ data: { ok: true } });
    }

    if (action === "duplicate") {
      const postId = String(body.postId ?? "");
      const rows = await base44.entities.BlogPost.filter({ postId });
      const existing = rows[0] as Record<string, unknown> | undefined;
      if (!existing) {
        return Response.json({ error: { message: "Not found" } }, { status: 404 });
      }
      const now = Date.now();
      const newId = newPostId();
      let slug = `${existing.slug}-copy`;
      let n = 2;
      while ((await base44.entities.BlogPost.filter({ slug })).length) {
        slug = `${existing.slug}-copy-${n}`;
        n += 1;
      }
      const created = await base44.entities.BlogPost.create({
        ...existing,
        id: undefined,
        postId: newId,
        slug,
        title: `${existing.title} (copy)`,
        status: "draft",
        featured: false,
        publishedAt: null,
        archivedAt: null,
        createdAt: now,
        updatedAt: now,
        createdBy: adminEmail,
        updatedBy: adminEmail,
        ownerEmail: adminEmail,
        staticSourceSlug: null,
      });
      await writeAudit(base44, {
        adminEmail,
        action: "blogDuplicate",
        targetType: "BlogPost",
        targetId: newId,
        detail: { from: postId },
      });
      return Response.json({ data: { post: created } });
    }

    return Response.json({ error: { message: `Unknown action: ${action}` } }, { status: 400 });
  } catch (err) {
    await logServerError(base44, "adminBlogPost", err);
    const message = err instanceof Error ? err.message : "Admin blog action failed";
    return Response.json({ error: { message } }, { status: 500 });
  }
});
