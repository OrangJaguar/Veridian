/**
 * Barrel for provider-neutral adapters.
 * New feature UI must depend on these adapters (or domain API wrappers),
 * not on `@/api/base44Client` or `@base44/sdk`.
 */
export * from '@/api/adapters/authAdapter';
export * from '@/api/adapters/functionAdapter';
export * from '@/api/adapters/storageAdapter';
export * from '@/api/adapters/blogAdapter';
