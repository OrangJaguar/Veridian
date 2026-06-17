import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';

export const PERSIST_CACHE_KEY = 'veridian-query-cache';
export const PERSIST_CACHE_BUSTER = 'phase2-v1';

export const persistableQueryKeys = new Set([
  'journeys',
  'modules',
  'activities',
  'cards',
  'dueToday',
  'preferences',
  'studyPlan',
]);

export function shouldPersistQuery(query) {
  const root = query.queryKey?.[0];
  return typeof root === 'string' && persistableQueryKeys.has(root);
}

export const asyncStoragePersister = createAsyncStoragePersister({
  storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  key: PERSIST_CACHE_KEY,
});
