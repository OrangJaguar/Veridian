import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";
import { logServerError } from "../_shared/logServerError.ts";
import { publicPostFields } from "../_shared/blogValidation.ts";

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  try {
    const body = await req.json().catch(() => ({}));
    const category = body.category ? String(body.category) : null;
    const featuredOnly = Boolean(body.featuredOnly);

    const rows = await base44.asServiceRole.entities.BlogPost.filter({
      status: "published",
    });

    let posts = (rows as Record<string, unknown>[])
      .filter((p) => p.status === "published")
      .map(publicPostFields);

    if (category) {
      posts = posts.filter((p) => String(p.category ?? "") === category);
    }
    if (featuredOnly) {
      posts = posts.filter((p) => p.featured);
    }

    posts.sort((a, b) => Number(b.publishedAt ?? 0) - Number(a.publishedAt ?? 0));

    const categories = [...new Set(
      posts.map((p) => p.category).filter(Boolean),
    )] as string[];

    return Response.json({
      data: {
        posts,
        categories,
        featured: posts.find((p) => p.featured) ?? posts[0] ?? null,
      },
    });
  } catch (err) {
    await logServerError(base44, "listPublishedBlogPosts", err);
    const message = err instanceof Error ? err.message : "Failed to list posts";
    return Response.json({ error: { message } }, { status: 500 });
  }
});
