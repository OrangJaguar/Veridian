import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";
import type { BackendClient, BackendUser, EntityHandle, EntityRecord } from "./backendTypes.ts";
import { bindUserAiKey, projectUrl, publishableKey, serviceClient } from "./userApiKeys.ts";

const PAGE_SIZE = 1000;
const MAX_ROWS = 5000;
const FIELD_NAME = /^[A-Za-z_][A-Za-z0-9_]*$/;

type Row = {
  id: string;
  entity: string;
  owner_id: string | null;
  data: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

function toRecord(row: Row): EntityRecord {
  const data = row.data && typeof row.data === "object" ? row.data : {};
  return {
    ...data,
    id: row.id,
    createdAt: data.createdAt ?? new Date(row.created_at).getTime(),
    updatedAt: data.updatedAt ?? new Date(row.updated_at).getTime(),
  };
}

function stripId(payload: Record<string, unknown>) {
  const next = { ...payload };
  delete next.id;
  return next;
}

function valuesEqual(left: unknown, right: unknown) {
  if (left === right) return true;
  if (typeof right === "boolean" || typeof right === "number") return String(left) === String(right);
  return false;
}

function matches(record: EntityRecord, criteria: Record<string, unknown>) {
  return Object.entries(criteria).every(([key, value]) => {
    if (value === undefined) return true;
    return valuesEqual(record[key], value);
  });
}

function applyCriteria(query: ReturnType<SupabaseClient["from"]> extends never ? never : any, criteria: Record<string, unknown>) {
  let next = query;
  for (const [key, value] of Object.entries(criteria)) {
    if (value === undefined || value === null || typeof value === "object") continue;
    if (!FIELD_NAME.test(key)) continue;
    const column = `data->>${key}`;
    const expected = typeof value === "boolean" ? String(value) : String(value);
    next = next.eq(column, expected);
  }
  return next;
}

async function fetchRows(
  client: SupabaseClient,
  entity: string,
  criteria: Record<string, unknown>,
  ownerId: string | null,
): Promise<EntityRecord[]> {
  const rows: EntityRecord[] = [];
  for (let from = 0; from < MAX_ROWS; from += PAGE_SIZE) {
    let query = client.from("app_records").select("*").eq("entity", entity);
    if (ownerId) query = query.eq("owner_id", ownerId);
    query = applyCriteria(query, criteria);
    const { data, error } = await query.order("id", { ascending: true }).range(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(error.message);
    const page = (data ?? []) as Row[];
    rows.push(...page.map(toRecord).filter((record) => matches(record, criteria)));
    if (page.length < PAGE_SIZE) break;
  }
  return rows;
}

function createEntityHandle(
  client: SupabaseClient,
  entity: string,
  options: { ownerId: () => Promise<string | null>; restrictListToOwner: boolean },
): EntityHandle {
  return {
    async filter(criteria = {}) {
      return fetchRows(client, entity, criteria, null);
    },
    async list() {
      if (!options.restrictListToOwner) return fetchRows(client, entity, {}, null);
      const ownerId = await options.ownerId();
      if (!ownerId) return [];
      return fetchRows(client, entity, {}, ownerId);
    },
    async create(payload) {
      const ownerId = await options.ownerId();
      const { data, error } = await client
        .from("app_records")
        .insert({
          entity,
          owner_id: ownerId,
          data: stripId(payload),
        })
        .select("*")
        .single();
      if (error) throw new Error(error.message);
      return toRecord(data as Row);
    },
    async update(id, patch) {
      const { data: existing, error: readError } = await client
        .from("app_records")
        .select("*")
        .eq("id", id)
        .eq("entity", entity)
        .maybeSingle();
      if (readError) throw new Error(readError.message);
      if (!existing) throw new Error(`${entity} not found`);
      const merged = { ...((existing as Row).data ?? {}), ...stripId(patch) };
      const { data, error } = await client
        .from("app_records")
        .update({ data: merged })
        .eq("id", id)
        .eq("entity", entity)
        .select("*")
        .single();
      if (error) throw new Error(error.message);
      return toRecord(data as Row);
    },
    async delete(id) {
      const { error } = await client.from("app_records").delete().eq("id", id).eq("entity", entity);
      if (error) throw new Error(error.message);
    },
  };
}

function entityProxy(
  client: SupabaseClient,
  options: { ownerId: () => Promise<string | null>; restrictListToOwner: boolean },
): Record<string, EntityHandle> {
  return new Proxy({} as Record<string, EntityHandle>, {
    get(_target, prop) {
      if (typeof prop !== "string") return undefined;
      return createEntityHandle(client, prop, options);
    },
  });
}

function mapUser(user: { id: string; email?: string; user_metadata?: Record<string, unknown>; app_metadata?: Record<string, unknown> }): BackendUser {
  const role = user.app_metadata?.role === "admin" ? "admin" : "user";
  const fullName = user.user_metadata?.full_name;
  return {
    id: user.id,
    email: user.email,
    full_name: typeof fullName === "string" ? fullName : "",
    role,
  };
}

async function sendEmail(input: { to: string; subject: string; body: string }) {
  const apiKey = Deno.env.get("RESEND_API_KEY")?.trim();
  const from = Deno.env.get("EMAIL_FROM")?.trim() || "Veridian <noreply@veridian.study>";
  if (!apiKey) {
    console.log("[email] skipped — set RESEND_API_KEY to deliver mail", { to: input.to, subject: input.subject });
    return { skipped: true };
  }
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: input.to,
      subject: input.subject,
      html: input.body,
    }),
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Email failed (${response.status}): ${detail.slice(0, 300)}`);
  }
  return response.json();
}

async function uploadFile(file: Blob) {
  const path = `${crypto.randomUUID()}`;
  const bytes = new Uint8Array(await file.arrayBuffer());
  const client = serviceClient();
  const { error } = await client.storage.from("blog-assets").upload(path, bytes, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });
  if (error) throw new Error(error.message);
  const { data } = client.storage.from("blog-assets").getPublicUrl(path);
  return { file_url: data.publicUrl, url: data.publicUrl };
}

/**
 * Base44-shaped client backed by Supabase.
 * User calls obey RLS. asServiceRole bypasses RLS and is only constructed on the server.
 */
function userJwt(header: string | null): string | undefined {
  if (!header) return undefined;
  const token = header.replace(/^Bearer\s+/i, "").trim();
  // Publishable keys are not JWTs. Only a signed-in user's access token belongs here.
  if (!token.startsWith("eyJ")) return undefined;
  return `Bearer ${token}`;
}

export function createClientFromRequest(req: Request): BackendClient {
  const supabaseUrl = projectUrl();
  const authHeader = userJwt(req.headers.get("Authorization"));
  const cronSecret = Deno.env.get("CRON_SECRET")?.trim();
  const isCron = Boolean(cronSecret && req.headers.get("x-cron-secret") === cronSecret);

  const userClient = createClient(supabaseUrl, publishableKey(), {
    global: authHeader ? { headers: { Authorization: authHeader } } : undefined,
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const admin = serviceClient();

  let userPromise: Promise<BackendUser | null> | null = null;
  const loadUser = () => {
    if (!userPromise) {
      userPromise = (async () => {
        const { data, error } = await userClient.auth.getUser();
        if (error || !data.user) return null;
        const mapped = mapUser(data.user);
        await bindUserAiKey(mapped.id);
        return mapped;
      })();
    }
    return userPromise;
  };

  const ownerId = async () => (await loadUser())?.id ?? null;

  return {
    auth: {
      async me() {
        return loadUser();
      },
      async deleteCurrentUser() {
        const user = await loadUser();
        if (!user?.id) throw new Error("Unauthorized");
        const { error: recordsError } = await admin.from("app_records").delete().eq("owner_id", user.id);
        if (recordsError) throw new Error(recordsError.message);
        const { error: keyError } = await admin.from("user_api_keys").delete().eq("user_id", user.id);
        if (keyError) throw new Error(keyError.message);
        const { error } = await admin.auth.admin.deleteUser(user.id);
        if (error) throw new Error(error.message);
      },
    },
    entities: entityProxy(isCron ? admin : userClient, {
      ownerId,
      restrictListToOwner: !isCron,
    }),
    asServiceRole: {
      entities: entityProxy(admin, { ownerId, restrictListToOwner: false }),
    },
    integrations: {
      Core: {
        SendEmail: sendEmail,
        UploadFile: uploadFile,
      },
    },
  };
}
