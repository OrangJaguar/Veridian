import { Link, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { usePageMeta } from '@/hooks/usePageMeta';
import { getBlogPost, isBlogPostPublished } from '@/content/blog';
import BlogArticleBody from '@/components/blog/BlogArticleBody';

export default function BlogPostPage() {
  const { slug } = useParams();
  const post = getBlogPost(slug);
  const published = isBlogPostPublished(post);

  usePageMeta({
    title: post?.metaTitle?.replace(' | Veridian', '') ?? 'Article',
    description: post?.metaDescription ?? post?.description ?? '',
    canonicalPath: published ? `/blog/${slug}` : undefined,
    noindex: !published,
  });

  if (!post) {
    return (
      <div className="blog-page">
        <p>Article not found.</p>
        <Link to="/blog">← Back to Blog</Link>
      </div>
    );
  }

  if (!published) {
    return (
      <div className="blog-page blog-post-page">
        <Link to="/blog" className="blog-back-link">← Blog</Link>
        <header className="blog-post-header">
          <span className="blog-card-badge">Coming soon</span>
          <h1 className="blog-post-title">{post.title}</h1>
          <p className="blog-post-lead">{post.description}</p>
        </header>
        <p className="blog-coming-soon-copy">This article is not published yet. Check back soon.</p>
      </div>
    );
  }

  const author = post.author ?? 'Sanskar Gupta';

  return (
    <div className="blog-page blog-post-page">
      <Link to="/blog" className="blog-back-link">← Blog</Link>
      <header className="blog-post-header">
        <h1 className="blog-post-title">{post.title}</h1>
        <div className="blog-post-byline">
          <p className="blog-post-author">By {author}</p>
          <p className="blog-post-meta">
            {format(new Date(post.publishedAt), 'MMMM d, yyyy')} · {post.readTimeMinutes} min read
          </p>
        </div>
      </header>
      <BlogArticleBody blocks={post.blocks} floatImages={post.floatImages} />
    </div>
  );
}
