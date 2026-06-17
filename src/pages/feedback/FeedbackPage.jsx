import FeedbackWizard from '@/components/feedback/FeedbackWizard';
import { usePageMeta } from '@/hooks/usePageMeta';

export default function FeedbackPage() {
  usePageMeta({
    title: 'Feedback',
    description: 'Share bug reports, feature ideas, and general feedback with the Veridian team.',
  });
  return (
    <div className="feedback-page">
      <header className="feedback-page-header">
        <div className="feedback-page-header-copy">
          <h1 className="feedback-page-title">Feedback</h1>
          <p className="feedback-page-lead">
            Share a bug, idea, or general thought. We read every single response.
          </p>
        </div>
      </header>

      <FeedbackWizard />

      <p className="feedback-support-line">
        For other inquiries:{' '}
        <a href="mailto:support.veridian@gmail.com">support.veridian@gmail.com</a>
      </p>
    </div>
  );
}
