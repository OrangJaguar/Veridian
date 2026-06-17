import LegalPageLayout from '@/pages/legal/LegalPageLayout';
import { LEGAL_CONTACT_EMAIL } from '@/lib/legal';

export default function PrivacyPage() {
  return (
    <LegalPageLayout
      title="Privacy Policy"
      description="What data Veridian collects, how we use Google OAuth and AI features, and your privacy choices."
    >
      <section className="legal-section">
        <h2>Overview</h2>
        <p>
          Veridian is a study app that helps you learn from your own material using spaced repetition
          and active recall. This policy explains what we collect, why we collect it, and your choices.
        </p>
      </section>

      <section className="legal-section">
        <h2>What we collect</h2>
        <ul className="legal-list">
          <li><strong>Account info:</strong> email address, username, and password (stored securely by our auth provider).</li>
          <li><strong>Google sign-in (optional):</strong> if you sign in with Google OAuth, we receive your name, email address, and profile photo from Google to create and maintain your account. Google&apos;s use of your data is governed by <a href="https://policies.google.com/privacy" rel="noopener noreferrer" target="_blank">Google&apos;s Privacy Policy</a>.</li>
          <li><strong>Onboarding info (optional):</strong> study goals, grade level, country, and US state if you choose to share them.</li>
          <li><strong>Study content you create:</strong> journeys, modules, notes, flashcards, uploaded materials, and AI-generated learning guides and quizzes built from your content.</li>
          <li><strong>Study activity:</strong> session duration, quiz accuracy, hints used, and learning progress — used to power your study plan.</li>
          <li><strong>Research consent (optional):</strong> if you opt in, anonymized study patterns may be included in academic research.</li>
        </ul>
      </section>

      <section className="legal-section">
        <h2>How we use your data</h2>
        <ul className="legal-list">
          <li>To run the study system — scheduling reviews, generating practice, and tracking mastery.</li>
          <li>To improve Veridian based on how the product is used.</li>
          <li>With your consent, to include anonymized, aggregate study patterns in academic research.</li>
        </ul>
        <p>We do not sell your data. We do not serve behavioral advertising.</p>
      </section>

      <section className="legal-section">
        <h2>Third-party services</h2>
        <p>
          Veridian uses <strong>Base44</strong> for data storage and app infrastructure, and{' '}
          <strong>Google Gemini</strong> to power AI features like learning guide generation,
          quiz creation, and study feedback. Text you provide (notes, flashcard content, quiz answers,
          and conversation messages) may be sent to Gemini to generate study materials. Generated
          output is stored in your Veridian account. Only the content necessary to provide these
          features is transmitted. Both services have their own privacy policies that apply to
          their processing.
        </p>
      </section>

      <section className="legal-section">
        <h2>Cookies</h2>
        <p>
          Veridian uses essential cookies to keep users signed in and does not use tracking or
          advertising cookies.
        </p>
      </section>

      <section className="legal-section">
        <h2>Age requirement</h2>
        <p>
          You must be at least <strong>13 years old</strong> to create a Veridian account. By signing up,
          you confirm that you meet this requirement.
        </p>
      </section>

      <section className="legal-section">
        <h2>Data retention</h2>
        <p>
          We keep your data while your account is active. If you request account deletion, we delete
          your personal data within <strong>30 days</strong>.
        </p>
      </section>

      <section className="legal-section">
        <h2>Your choices</h2>
        <p>
          You can update research consent in Settings. Usernames can be changed once every six months.
          To delete your account, use Settings → Delete account (removes all app data).
          For auth record removal, email us at{' '}
          <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a>.
        </p>
      </section>
    </LegalPageLayout>
  );
}
