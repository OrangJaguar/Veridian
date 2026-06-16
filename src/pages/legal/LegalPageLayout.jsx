import { Link } from 'react-router-dom';
import { LEGAL_CONTACT_EMAIL, LEGAL_LAST_UPDATED } from '@/lib/legal';

export default function LegalPageLayout({ title, children }) {
  return (
    <article className="legal-page">
      <div className="legal-page-inner">
        <p className="legal-updated">Last updated: {LEGAL_LAST_UPDATED}</p>
        <h1 className="legal-title">{title}</h1>
        {children}
        <footer className="legal-footer">
          <Link to="/">Back to Veridian</Link>
          {' · '}
          <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a>
        </footer>
      </div>
    </article>
  );
}
