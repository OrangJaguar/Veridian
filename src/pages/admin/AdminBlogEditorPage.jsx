import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAdminBlogPost } from '@/hooks/queries/useBlog';
import { useAdminBlogMutations } from '@/hooks/mutations/useAdminBlogMutations';
import BlogBlockEditor from '@/components/blog/BlogBlockEditor';
import BlogPreviewPane from '@/components/blog/BlogPreviewPane';
import VeridianLoading from '@/components/shared/VeridianLoading';
import { validateForPublish } from '@/utils/schemas/blog';

export default function AdminBlogEditorPage() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { data, isPending } = useAdminBlogPost(postId);
  const mutations = useAdminBlogMutations();
  const [draft, setDraft] = useState(null);
  const [viewport, setViewport] = useState('desktop');
  const [showPreview, setShowPreview] = useState(true);

  useEffect(() => {
    if (data?.post) {
      setDraft({ ...data.post, slugLocked: true });
    }
  }, [data?.post]);

  if (isPending || !draft) return <VeridianLoading fullPage />;

  const validation = validateForPublish(draft);

  const save = () => mutations.update.mutate({
    postId,
    patch: {
      title: draft.title,
      slug: draft.slug,
      author: draft.author,
      description: draft.description,
      metaTitle: draft.metaTitle,
      metaDescription: draft.metaDescription,
      category: draft.category,
      featured: draft.featured,
      coverImageUrl: draft.coverImageUrl,
      coverImageAlt: draft.coverImageAlt,
      blocks: draft.blocks,
      tags: draft.tags,
    },
  });

  return (
    <div className="admin-blog-editor-page">
      <header className="admin-blog-editor-header">
        <div>
          <Link to="/admin/blog" className="admin-blog-back">← Blog list</Link>
          <h1>{draft.title || 'Edit post'}</h1>
          <p>Status: {draft.status}</p>
        </div>
        <div className="admin-blog-header-actions">
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowPreview((v) => !v)}>
            {showPreview ? 'Hide preview' : 'Show preview'}
          </button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={save} disabled={mutations.update.isPending}>
            Save
          </button>
          {draft.status !== 'published' && (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              disabled={!validation.ok || mutations.publish.isPending}
              onClick={async () => {
                await mutations.update.mutateAsync({
                  postId,
                  patch: {
                    title: draft.title,
                    slug: draft.slug,
                    author: draft.author,
                    description: draft.description,
                    metaTitle: draft.metaTitle,
                    metaDescription: draft.metaDescription,
                    category: draft.category,
                    featured: draft.featured,
                    coverImageUrl: draft.coverImageUrl,
                    coverImageAlt: draft.coverImageAlt,
                    blocks: draft.blocks,
                  },
                });
                await mutations.publish.mutateAsync(postId);
              }}
            >
              Publish
            </button>
          )}
          {draft.status === 'published' && (
            <a className="btn btn-secondary btn-sm" href={`/blog/${draft.slug}`} target="_blank" rel="noreferrer">
              View live
            </a>
          )}
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => {
              if (window.confirm('Delete this post permanently?')) {
                mutations.remove.mutate(postId, {
                  onSuccess: () => navigate('/admin/blog'),
                });
              }
            }}
          >
            Delete
          </button>
        </div>
      </header>

      {!validation.ok && (
        <ul className="admin-blog-validation">
          {validation.issues.map((issue) => <li key={issue}>{issue}</li>)}
        </ul>
      )}

      <div className={`admin-blog-editor-layout${showPreview ? '' : ' no-preview'}`}>
        <BlogBlockEditor value={draft} onChange={setDraft} />
        {showPreview && (
          <div className="admin-blog-preview-col">
            <div className="admin-blog-preview-toggle">
              <button
                type="button"
                className={`btn btn-xs ${viewport === 'desktop' ? 'btn-secondary' : 'btn-ghost'}`}
                onClick={() => setViewport('desktop')}
              >
                Desktop
              </button>
              <button
                type="button"
                className={`btn btn-xs ${viewport === 'mobile' ? 'btn-secondary' : 'btn-ghost'}`}
                onClick={() => setViewport('mobile')}
              >
                Mobile
              </button>
            </div>
            <BlogPreviewPane post={draft} viewport={viewport} />
          </div>
        )}
      </div>
    </div>
  );
}
