import { Link, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { usePageMeta } from '@/hooks/usePageMeta';
import { getBlogPost } from '@/content/blog';
import BlogArticleBody from '@/components/blog/BlogArticleBody';

export default function BlogPostPage() {
  const { slug } = useParams();
  const post = getBlogPost(slug);

  usePageMeta({
    title: post?.metaTitle?.replace(' | Veridian', '') ?? 'Article',
    description: post?.metaDescription ?? '',
  });

  if (!post) {
    return (
      <div className="blog-page">
        <p>Article not found.</p>
        <Link to="/blog">← Back to Blog</Link>
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
