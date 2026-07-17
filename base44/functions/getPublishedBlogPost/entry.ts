import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";
import { logServerError } from "../_shared/logServerError.ts";
import { publicPostFields } from "../_shared/blogValidation.ts";

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  try {
    const body = await req.json().catch(() => ({}));
    const slug = String(body.slug ?? "").trim();
    if (!slug) {
      return Response.json({ error: { message: "slug required" } }, { status: 400 });
    }

    const rows = await base44.asServiceRole.entities.BlogPost.filter({ slug });
    const post = (rows as Record<string, unknown>[]).find(
      (p) => p.status === "published" && p.slug === slug,
    );

    if (!post) {
      return Response.json({ error: { message: "Not found" }, data: null }, { status: 404 });
    }

    const relatedRows = await base44.asServiceRole.entities.BlogPost.filter({
      status: "published",
    });
    const related = (relatedRows as Record<string, unknown>[])
      .filter((p) => p.slug !== slug && p.status === "published")
      .filter((p) => !post.category || p.category === post.category)
      .sort((a, b) => Number(b.publishedAt ?? 0) - Number(a.publishedAt ?? 0))
      .slice(0, 3)
      .map(publicPostFields);

    // Fallback related if category filter empty
    const relatedFinal = related.length
      ? related
      : (relatedRows as Record<string, unknown>[])
        .filter((p) => p.slug !== slug && p.status === "published")
        .sort((a, b) => Number(b.publishedAt ?? 0) - Number(a.publishedAt ?? 0))
        .slice(0, 3)
        .map(publicPostFields);

    return Response.json({
      data: {
        post: publicPostFields(post),
        related: relatedFinal,
      },
    });
  } catch (err) {
    await logServerError(base44, "getPublishedBlogPost", err);
    const message = err instanceof Error ? err.message : "Failed to load post";
    return Response.json({ error: { message } }, { status: 500 });
  }
});
