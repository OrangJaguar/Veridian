import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";
import { requireAdmin } from "../_shared/requireAdmin.ts";
import { logServerError } from "../_shared/logServerError.ts";
import {
  ALLOWED_MIME,
  MAX_IMAGE_BYTES,
  writeAudit,
} from "../_shared/blogValidation.ts";

function newAssetId() {
  return `basset_${crypto.randomUUID()}`;
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
      const rows = await base44.entities.BlogAsset.list();
      const assets = (rows as Record<string, unknown>[])
        .sort((a, b) => Number(b.createdAt ?? 0) - Number(a.createdAt ?? 0));
      return Response.json({ data: { assets } });
    }

    if (action === "create") {
      const mimeType = String(body.mimeType ?? "");
      const sizeBytes = Number(body.sizeBytes ?? 0);
      const dataUrl = String(body.dataUrl ?? "");
      const altText = String(body.altText ?? "");
      if (!ALLOWED_MIME.has(mimeType)) {
        return Response.json({ error: { message: "Unsupported image type" } }, { status: 400 });
      }
      if (!Number.isFinite(sizeBytes) || sizeBytes <= 0 || sizeBytes > MAX_IMAGE_BYTES) {
        return Response.json({ error: { message: "Image exceeds size limit" } }, { status: 400 });
      }
      if (!dataUrl.startsWith("data:image/")) {
        return Response.json({ error: { message: "Invalid image payload" } }, { status: 400 });
      }

      let url = dataUrl;
      const integrations = base44.integrations as {
        Core?: { UploadFile?: (p: { file: Blob }) => Promise<{ file_url?: string; url?: string }> };
      };
      if (integrations?.Core?.UploadFile) {
        try {
          const blob = await (await fetch(dataUrl)).blob();
          const uploaded = await integrations.Core.UploadFile({ file: blob });
          url = uploaded.file_url ?? uploaded.url ?? dataUrl;
        } catch {
          // fall back to data URL storage
        }
      }

      const now = Date.now();
      const assetId = newAssetId();
      const created = await base44.entities.BlogAsset.create({
        assetId,
        url,
        mimeType,
        sizeBytes,
        fileName: body.fileName ? String(body.fileName) : undefined,
        altText,
        caption: body.caption ? String(body.caption) : "",
        width: body.width != null ? Number(body.width) : null,
        height: body.height != null ? Number(body.height) : null,
        referenceCount: 0,
        createdAt: now,
        updatedAt: now,
        ownerEmail: adminEmail,
      });
      await writeAudit(base44, {
        adminEmail,
        action: "blogAssetCreate",
        targetType: "BlogAsset",
        targetId: assetId,
      });
      return Response.json({ data: { asset: created } });
    }

    if (action === "update") {
      const assetId = String(body.assetId ?? "");
      const rows = await base44.entities.BlogAsset.filter({ assetId });
      const existing = rows[0] as Record<string, unknown> | undefined;
      if (!existing) {
        return Response.json({ error: { message: "Not found" } }, { status: 404 });
      }
      const patch: Record<string, unknown> = { updatedAt: Date.now() };
      for (const key of ["altText", "caption", "width", "height", "referenceCount"]) {
        if (key in body) patch[key] = body[key];
      }
      const updated = await base44.entities.BlogAsset.update(existing.id as string, patch);
      return Response.json({ data: { asset: updated } });
    }

    if (action === "delete") {
      const assetId = String(body.assetId ?? "");
      const rows = await base44.entities.BlogAsset.filter({ assetId });
      const existing = rows[0] as Record<string, unknown> | undefined;
      if (!existing) {
        return Response.json({ error: { message: "Not found" } }, { status: 404 });
      }
      const refs = Number(existing.referenceCount ?? 0);
      if (refs > 0) {
        return Response.json({
          error: { message: "Asset is still referenced by posts" },
        }, { status: 409 });
      }
      // Also check posts for url usage
      const posts = await base44.entities.BlogPost.list();
      const inUse = (posts as Record<string, unknown>[]).some((p) => {
        if (p.coverImageUrl === existing.url) return true;
        const blocks = Array.isArray(p.blocks) ? p.blocks as Record<string, unknown>[] : [];
        return blocks.some((b) => b.type === "image" && (b.assetId === assetId || b.url === existing.url));
      });
      if (inUse) {
        return Response.json({
          error: { message: "Asset is still referenced by posts" },
        }, { status: 409 });
      }
      await base44.entities.BlogAsset.delete(existing.id as string);
      await writeAudit(base44, {
        adminEmail,
        action: "blogAssetDelete",
        targetType: "BlogAsset",
        targetId: assetId,
      });
      return Response.json({ data: { ok: true } });
    }

    return Response.json({ error: { message: `Unknown action: ${action}` } }, { status: 400 });
  } catch (err) {
    await logServerError(base44, "adminBlogAsset", err);
    const message = err instanceof Error ? err.message : "Asset action failed";
    return Response.json({ error: { message } }, { status: 500 });
  }
});
