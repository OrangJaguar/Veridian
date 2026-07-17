import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { usePageMeta } from '@/hooks/usePageMeta';
import { usePublishedBlogPosts } from '@/hooks/queries/useBlog';
import {
  BLOG_UPCOMING,
  searchBlogPosts,
  sortBlogPosts,
  isBlogPostPublished,
} from '@/content/blog';
import VeridianLoading from '@/components/shared/VeridianLoading';

function formatDate(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function BlogIndexPage() {
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');
  const [category, setCategory] = useState('');
  const { data, isPending, isError } = usePublishedBlogPosts();

  usePageMeta({
    title: 'Veridian Blog',
    description: 'Study science, exam prep, and how Veridian helps you learn with intention.',
    canonicalPath: '/blog',
  });

  const cmsPosts = data?.posts ?? [];
  const useCms = !isError && cmsPosts.length > 0;
  const categories = data?.categories ?? [];
  const featured = data?.featured ?? null;

  const staticList = useMemo(() => {
    const filtered = searchBlogPosts(search);
    return sortBlogPosts(filtered, sort);
  }, [search, sort]);

  const cmsList = useMemo(() => {
    let list = [...cmsPosts];
    if (category) list = list.filter((p) => p.category === category);
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((p) => (
        p.title.toLowerCase().includes(q)
        || p.description.toLowerCase().includes(q)
      ));
    }
    if (sort === 'alpha') {
      list.sort((a, b) => a.title.localeCompare(b.title));
    } else {
      list.sort((a, b) => (b.publishedAt ?? 0) - (a.publishedAt ?? 0));
    }
    return list;
  }, [cmsPosts, search, sort, category]);

  if (isPending && !useCms && !isError) {
    return (
      <div className="blog-page">
        <VeridianLoading />
      </div>
    );
  }

  const list = useCms ? cmsList : staticList;
  const showUpcoming = !useCms;

  return (
    <div className="blog-page">
      <header className="blog-page-header">
        <h1 className="blog-page-title">Veridian Blog</h1>
        <p className="blog-page-lead">
          Practical study science and exam prep written for students who want lasting recall.
        </p>
      </header>

      {useCms && featured && (
        <Link to={`/blog/${featured.slug}`} className="blog-featured-card">
          {featured.coverImageUrl ? (
            <img
              src={featured.coverImageUrl}
              alt={featured.coverImageAlt || ''}
              className="blog-featured-image"
            />
          ) : null}
          <div>
            <span className="blog-card-badge">Featured</span>
            <h2 className="blog-card-title">{featured.title}</h2>
            <p className="blog-card-description">{featured.description}</p>
            <p className="blog-card-meta">
              {featured.author} · {formatDate(featured.publishedAt)}
              {featured.readTimeMinutes ? ` · ${featured.readTimeMinutes} min` : ''}
            </p>
          </div>
        </Link>
      )}

      <div className="blog-toolbar">
        <input
          className="blog-toolbar-input blog-search-input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search articles"
          aria-label="Search blog articles"
        />
        {useCms && categories.length > 0 && (
          <select
            className="blog-toolbar-input blog-sort-select"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            aria-label="Filter by category"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        )}
        <div className="blog-sort-wrap">
          <select
            className="blog-toolbar-input blog-sort-select"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            aria-label="Sort articles"
          >
            <option value="newest">Newest</option>
            <option value="alpha">A–Z</option>
          </select>
        </div>
      </div>

      <div className="blog-grid">
        {list.map((post) => {
          if (!useCms && !isBlogPostPublished(post)) {
            return (
              <article key={post.slug} className="blog-card blog-card--upcoming" aria-label={`${post.title} coming soon`}>
                <span className="blog-card-badge">Coming soon</span>
                <h2 className="blog-card-title">{post.title}</h2>
                <p className="blog-card-description">{post.description}</p>
              </article>
            );
          }
          if (useCms && featured?.slug === post.slug) return null;
          return (
            <Link key={post.slug} to={`/blog/${post.slug}`} className="blog-card">
              {post.coverImageUrl ? (
                <img
                  src={post.coverImageUrl}
                  alt={post.coverImageAlt || ''}
                  className="blog-card-cover"
                  loading="lazy"
                />
              ) : null}
              {post.category ? <span className="blog-card-badge">{post.category}</span> : null}
              <h2 className="blog-card-title">{post.title}</h2>
              <p className="blog-card-description">{post.description}</p>
              <p className="blog-card-meta">
                {post.author} · {formatDate(post.publishedAt)}
                {post.readTimeMinutes ? ` · ${post.readTimeMinutes} min` : ''}
              </p>
            </Link>
          );
        })}
        {showUpcoming && BLOG_UPCOMING.filter((p) => !list.some((l) => l.slug === p.slug)).map((post) => (
          <article key={post.slug} className="blog-card blog-card--upcoming" aria-label={`${post.title} coming soon`}>
            <span className="blog-card-badge">Coming soon</span>
            <h2 className="blog-card-title">{post.title}</h2>
            <p className="blog-card-description">{post.description}</p>
          </article>
        ))}
      </div>

      {list.length === 0 && (
        <p className="blog-empty">No articles match your search.</p>
      )}
    </div>
  );
}
