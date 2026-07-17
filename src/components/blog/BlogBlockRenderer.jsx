import { Link } from 'react-router-dom';
import { sanitizeBlocksForPublic } from '@/utils/schemas/blog';

function BlogImage({ block }) {
  return (
    <figure className="blog-block-image">
      <img
        src={block.url}
        alt={block.alt || ''}
        width={block.width || undefined}
        height={block.height || undefined}
        loading="lazy"
        decoding="async"
      />
      {block.caption ? <figcaption>{block.caption}</figcaption> : null}
    </figure>
  );
}

/**
 * Safe flexible block renderer shared by public article and admin preview.
 */
export default function BlogBlockRenderer({ blocks = [] }) {
  const safe = sanitizeBlocksForPublic(blocks);

  return (
    <article className="blog-article-body blog-block-renderer">
      {safe.map((block, index) => {
        const key = `${block.type}-${index}`;
        switch (block.type) {
          case 'p':
            return <p key={key}>{block.content}</p>;
          case 'h2':
            return <h2 key={key} className="blog-block-h2">{block.content}</h2>;
          case 'h3':
            return <h3 key={key} className="blog-block-h3">{block.content}</h3>;
          case 'image':
            return <BlogImage key={key} block={block} />;
          case 'ul':
            return (
              <ul key={key} className="blog-block-list">
                {block.items.map((item, i) => <li key={i}>{item}</li>)}
              </ul>
            );
          case 'ol':
            return (
              <ol key={key} className="blog-block-list">
                {block.items.map((item, i) => <li key={i}>{item}</li>)}
              </ol>
            );
          case 'quote':
            return (
              <blockquote key={key} className="blog-block-quote">
                <p>{block.content}</p>
                {block.attribution ? <cite>{block.attribution}</cite> : null}
              </blockquote>
            );
          case 'callout':
            return (
              <aside
                key={key}
                className={`blog-block-callout blog-block-callout--${block.tone || 'info'}`}
              >
                <p>{block.content}</p>
              </aside>
            );
          case 'divider':
            return <hr key={key} className="blog-block-divider" />;
          case 'cta':
            return (
              <div key={key} className="blog-block-cta">
                {block.description ? <p>{block.description}</p> : null}
                {block.href.startsWith('/') ? (
                  <Link to={block.href} className="btn btn-primary btn-sm">{block.label}</Link>
                ) : (
                  <a href={block.href} className="btn btn-primary btn-sm" rel="noopener noreferrer">
                    {block.label}
                  </a>
                )}
              </div>
            );
          default:
            return null;
        }
      })}
    </article>
  );
}
