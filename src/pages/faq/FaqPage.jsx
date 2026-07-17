import { useEffect, useId, useState } from 'react';
import { usePageMeta } from '@/hooks/usePageMeta';
import { FAQ_ITEMS, buildFaqJsonLd } from '@/content/faq/faqItems';

function FaqItem({ item, open, onToggle, panelId, buttonId }) {
  return (
    <div className="faq-item">
      <h2 className="faq-item-question">
        <button
          id={buttonId}
          type="button"
          className="faq-item-trigger"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={onToggle}
        >
          <span>{item.question}</span>
          <span className="faq-item-icon" aria-hidden="true">{open ? '−' : '+'}</span>
        </button>
      </h2>
      <div
        id={panelId}
        role="region"
        aria-labelledby={buttonId}
        hidden={!open}
        className="faq-item-panel"
      >
        <p>{item.answer}</p>
      </div>
    </div>
  );
}

export default function FaqPage() {
  const baseId = useId();
  const [openId, setOpenId] = useState(FAQ_ITEMS[0]?.id ?? null);

  usePageMeta({
    title: 'FAQ',
    description: 'Answers about Veridian being free forever, AI fair use, journeys, Due Today, and your data.',
    canonicalPath: '/faq',
  });

  useEffect(() => {
    const existing = document.getElementById('faq-jsonld');
    if (existing) existing.remove();
    const script = document.createElement('script');
    script.id = 'faq-jsonld';
    script.type = 'application/ld+json';
    script.text = JSON.stringify(buildFaqJsonLd());
    document.head.appendChild(script);
    return () => {
      document.getElementById('faq-jsonld')?.remove();
    };
  }, []);

  return (
    <div className="faq-page">
      <header className="faq-page-header">
        <h1 className="faq-page-title">FAQ</h1>
        <p className="faq-page-lead">
          Clear answers about free forever access, fair-use AI, studying with Veridian, and your data.
        </p>
      </header>

      <div className="faq-accordion">
        {FAQ_ITEMS.map((item) => (
          <FaqItem
            key={item.id}
            item={item}
            open={openId === item.id}
            onToggle={() => setOpenId((prev) => (prev === item.id ? null : item.id))}
            buttonId={`${baseId}-${item.id}-btn`}
            panelId={`${baseId}-${item.id}-panel`}
          />
        ))}
      </div>
    </div>
  );
}
