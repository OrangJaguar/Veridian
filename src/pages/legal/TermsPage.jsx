import LegalPageLayout from '@/pages/legal/LegalPageLayout';

export default function TermsPage() {
  return (
    <LegalPageLayout title="Terms of Service">
      <section className="legal-section">
        <h2>Agreement</h2>
        <p>
          By creating a Veridian account, you agree to these Terms of Service and confirm that you
          are at least <strong>13 years old</strong>.
        </p>
      </section>

      <section className="legal-section">
        <h2>Your content</h2>
        <p>
          You own the notes, uploads, and study materials you add to Veridian. You grant Veridian
          permission to process that content so we can generate study activities and schedules for you.
        </p>
      </section>

      <section className="legal-section">
        <h2>Our platform</h2>
        <p>
          Veridian owns the platform, software, and brand. These terms do not transfer ownership of
          Veridian to you.
        </p>
      </section>

      <section className="legal-section">
        <h2>AI-generated content</h2>
        <p>
          Veridian uses AI to generate learning guides, quizzes, and feedback. AI output may contain
          errors. It is a study aid — not a substitute for official course materials, textbooks, or
          instructor guidance.
        </p>
      </section>

      <section className="legal-section">
        <h2>No guaranteed outcomes</h2>
        <p>
          Veridian is designed to help you study more effectively, but we do not guarantee any
          specific grade, exam score, or educational outcome.
        </p>
      </section>

      <section className="legal-section">
        <h2>Prohibited conduct</h2>
        <p>You may not:</p>
        <ul className="legal-list">
          <li>Scrape or use automated tools to access the service without permission</li>
          <li>Impersonate another person or misrepresent your identity</li>
          <li>Upload content you do not have the rights to use</li>
          <li>Use the service to harm, harass, or threaten others</li>
        </ul>
      </section>

      <section className="legal-section">
        <h2>Disclaimer of warranties</h2>
        <p>
          Veridian is provided &quot;as is&quot; with no guarantee of uninterrupted or error-free
          service. We are not liable for data loss resulting from service interruptions.
        </p>
      </section>

      <section className="legal-section">
        <h2>Account termination</h2>
        <p>
          We may suspend or terminate accounts that violate these terms, abuse the service, or harm
          other users.
        </p>
      </section>

      <section className="legal-section">
        <h2>Governing law</h2>
        <p>These terms are governed by the laws of the State of Ohio.</p>
      </section>

      <section className="legal-section">
        <h2>Changes to these terms</h2>
        <p>
          Veridian may update these terms at any time. Continued use of the service after changes
          are posted constitutes acceptance of the updated terms.
        </p>
      </section>
    </LegalPageLayout>
  );
}
