/**
 * Provider-neutral backend function invoke.
 * Feature modules call this instead of base44.functions.invoke.
 */
import { base44 } from '@/api/base44Client';

export async function invokeBackendFunction(functionName, payload = {}) {
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
