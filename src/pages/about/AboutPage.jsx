import { Link } from 'react-router-dom';
import { usePageMeta } from '@/hooks/usePageMeta';

export default function AboutPage() {
  usePageMeta({
    title: 'About',
    description: 'Veridian helps students study smarter with spaced repetition, active recall, and AI-generated learning materials.',
  });

  return (
    <div className="about-page legal-page">
      <header className="about-page-header">
        <div className="about-page-header-row">
          <h1 className="about-page-title">About Veridian</h1>
          <p className="about-page-tagline library-page-lead">
            We take the friction out of studying
          </p>
        </div>
      </header>

      <section className="legal-section">
        <h2>Our mission</h2>
        <p>
          Studying should not mean guessing what to review or re-reading notes that never stick.
          Veridian combines spaced repetition, active recall, and AI-generated guides and quizzes
          into journeys you can follow from first lecture to final exam.
        </p>
      </section>

      <section className="legal-section">
        <h2>What makes Veridian different</h2>
        <ul className="legal-list">
          <li><strong>Journey-based structure</strong> — modules, activities, and a Due Today queue tied to your goals</li>
          <li><strong>Science-backed scheduling</strong> — reviews timed to fight the forgetting curve</li>
          <li><strong>AI that assists, not replaces</strong> — guides and quizzes built from your material, under your control</li>
          <li><strong>Community library</strong> — discover and clone journeys from other students and from Veridian Certified paths</li>
        </ul>
      </section>

      <section className="legal-section about-contact-section">
        <h2>Get in touch</h2>
        <p>
          Questions, feedback, or partnership ideas?{' '}
          <Link to="/feedback">Send us a message</Link> or email{' '}
          <a href="mailto:support.veridian@gmail.com">support.veridian@gmail.com</a>.
        </p>
        <div className="about-cta-wrap">
          <Link to="/signup" className="about-cta-pill">Get Started</Link>
        </div>
      </section>
    </div>
  );
}
