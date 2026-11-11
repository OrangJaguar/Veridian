import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";
import { setRequestAiKey } from "./requestAiKey.ts";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function requireEnv(name: string): string {
  const value = Deno.env.get(name)?.trim();
  if (!value) throw new Error(`${name} is not configured.`);
  return value;
}

/** Supabase injects new keys as a JSON map, for example {"default":"sb_publishable_..."}. */
function injectedKey(dictionaryName: string, legacyName: string): string {
  const raw = Deno.env.get(dictionaryName)?.trim();
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      const preferred = parsed.default;
      if (typeof preferred === "string" && preferred.trim()) return preferred.trim();
      const first = Object.values(parsed).find((value) => typeof value === "string" && value.trim());
      if (typeof first === "string") return first.trim();
    } catch {
      // Fall through to the legacy variable.
    }
  }
  const legacy = Deno.env.get(legacyName)?.trim();
  if (legacy) return legacy;
  throw new Error(`${dictionaryName} is missing. Supabase injects this; do not add it as a secret.`);
}

export function projectUrl(): string {
  return requireEnv("SUPABASE_URL");
}

export function publishableKey(): string {
  return injectedKey("SUPABASE_PUBLISHABLE_KEYS", "SUPABASE_ANON_KEY");
}

export function secretKey(): string {
  return injectedKey("SUPABASE_SECRET_KEYS", "SUPABASE_SERVICE_ROLE_KEY");
}

export function serviceClient(): SupabaseClient {
  return createClient(projectUrl(), secretKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function requireEncryptionSecret(): string {
  const secret = Deno.env.get("KEY_ENCRYPTION_SECRET")?.trim() ?? "";
  if (secret.length < 16) {
    throw new Error("KEY_ENCRYPTION_SECRET is not configured on the server.");
  }
  return secret;
}

async function deriveKey(secret: string): Promise<CryptoKey> {
  const hash = await crypto.subtle.digest("SHA-256", encoder.encode(secret));
  return crypto.subtle.importKey("raw", hash, "AES-GCM", false, ["encrypt", "decrypt"]);
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export async function encryptApiKey(plain: string): Promise<{ ciphertext: string; iv: string }> {
  const key = await deriveKey(requireEncryptionSecret());
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoder.encode(plain));
  return {
    ciphertext: bytesToBase64(new Uint8Array(cipher)),
    iv: bytesToBase64(iv),
  };
}

async function decryptApiKey(ciphertext: string, iv: string): Promise<string> {
  const key = await deriveKey(requireEncryptionSecret());
  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: base64ToBytes(iv) },
    key,
    base64ToBytes(ciphertext),
  );
  return decoder.decode(plain);
}

export function assertNvidiaKey(apiKey: string) {
  const trimmed = apiKey.trim();
  if (!trimmed.startsWith("nvapi-") || trimmed.length < 20 || trimmed.length > 300 || /\s/.test(trimmed)) {
    throw new Error("Enter an NVIDIA API key from build.nvidia.com. It starts with nvapi-.");
  }
  return trimmed;
}

export async function saveUserApiKey(userId: string, apiKey: string) {
  const trimmed = assertNvidiaKey(apiKey);
  const encrypted = await encryptApiKey(trimmed);
  const { error } = await serviceClient().from("user_api_keys").upsert({
    user_id: userId,
    provider: "nvidia",
    ciphertext: encrypted.ciphertext,
    iv: encrypted.iv,
    last4: trimmed.slice(-4),
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
  setRequestAiKey(trimmed);
  return { configured: true, provider: "nvidia", last4: trimmed.slice(-4) };
}

export async function deleteUserApiKey(userId: string) {
  const { error } = await serviceClient().from("user_api_keys").delete().eq("user_id", userId);
  if (error) throw new Error(error.message);
  setRequestAiKey(null);
  return { configured: false, provider: "nvidia", last4: null };
}

export async function getUserApiKeyStatus(userId: string) {
  const { data, error } = await serviceClient()
    .from("user_api_keys")
    .select("last4, provider")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return {
    configured: Boolean(data?.last4),
    provider: data?.provider ?? "nvidia",
    last4: data?.last4 ?? null,
  };
}

/** Load the signed-in user's key into this request. Never logs the key. */
export async function bindUserAiKey(userId: string) {
  try {
    const { data, error } = await serviceClient()
      .from("user_api_keys")
      .select("ciphertext, iv")
      .eq("user_id", userId)
      .maybeSingle();
    if (error || !data?.ciphertext || !data?.iv) {
      setRequestAiKey(null);
      return;
    }
    setRequestAiKey(await decryptApiKey(data.ciphertext, data.iv));
  } catch (err) {
    setRequestAiKey(null);
    console.error("[ai-key] unavailable for this request");
    if (Deno.env.get("ENVIRONMENT") === "development") {
      console.error(err instanceof Error ? err.message : err);
    }
  }
}
