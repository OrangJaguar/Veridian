import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { usePageMeta } from '@/hooks/usePageMeta';
import { BLOG_POSTS, BLOG_UPCOMING, searchBlogPosts, sortBlogPosts, isBlogPostPublished } from '@/content/blog';
import { format } from 'date-fns';

export default function BlogIndexPage() {
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');

  usePageMeta({
    title: 'Study tips & exam prep guides',
    description: 'Evidence-based study advice for AP, college, pre-med, and MCAT prep — spaced repetition, active recall, and structured learning plans.',
    canonicalPath: '/blog',
  });

  const posts = useMemo(() => {
    const filtered = searchBlogPosts(search);
    return sortBlogPosts(filtered, sort);
  }, [search, sort]);

  return (
    <div className="blog-page">
      <header className="blog-page-header">
        <h1 className="blog-page-title">Veridian Blog</h1>
        <p className="blog-page-lead">
          Evidence-based study advice and practical guides for exam prep.
        </p>
      </header>

      <div className="blog-toolbar">
        <input
          type="search"
          className="blog-toolbar-input blog-search-input"
          placeholder="Search articles…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search blog articles"
        />
        <div className="blog-sort-wrap">
          <select
            className="blog-toolbar-input blog-sort-select"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            aria-label="Sort articles"
          >
            <option value="newest">Newest first</option>
            <option value="alpha">Alphabetical</option>
          </select>
        </div>
      </div>

      <div className="blog-grid">
        {posts.map((post) => {
          if (!isBlogPostPublished(post)) {
            return (
              <article key={post.slug} className="blog-card blog-card--upcoming" aria-label={`${post.title} — coming soon`}>
                <span className="blog-card-badge">Coming soon</span>
                <h2 className="blog-card-title">{post.title}</h2>
                <p className="blog-card-description">{post.description}</p>
              </article>
            );
          }

          return (
            <Link key={post.slug} to={`/blog/${post.slug}`} className="blog-card">
              <h2 className="blog-card-title">{post.title}</h2>
              <p className="blog-card-description">{post.description}</p>
              <p className="blog-card-meta">
                {format(new Date(post.publishedAt), 'MMM d, yyyy')} · {post.readTimeMinutes} min read
              </p>
            </Link>
          );
        })}
      </div>

      {posts.length === 0 && (
        <p className="blog-empty">No articles match your search.</p>
      )}

      {!search && BLOG_UPCOMING.length > 0 && BLOG_POSTS.length > 0 && (
        <p className="blog-upcoming-note">
          {BLOG_UPCOMING.length} more guide{BLOG_UPCOMING.length === 1 ? '' : 's'} in progress — titles shown above.
        </p>
      )}
    </div>
  );
}
