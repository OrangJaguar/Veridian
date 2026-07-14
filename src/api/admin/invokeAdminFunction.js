import { base44 } from '@/api/base44Client';

/**
 * Invoke a Base44 admin function and unwrap the response body.
 * Throws with a readable message on HTTP or payload errors.
 */
export async function invokeAdminFunction(functionName, payload = {}) {
  let res;
  try {
    res = await base44.functions.invoke(functionName, payload);
  } catch (err) {
    const message = err?.data?.error?.message
      ?? err?.response?.data?.error?.message
      ?? err?.message
      ?? `${functionName} failed`;
    throw new Error(message);
  }

  if (res?.error?.message) {
    throw new Error(res.error.message);
  }

  return res?.data ?? res;
}
