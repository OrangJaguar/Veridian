import { spacedRepetition } from './posts/spaced-repetition';
import { apBiology } from './posts/ap-biology';
import { apChemistry } from './posts/ap-chemistry';
import { mcatBiochemistry } from './posts/mcat-biochemistry';
import { activeRecall } from './posts/active-recall';

export const BLOG_POSTS = [spacedRepetition, apBiology];

export const BLOG_UPCOMING = [apChemistry, mcatBiochemistry, activeRecall];

export function getBlogPost(slug) {
  const published = BLOG_POSTS.find((post) => post.slug === slug);
  if (published) return published;
  return BLOG_UPCOMING.find((post) => post.slug === slug) ?? null;
}

export function searchBlogPosts(query = '') {
  const q = query.trim().toLowerCase();
  const all = [...BLOG_POSTS, ...BLOG_UPCOMING];
  if (!q) return all;
  return all.filter((post) => (
    post.title.toLowerCase().includes(q)
    || post.description.toLowerCase().includes(q)
  ));
}

export function sortBlogPosts(posts, sortKey = 'newest') {
  const list = [...posts];
  if (sortKey === 'alpha') {
    return list.sort((a, b) => a.title.localeCompare(b.title));
  }
  return list.sort((a, b) => {
    if (a.comingSoon && !b.comingSoon) return 1;
    if (!a.comingSoon && b.comingSoon) return -1;
    return (b.publishedAt ?? 0) - (a.publishedAt ?? 0);
  });
}

export function isBlogPostPublished(post) {
  return post && !post.comingSoon && post.blocks?.length > 0;
}
