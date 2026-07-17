import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";
import { z } from "npm:zod";

const MAX_HTML_BYTES = 500_000;
const MAX_OUTPUT_CHARS = 80_000;
const FETCH_TIMEOUT_MS = 15_000;

const LIMITS = {
  urlFetchesPerDay: 10,
};

const requestSchema = z.object({
  url: z.string().url().max(2048),
});

function utcDateKey() {
  return new Date().toISOString().slice(0, 10);
}

function jsonResponse(body: unknown, status = 200) {
  return Response.json(body, { status });
}

function errorResponse(message: string, status = 400) {
  return jsonResponse({ error: { message, status } }, status);
}

// --- YouTube helpers ---

const YOUTUBE_PATTERNS: RegExp[] = [
  /(?:youtube\.com\/watch\?.*v=)([\w-]{11})/,
  /(?:youtu\.be\/)([\w-]{11})/,
  /(?:youtube\.com\/shorts\/)([\w-]{11})/,
  /(?:youtube\.com\/embed\/)([\w-]{11})/,
];

function extractYouTubeVideoId(url: string): string | null {
  for (const re of YOUTUBE_PATTERNS) {
    const match = url.match(re);
    if (match?.[1]) return match[1];
  }
  return null;
}

async function fetchYouTubeTranscript(videoId: string): Promise<{ title: string; content: string }> {
  // Fetch the video page to extract captions track URL
  const pageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; Veridian/1.0)",
      "Accept-Language": "en-US,en;q=0.9",
    },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });

  if (!pageRes.ok) {
    throw new Error("Could not access YouTube video.");
  }

  const html = await pageRes.text();

  // Extract title
  const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
  const rawTitle = titleMatch?.[1]?.replace(/ - YouTube$/, "").trim() ?? `YouTube Video ${videoId}`;

  // Extract captions URL from playerCaptionsTracklistRenderer
  const captionsMatch = html.match(/"captionTracks":\[(\{[^}]*"baseUrl":"[^"]*"[^}]*\})/);
  if (!captionsMatch) {
    throw new Error("No transcript available for this video. Try a different video or paste notes.");
  }

  const baseUrlMatch = captionsMatch[1].match(/"baseUrl":"([^"]*)"/);
  if (!baseUrlMatch?.[1]) {
    throw new Error("No transcript available for this video. Try a different video or paste notes.");
  }

  const captionUrl = baseUrlMatch[1].replace(/\\u0026/g, "&");

  const captionRes = await fetch(captionUrl, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });

  if (!captionRes.ok) {
    throw new Error("Could not fetch video transcript.");
  }

  const captionXml = await captionRes.text();

  // Parse the XML transcript — each <text> element contains a segment
  const segments: string[] = [];
  const textRegex = /<text[^>]*>([\s\S]*?)<\/text>/g;
  let seg;
  while ((seg = textRegex.exec(captionXml)) !== null) {
    const decoded = seg[1]
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/<[^>]*>/g, "")
      .trim();
    if (decoded) segments.push(decoded);
  }

  if (!segments.length) {
    throw new Error("Transcript is empty. Try a different video or paste notes.");
  }

  const content = segments.join(" ").slice(0, MAX_OUTPUT_CHARS);
  return { title: rawTitle, content };
}

// --- Web page extraction ---

function stripHtmlToText(html: string): { title: string; content: string } {
  // Extract <title>
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  const title = titleMatch?.[1]?.trim() ?? "";

  // Try to isolate main content by looking for <article>, <main>, or <body>
  let body = html;
  const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  const mainMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  if (articleMatch) {
    body = articleMatch[1];
  } else if (mainMatch) {
    body = mainMatch[1];
  } else {
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (bodyMatch) body = bodyMatch[1];
  }

  // Remove script, style, nav, header, footer tags and their content
  body = body.replace(/<(script|style|nav|header|footer|noscript|svg|iframe)[^>]*>[\s\S]*?<\/\1>/gi, " ");
  // Remove all remaining HTML tags
  body = body.replace(/<[^>]+>/g, " ");
  // Decode common entities
  body = body
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
  // Collapse whitespace
  body = body.replace(/\s+/g, " ").trim();

  return { title, content: body.slice(0, MAX_OUTPUT_CHARS) };
}

async function fetchWebPage(url: string): Promise<{ title: string; content: string }> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; Veridian/1.0; +https://veridian.app)",
      Accept: "text/html,application/xhtml+xml,*/*",
    },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    redirect: "follow",
  });

  if (!res.ok) {
    throw new Error(`Could not fetch URL (HTTP ${res.status}). Check the link and try again.`);
  }

  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("text/html") && !contentType.includes("text/plain") && !contentType.includes("application/xhtml")) {
    throw new Error("This URL doesn't point to a readable web page. Try pasting the text directly.");
  }

  const contentLength = Number(res.headers.get("content-length") || 0);
  if (contentLength > MAX_HTML_BYTES) {
    throw new Error("Page is too large to process. Try pasting the relevant text directly.");
  }

  const html = (await res.text()).slice(0, MAX_HTML_BYTES);
  return stripHtmlToText(html);
}

// --- Rate limiting ---

async function checkUrlFetchQuota(
  base44: ReturnType<typeof createClientFromRequest>,
  userEmail: string,
): Promise<Response | null> {
  const dateKey = utcDateKey();
  const rows = await base44.entities.UserAiQuota.filter({ userEmail, dateKey });
  const quota = rows[0];

  const current = (quota as Record<string, unknown>)?.urlFetches ?? 0;
  if (typeof current === "number" && current >= LIMITS.urlFetchesPerDay) {
    return errorResponse("Daily URL fetch limit reached. Try again tomorrow or paste the text directly.", 429);
  }

  if (quota) {
    await base44.entities.UserAiQuota.update(quota.id, {
      urlFetches: (current as number) + 1,
    });
  }

  return null;
}

// --- Handler ---

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return errorResponse("Method not allowed.", 405);
  }

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return errorResponse("Authentication required.", 401);
    }

    const userKey = user.email ?? user.id;
    if (!userKey) {
      return errorResponse("Authentication required.", 401);
    }

    const body = requestSchema.parse(await req.json());
    const { url } = body;

    const quotaErr = await checkUrlFetchQuota(base44, userKey);
    if (quotaErr) return quotaErr;

    const videoId = extractYouTubeVideoId(url);

    if (videoId) {
      const { title, content } = await fetchYouTubeTranscript(videoId);
      return jsonResponse({ title, content, type: "youtube" });
    }

    const { title, content } = await fetchWebPage(url);
    if (!content || content.length < 20) {
      return errorResponse("Could not extract meaningful text from this page. Try pasting the text directly.");
    }

    return jsonResponse({ title, content, type: "webpage" });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return errorResponse("Invalid URL format.", 400);
    }
    const message = err instanceof Error ? err.message : "URL fetch failed";
    return errorResponse(message, 400);
  }
});
