import { Link, useParams } from 'react-router-dom';
import { usePageMeta } from '@/hooks/usePageMeta';
import { usePublishedBlogPost } from '@/hooks/queries/useBlog';
import { getBlogPost, isBlogPostPublished } from '@/content/blog';
import BlogBlockRenderer from '@/components/blog/BlogBlockRenderer';
import BlogArticleBody from '@/components/blog/BlogArticleBody';
import VeridianLoading from '@/components/shared/VeridianLoading';
import NotFoundPage from '@/pages/NotFoundPage';
import { useEffect } from 'react';

function formatDate(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function injectBlogPostingJsonLd(post) {
  const existing = document.getElementById('blog-posting-jsonld');
  if (existing) existing.remove();
  if (!post) return;
  const script = document.createElement('script');
  script.id = 'blog-posting-jsonld';
  script.type = 'application/ld+json';
  script.text = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.metaDescription || post.description,
    author: { '@type': 'Person', name: post.author },
    datePublished: post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined,
    image: post.coverImageUrl || undefined,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://veridianstudy.base44.app/blog/${post.slug}`,
    },
  });
  document.head.appendChild(script);
}

export default function BlogPostPage() {
  const { slug } = useParams();
  const { data, isPending, isError, error } = usePublishedBlogPost(slug);

  const cmsPost = data?.post ?? null;
  const related = data?.related ?? [];
  const staticPost = getBlogPost(slug);
  const staticPublished = isBlogPostPublished(staticPost);

  const post = cmsPost ?? (staticPublished ? staticPost : null);
  const notFound = (!isPending && !cmsPost && !staticPublished)
    || (isError && error?.message === 'Not found' && !staticPublished);

  usePageMeta({
    title: post?.metaTitle || post?.title || 'Article',
    description: post?.metaDescription || post?.description,
    canonicalPath: post ? `/blog/${slug}` : undefined,
    noindex: !post,
    ogImage: post?.coverImageUrl || undefined,
  });

  useEffect(() => {
    injectBlogPostingJsonLd(cmsPost || (staticPublished ? staticPost : null));
    return () => {
      document.getElementById('blog-posting-jsonld')?.remove();
    };
  }, [cmsPost, staticPost, staticPublished]);

  if (isPending && !staticPublished) {
    return (
      <div className="blog-page">
        <VeridianLoading />
      </div>
    );
  }

  if (notFound || !post) {
    return <NotFoundPage />;
  }

  const useFlexibleBlocks = Boolean(cmsPost) || post.blocks?.some((b) => b.type !== 'p');

  return (
    <div className="blog-page blog-post-page">
      <nav className="blog-post-nav" aria-label="Blog">
        <Link to="/blog">← All articles</Link>
      </nav>
      <header className="blog-post-header">
        {post.category ? <p className="blog-post-category">{post.category}</p> : null}
        <h1 className="blog-post-title">{post.title}</h1>
        <p className="blog-post-meta">
          {post.author} · {formatDate(post.publishedAt)}
          {post.readTimeMinutes ? ` · ${post.readTimeMinutes} min read` : ''}
        </p>
        <p className="blog-post-dek">{post.description}</p>
      </header>

      {post.coverImageUrl ? (
        <img
          className="blog-post-cover"
          src={post.coverImageUrl}
          alt={post.coverImageAlt || ''}
        />
      ) : null}

      {useFlexibleBlocks ? (
        <BlogBlockRenderer blocks={post.blocks} />
      ) : (
        <BlogArticleBody blocks={post.blocks} floatImages={post.floatImages} />
      )}

      {related.length > 0 && (
        <section className="blog-related" aria-label="Related articles">
          <h2>Related reading</h2>
          <div className="blog-related-grid">
            {related.map((item) => (
              <Link key={item.slug} to={`/blog/${item.slug}`} className="blog-card">
                <h3 className="blog-card-title">{item.title}</h3>
                <p className="blog-card-description">{item.description}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
