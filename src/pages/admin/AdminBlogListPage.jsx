import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAdminBlogPosts } from '@/hooks/queries/useBlog';
import { useAdminBlogMutations } from '@/hooks/mutations/useAdminBlogMutations';
import VeridianLoading from '@/components/shared/VeridianLoading';

export default function AdminBlogListPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('');
  const [query, setQuery] = useState('');
  const { data, isPending } = useAdminBlogPosts({
    status: status || null,
    query,
  });
  const mutations = useAdminBlogMutations();
  const posts = data?.posts ?? [];

  const filtered = useMemo(() => posts, [posts]);

  const handleCreate = async () => {
    const result = await mutations.create.mutateAsync({
      title: 'Untitled post',
      slug: `untitled-${Date.now().toString(36)}`,
      author: 'Sanskar Gupta',
      description: 'Draft description for this post.',
      blocks: [{ type: 'p', content: 'Start writing…' }],
    });
    const postId = result?.post?.postId;
    if (postId) navigate(`/admin/blog/${postId}`);
  };

  if (isPending) return <VeridianLoading fullPage />;

  return (
    <div className="admin-blog-page">
      <header className="admin-blog-header">
        <div>
          <h1>Blog CMS</h1>
          <p>Create, publish, and archive Veridian articles.</p>
        </div>
        <div className="admin-blog-header-actions">
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => mutations.migrate.mutate({ dryRun: true })}>
            Check static parity
          </button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => mutations.migrate.mutate({ dryRun: false })}>
            Migrate static posts
          </button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => mutations.backup.mutate()}>
            Platform backup
          </button>
          <button type="button" className="btn btn-primary btn-sm" onClick={handleCreate}>
            New post
          </button>
        </div>
      </header>

      <div className="admin-blog-toolbar">
        <input
          className="blog-toolbar-input"
          placeholder="Search title or slug"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          className="blog-toolbar-input"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      <div className="admin-blog-table-wrap">
        <table className="admin-blog-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Status</th>
              <th>Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((post) => (
              <tr key={post.postId}>
                <td>
                  <Link to={`/admin/blog/${post.postId}`}>{post.title}</Link>
                  <div className="admin-blog-slug">/{post.slug}</div>
                </td>
                <td>{post.status}{post.featured ? ' · featured' : ''}</td>
                <td>{post.updatedAt ? new Date(post.updatedAt).toLocaleString() : '—'}</td>
                <td className="admin-blog-row-actions">
                  <button type="button" className="btn btn-ghost btn-xs" onClick={() => navigate(`/admin/blog/${post.postId}`)}>Edit</button>
                  <button type="button" className="btn btn-ghost btn-xs" onClick={() => mutations.duplicate.mutate(post.postId)}>Duplicate</button>
                  {post.status !== 'published' && (
                    <button type="button" className="btn btn-ghost btn-xs" onClick={() => mutations.publish.mutate(post.postId)}>Publish</button>
                  )}
                  {post.status === 'published' && (
                    <button type="button" className="btn btn-ghost btn-xs" onClick={() => mutations.archive.mutate(post.postId)}>Archive</button>
                  )}
                  {post.status === 'archived' && (
                    <button type="button" className="btn btn-ghost btn-xs" onClick={() => mutations.restore.mutate(post.postId)}>Restore</button>
                  )}
                  <button
                    type="button"
                    className="btn btn-ghost btn-xs"
                    onClick={() => {
                      if (window.confirm(`Delete “${post.title}”? This cannot be undone.`)) {
                        mutations.remove.mutate(post.postId);
                      }
                    }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="blog-empty">No posts match.</p>}
      </div>
    </div>
  );
}
