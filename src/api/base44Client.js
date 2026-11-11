import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
  || import.meta.env.VITE_SUPABASE_ANON_KEY
  || '';

if (import.meta.env.DEV && (!supabaseUrl || !supabasePublishableKey)) {
  console.warn('[Veridian] Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to .env');
}

export const supabase = createClient(
  supabaseUrl || 'http://127.0.0.1:54321',
  supabasePublishableKey || 'sb_publishable_local',
  {
    auth: {
      detectSessionInUrl: true,
      persistSession: true,
      autoRefreshToken: true,
    },
  },
);

const PAGE_SIZE = 1000;
const FIELD_NAME = /^[A-Za-z_][A-Za-z0-9_]*$/;

function mapUser(user) {
  if (!user) return null;
  const role = user.app_metadata?.role === 'admin' ? 'admin' : 'user';
  return {
    id: user.id,
    email: user.email ?? '',
    full_name: user.user_metadata?.full_name ?? '',
    role,
  };
}

function toRecord(row) {
  const data = row?.data && typeof row.data === 'object' ? row.data : {};
  return {
    ...data,
    id: row.id,
    createdAt: data.createdAt ?? new Date(row.created_at).getTime(),
    updatedAt: data.updatedAt ?? new Date(row.updated_at).getTime(),
  };
}

function valuesEqual(left, right) {
  if (left === right) return true;
  if (typeof right === 'boolean' || typeof right === 'number') return String(left) === String(right);
  return false;
}

function matches(record, criteria) {
  return Object.entries(criteria).every(([key, value]) => {
    if (value === undefined) return true;
    return valuesEqual(record[key], value);
  });
}

function stripId(payload) {
  const next = { ...payload };
  delete next.id;
  return next;
}

async function currentUserId() {
  const { data } = await supabase.auth.getSession();
  return data.session?.user?.id ?? null;
}

