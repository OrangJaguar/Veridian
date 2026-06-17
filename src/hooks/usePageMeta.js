import { useEffect } from 'react';

const DEFAULT_DESCRIPTION = 'Veridian — study smarter with spaced repetition and AI-generated study materials.';

export function usePageMeta({ title, description = DEFAULT_DESCRIPTION } = {}) {
  useEffect(() => {
    const fullTitle = title ? `${title} | Veridian` : 'Veridian';
    document.title = fullTitle;

    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', description);

    return () => {
      document.title = 'Veridian';
    };
  }, [title, description]);
}
