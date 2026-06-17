import { spacedRepetition } from './posts/spaced-repetition';
import { apBiology } from './posts/ap-biology';

export const BLOG_POSTS = [spacedRepetition, apBiology];

export function getBlogPost(slug) {
  return BLOG_POSTS.find((post) => post.slug === slug) ?? null;
}

export function searchBlogPosts(query = '') {
  const q = query.trim().toLowerCase();
  if (!q) return [...BLOG_POSTS];
  return BLOG_POSTS.filter((post) => (
    post.title.toLowerCase().includes(q)
    || post.description.toLowerCase().includes(q)
  ));
}

export function sortBlogPosts(posts, sortKey = 'newest') {
  const list = [...posts];
  if (sortKey === 'alpha') {
    return list.sort((a, b) => a.title.localeCompare(b.title));
  }
  return list.sort((a, b) => b.publishedAt - a.publishedAt);
}