async function fetchRecords(entity, criteria, { ownerId = null } = {}) {
  const rows = [];
  for (let from = 0; from < 5000; from += PAGE_SIZE) {
    let query = supabase.from('app_records').select('*').eq('entity', entity);
    if (ownerId) query = query.eq('owner_id', ownerId);
    for (const [key, value] of Object.entries(criteria)) {
      if (value === undefined || value === null || typeof value === 'object') continue;
      if (!FIELD_NAME.test(key)) continue;
      query = query.eq(`data->>${key}`, typeof value === 'boolean' ? String(value) : String(value));
    }
    const { data, error } = await query.order('id', { ascending: true }).range(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(error.message);
    const page = data ?? [];
    rows.push(...page.map(toRecord).filter((record) => matches(record, criteria)));
    if (page.length < PAGE_SIZE) break;
  }
  return rows;
}

function createEntityApi(entity) {
  return {
    async list() {
      const ownerId = await currentUserId();
      if (!ownerId) return [];
      return fetchRecords(entity, {}, { ownerId });
    },
    async filter(criteria = {}) {
      return fetchRecords(entity, criteria);
    },
    async create(payload) {
      const ownerId = await currentUserId();
      if (!ownerId) throw new Error('Sign in to save data.');
      const { data, error } = await supabase
        .from('app_records')
        .insert({ entity, owner_id: ownerId, data: stripId(payload ?? {}) })
        .select('*')
        .single();
      if (error) throw new Error(error.message);
      return toRecord(data);
    },
    async update(id, patch) {
      const { data: existing, error: readError } = await supabase
        .from('app_records')
        .select('*')
        .eq('id', id)
        .eq('entity', entity)
        .maybeSingle();
      if (readError) throw new Error(readError.message);
      if (!existing) throw new Error(`${entity} not found`);
      const merged = { ...(existing.data ?? {}), ...stripId(patch ?? {}) };
      const { data, error } = await supabase
        .from('app_records')
        .update({ data: merged })
        .eq('id', id)
        .eq('entity', entity)
        .select('*')
        .single();
      if (error) throw new Error(error.message);
      return toRecord(data);
    },
    async delete(id) {
      const { error } = await supabase.from('app_records').delete().eq('id', id).eq('entity', entity);
      if (error) throw new Error(error.message);
    },
  };
}

const entities = new Proxy({}, {
  get(_target, prop) {
    if (typeof prop !== 'string') return undefined;
    return createEntityApi(prop);
  },
});

function authError(error, fallback) {
  const message = error?.message || fallback;
  if (/invalid login credentials/i.test(message)) return new Error('Email or password is incorrect.');
  if (/already registered|already exists/i.test(message)) {
    return new Error('An account with this email already exists. Sign in instead.');
  }
  return new Error(message);
}

async function finishVerifiedSession(data) {
  const session = data?.session;
  if (!session?.access_token) {
    throw new Error('Verification failed — no session token returned. Please try again.');
  }
  return {
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    user: mapUser(session.user ?? data.user),
  };
}

const auth = {
  async me() {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return null;
    return mapUser(data.user);
  },
  async isAuthenticated() {
    const { data } = await supabase.auth.getSession();
    return Boolean(data.session?.user);
  },
  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw authError(error, 'Could not sign out.');
  },
  async loginViaEmailPassword(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) throw authError(error, 'Could not sign in.');
    return mapUser(data.user);
  },
  async register({ email, password, full_name }) {
    const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/signup` : undefined;
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { full_name },
        emailRedirectTo: redirectTo,
      },
    });
    if (error) throw authError(error, 'Could not create account.');
    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      throw new Error('An account with this email already exists. Sign in instead.');
    }
    return {
      user: mapUser(data.user),
      session: data.session,
      needsVerification: !data.session,
    };
  },
  async verifyOtp({ email, otpCode }) {
    let result = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: otpCode,
      type: 'signup',
    });
    if (result.error) {
      result = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: otpCode,
        type: 'email',
      });
    }
    if (result.error) throw authError(result.error, 'Invalid code. Try again.');
    return finishVerifiedSession(result.data);
  },
  async setToken() {
    const { data } = await supabase.auth.getSession();
    return data.session;
  },
  async resendOtp(email) {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email.trim(),
    });
    if (error) throw authError(error, 'Could not resend code.');
  },
  async updateMe({ full_name }) {
    const { data, error } = await supabase.auth.updateUser({
      data: { full_name },
    });
    if (error) throw authError(error, 'Could not update profile.');
    return mapUser(data.user);
  },
  async resetPasswordRequest(email) {
    const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/reset-password` : undefined;
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
    if (error) throw authError(error, 'Could not send reset email.');
  },
  async resetPassword({ newPassword }) {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw authError(error, 'Could not reset password. The link may have expired.');
    await supabase.auth.signOut();
  },
  async changePassword({ currentPassword, newPassword }) {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user?.email) throw new Error('Sign in again to change your password.');
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: userData.user.email,
      password: currentPassword,
    });
    if (signInError) throw new Error('Current password is incorrect.');
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw authError(error, 'Could not change password.');
  },
  async getSession() {
    const { data } = await supabase.auth.getSession();
    return data.session;
  },
  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback);
  },
};

async function invoke(functionName, payload) {
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;
  const headers = {
    'Content-Type': 'application/json',
    apikey: supabasePublishableKey,
  };
  // The publishable key is not a JWT. Only the signed-in user's access token goes on Authorization.
  if (accessToken?.startsWith('eyJ')) headers.Authorization = `Bearer ${accessToken}`;
  const response = await fetch(`${supabaseUrl}/functions/v1/${functionName}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload ?? {}),
  });
  const text = await response.text();
  let body = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = { message: text };
    }
  }
  if (!response.ok) {
    const err = new Error(body?.error?.message || body?.message || `${functionName} failed`);
    err.status = response.status;
    err.data = body;
    throw err;
  }
  return body;
}

export async function isUsernameTaken(candidate) {
  const { data, error } = await supabase.rpc('is_username_taken', { candidate });
  if (error) throw new Error(error.message);
  return Boolean(data);
}

export const base44 = {
  auth,
  entities,
  functions: { invoke },
};

export const PENDING_USERNAME_KEY = 'veridian_pending_username';
