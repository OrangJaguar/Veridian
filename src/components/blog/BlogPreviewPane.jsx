import { useMemo } from 'react';
import BlogBlockRenderer from '@/components/blog/BlogBlockRenderer';

/**
 * Desktop / mobile preview using the same renderer as the public article page.
 */
export default function BlogPreviewPane({ post, viewport = 'desktop' }) {
  const title = post?.title || 'Untitled';
  const blocks = useMemo(() => post?.blocks ?? [], [post?.blocks]);

  return (
    <div className={`blog-preview-pane blog-preview-pane--${viewport}`}>
      <div className="blog-preview-chrome">
        <span className="blog-preview-viewport-label">
          {viewport === 'mobile' ? 'Mobile preview' : 'Desktop preview'}
        </span>
      </div>
      <div className="blog-preview-frame">
        <header className="blog-preview-header">
          <h1 className="blog-preview-title">{title}</h1>
          {post?.description ? (
            <p className="blog-preview-description">{post.description}</p>
          ) : null}
          <p className="blog-preview-meta">
            {post?.author || 'Author'}
            {post?.readTimeMinutes ? ` · ${post.readTimeMinutes} min read` : ''}
          </p>
        </header>
        {post?.coverImageUrl ? (
          <img
            className="blog-preview-cover"
            src={post.coverImageUrl}
            alt={post.coverImageAlt || ''}
          />
        ) : null}
        <BlogBlockRenderer blocks={blocks} />
      </div>
    </div>
  );
}
