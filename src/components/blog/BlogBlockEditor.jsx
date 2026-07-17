import { useState } from 'react';
import { BLOG_BLOCK_TYPES, slugifyTitle } from '@/utils/schemas/blog';
import { uploadBlogImage, listBlogAssets } from '@/api/adapters/storageAdapter';
import { toast } from 'sonner';

const EMPTY_BLOCKS = {
  p: () => ({ type: 'p', content: '' }),
  h2: () => ({ type: 'h2', content: '' }),
  h3: () => ({ type: 'h3', content: '' }),
  image: () => ({ type: 'image', url: '', alt: '', caption: '' }),
  ul: () => ({ type: 'ul', items: [''] }),
  ol: () => ({ type: 'ol', items: [''] }),
  quote: () => ({ type: 'quote', content: '', attribution: '' }),
  callout: () => ({ type: 'callout', content: '', tone: 'info' }),
  divider: () => ({ type: 'divider' }),
  cta: () => ({ type: 'cta', label: 'Get started', href: '/signup', description: '' }),
};

function moveItem(list, from, to) {
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

/**
 * Flexible blog block editor with reorder and media picker.
 */
export default function BlogBlockEditor({
  value,
  onChange,
}) {
  const post = value ?? {};
  const blocks = post.blocks ?? [];
  const [uploading, setUploading] = useState(false);
  const [assets, setAssets] = useState([]);
  const [showAssets, setShowAssets] = useState(false);

  const patch = (partial) => onChange({ ...post, ...partial });

  const setBlocks = (next) => patch({ blocks: next });

  const updateBlock = (index, nextBlock) => {
    const next = blocks.map((b, i) => (i === index ? nextBlock : b));
    setBlocks(next);
  };

  const addBlock = (type) => {
    const factory = EMPTY_BLOCKS[type] ?? EMPTY_BLOCKS.p;
    setBlocks([...blocks, factory()]);
  };

  const removeBlock = (index) => {
    setBlocks(blocks.filter((_, i) => i !== index));
  };

  const handleUpload = async (file, blockIndex = null) => {
    setUploading(true);
    try {
      const result = await uploadBlogImage({
        file,
        altText: file.name.replace(/\.[^.]+$/, ''),
      });
      const asset = result?.asset ?? result;
      if (blockIndex != null) {
        updateBlock(blockIndex, {
          ...blocks[blockIndex],
          type: 'image',
          url: asset.url,
          assetId: asset.assetId,
          alt: asset.altText || blocks[blockIndex].alt || 'Image',
        });
      } else {
        setBlocks([
          ...blocks,
          {
            type: 'image',
            url: asset.url,
            assetId: asset.assetId,
            alt: asset.altText || 'Image',
            caption: '',
          },
        ]);
      }
      toast.success('Image uploaded');
    } catch (err) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const loadAssets = async () => {
    try {
      const data = await listBlogAssets();
      setAssets(data?.assets ?? []);
      setShowAssets(true);
    } catch (err) {
      toast.error(err.message || 'Could not load assets');
    }
  };

  return (
    <div className="blog-block-editor">
      <div className="blog-editor-meta">
        <label>
          Title
          <input
            value={post.title ?? ''}
            onChange={(e) => {
              const title = e.target.value;
              const next = { title };
              if (!post.slugLocked) next.slug = slugifyTitle(title);
              patch(next);
            }}
          />
        </label>
        <label>
          Slug
          <input
            value={post.slug ?? ''}
            onChange={(e) => patch({ slug: e.target.value, slugLocked: true })}
          />
        </label>
        <label>
          Author
          <input
            value={post.author ?? ''}
            onChange={(e) => patch({ author: e.target.value })}
          />
        </label>
        <label>
          Description
          <textarea
            rows={2}
            value={post.description ?? ''}
            onChange={(e) => patch({ description: e.target.value })}
          />
        </label>
        <label>
          Category
          <input
            value={post.category ?? ''}
            onChange={(e) => patch({ category: e.target.value })}
          />
        </label>
        <label>
          Meta title
          <input
            value={post.metaTitle ?? ''}
            onChange={(e) => patch({ metaTitle: e.target.value })}
          />
        </label>
        <label>
          Meta description
          <textarea
            rows={2}
            value={post.metaDescription ?? ''}
            onChange={(e) => patch({ metaDescription: e.target.value })}
          />
        </label>
        <label className="blog-editor-check">
          <input
            type="checkbox"
            checked={Boolean(post.featured)}
            onChange={(e) => patch({ featured: e.target.checked })}
          />
          Featured on blog index
        </label>
        <label>
          Cover image URL
          <input
            value={post.coverImageUrl ?? ''}
            onChange={(e) => patch({ coverImageUrl: e.target.value })}
          />
        </label>
        <label>
          Cover image alt
          <input
            value={post.coverImageAlt ?? ''}
            onChange={(e) => patch({ coverImageAlt: e.target.value })}
          />
        </label>
      </div>

      <div className="blog-editor-blocks">
        <div className="blog-editor-toolbar">
          <span>Add block</span>
          {BLOG_BLOCK_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              className="btn btn-ghost btn-xs"
              onClick={() => addBlock(type)}
            >
              {type}
            </button>
          ))}
          <label className="btn btn-secondary btn-xs">
            {uploading ? 'Uploading…' : 'Upload image'}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              hidden
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUpload(file);
                e.target.value = '';
              }}
            />
          </label>
          <button type="button" className="btn btn-ghost btn-xs" onClick={loadAssets}>
            Reuse media
          </button>
        </div>

        {showAssets && (
          <div className="blog-asset-picker">
            {assets.length === 0 && <p>No assets yet.</p>}
            {assets.map((asset) => (
              <button
                key={asset.assetId}
                type="button"
                className="blog-asset-picker-item"
                onClick={() => {
                  setBlocks([
                    ...blocks,
                    {
                      type: 'image',
                      url: asset.url,
                      assetId: asset.assetId,
                      alt: asset.altText || 'Image',
                      caption: asset.caption || '',
                    },
                  ]);
                  setShowAssets(false);
                }}
              >
                <img src={asset.url} alt={asset.altText || ''} />
              </button>
            ))}
          </div>
        )}

        {blocks.map((block, index) => (
          <div key={index} className="blog-editor-block">
            <div className="blog-editor-block-header">
              <strong>{block.type}</strong>
              <div className="blog-editor-block-actions">
                <button type="button" className="btn btn-ghost btn-xs" onClick={() => setBlocks(moveItem(blocks, index, index - 1))}>Up</button>
                <button type="button" className="btn btn-ghost btn-xs" onClick={() => setBlocks(moveItem(blocks, index, index + 1))}>Down</button>
                <button type="button" className="btn btn-ghost btn-xs" onClick={() => removeBlock(index)}>Remove</button>
              </div>
            </div>

            {(block.type === 'p' || block.type === 'h2' || block.type === 'h3' || block.type === 'quote' || block.type === 'callout') && (
              <textarea
                rows={block.type === 'p' ? 4 : 2}
                value={block.content ?? ''}
                onChange={(e) => updateBlock(index, { ...block, content: e.target.value })}
              />
            )}
            {block.type === 'quote' && (
              <input
                placeholder="Attribution"
                value={block.attribution ?? ''}
                onChange={(e) => updateBlock(index, { ...block, attribution: e.target.value })}
              />
            )}
            {block.type === 'callout' && (
              <select
                value={block.tone ?? 'info'}
                onChange={(e) => updateBlock(index, { ...block, tone: e.target.value })}
              >
                <option value="info">Info</option>
                <option value="tip">Tip</option>
                <option value="warning">Warning</option>
              </select>
            )}
            {(block.type === 'ul' || block.type === 'ol') && (
              <textarea
                rows={4}
                value={(block.items ?? []).join('\n')}
                onChange={(e) => updateBlock(index, {
                  ...block,
                  items: e.target.value.split('\n').filter((line) => line.length > 0),
                })}
                placeholder="One item per line"
              />
            )}
            {block.type === 'image' && (
              <div className="blog-editor-image-fields">
                <input
                  placeholder="Image URL"
                  value={block.url ?? ''}
                  onChange={(e) => updateBlock(index, { ...block, url: e.target.value })}
                />
                <input
                  placeholder="Alt text (required)"
                  value={block.alt ?? ''}
                  onChange={(e) => updateBlock(index, { ...block, alt: e.target.value })}
                />
                <input
                  placeholder="Caption"
                  value={block.caption ?? ''}
                  onChange={(e) => updateBlock(index, { ...block, caption: e.target.value })}
                />
                <label className="btn btn-secondary btn-xs">
                  Replace file
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    hidden
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUpload(file, index);
                      e.target.value = '';
                    }}
                  />
                </label>
              </div>
            )}
            {block.type === 'cta' && (
              <div className="blog-editor-image-fields">
                <input
                  placeholder="Label"
                  value={block.label ?? ''}
                  onChange={(e) => updateBlock(index, { ...block, label: e.target.value })}
                />
                <input
                  placeholder="Href"
                  value={block.href ?? ''}
                  onChange={(e) => updateBlock(index, { ...block, href: e.target.value })}
                />
                <input
                  placeholder="Description"
                  value={block.description ?? ''}
                  onChange={(e) => updateBlock(index, { ...block, description: e.target.value })}
                />
              </div>
            )}
            {block.type === 'divider' && <p className="blog-editor-divider-note">Horizontal rule</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
