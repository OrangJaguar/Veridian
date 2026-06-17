import { Fragment } from 'react';

function BlogImagePlaceholder({ align = 'right', caption }) {
  return (
    <figure className={`blog-article-image blog-article-image-${align}`}>
      <div className="blog-article-image-frame" aria-hidden="true" />
      {caption ? <figcaption>{caption}</figcaption> : null}
    </figure>
  );
}

function BlogArticleBody({ blocks = [], floatImages = [] }) {
  const imageByIndex = new Map(
    floatImages.map((img) => [img.afterIndex, img]),
  );

  const paragraphs = blocks.filter((block) => block.type === 'p');

  return (
    <article className="blog-article-body">
      {paragraphs.map((block, index) => {
        const image = imageByIndex.get(index);
        return (
          <Fragment key={index}>
            {image ? (
              <BlogImagePlaceholder
                align={image.side}
                caption={image.caption}
              />
            ) : null}
            <p>{block.content}</p>
          </Fragment>
        );
      })}
      <div className="blog-article-clear" aria-hidden="true" />
    </article>
  );
}

export default BlogArticleBody;
