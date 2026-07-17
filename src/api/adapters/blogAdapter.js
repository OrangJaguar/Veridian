/**
 * Provider-neutral blog data access.
 * Public and admin UI import from here — not from the Base44 SDK.
 */
import { invokeBackendFunction } from '@/api/adapters/functionAdapter';

export async function listPublishedPosts({ category = null, featuredOnly = false } = {}) {
  return invokeBackendFunction('listPublishedBlogPosts', {
    category,
    featuredOnly,
  });
}

export async function getPublishedPost(slug) {
  return invokeBackendFunction('getPublishedBlogPost', { slug });
}

export async function adminListPosts({ status = null, query = '' } = {}) {
  return invokeBackendFunction('adminBlogPost', {
    action: 'list',
    status,
    query,
  });
}

export async function adminGetPost(postId) {
  return invokeBackendFunction('adminBlogPost', {
    action: 'get',
    postId,
  });
}

export async function adminCreatePost(payload) {
  return invokeBackendFunction('adminBlogPost', {
    action: 'create',
    ...payload,
  });
}

export async function adminUpdatePost(postId, patch) {
  return invokeBackendFunction('adminBlogPost', {
    action: 'update',
    postId,
    ...patch,
  });
}

export async function adminPublishPost(postId) {
  return invokeBackendFunction('adminBlogPost', {
    action: 'publish',
    postId,
  });
}

export async function adminArchivePost(postId) {
  return invokeBackendFunction('adminBlogPost', {
    action: 'archive',
    postId,
  });
}

export async function adminRestorePost(postId) {
  return invokeBackendFunction('adminBlogPost', {
    action: 'restore',
    postId,
  });
}

export async function adminDeletePost(postId) {
  return invokeBackendFunction('adminBlogPost', {
    action: 'delete',
    postId,
  });
}

export async function adminDuplicatePost(postId) {
  return invokeBackendFunction('adminBlogPost', {
    action: 'duplicate',
    postId,
  });
}

export async function adminPreviewPost(postId) {
  return invokeBackendFunction('adminBlogPost', {
    action: 'preview',
    postId,
  });
}

export async function migrateStaticBlogPosts({ dryRun = false, posts = [] } = {}) {
  return invokeBackendFunction('migrateStaticBlogPosts', { dryRun, posts });
}
