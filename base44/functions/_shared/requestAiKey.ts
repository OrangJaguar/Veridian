import { AsyncLocalStorage } from "node:async_hooks";

type Store = { apiKey: string | null };

const storage = new AsyncLocalStorage<Store>();

export function runWithAiContext<T>(fn: () => T): T {
  return storage.run({ apiKey: null }, fn);
}

export function setRequestAiKey(key: string | null) {
  const store = storage.getStore();
  if (!store) return;
  store.apiKey = key?.trim() || null;
}

export function getRequestAiKey(): string {
  const key = storage.getStore()?.apiKey?.trim();
  if (!key) {
    throw new Error("Add your NVIDIA API key in Settings before using AI features.");
  }
  return key;
}
