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
          Veridian (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) is operated by Sanskar Gupta as an independent
          study application. This policy explains what we collect, why we collect it, how long we keep it,
          and your choices. This document is provided for transparency and is not legal advice.
        </p>
      </section>

      <section className="legal-section">
        <h2>What we collect</h2>
        <ul className="legal-list">
          <li><strong>Account info:</strong> email address, username, and password (stored securely by our auth provider).</li>
          <li><strong>Google sign-in (optional):</strong> if you sign in with Google OAuth, we receive your name, email address, and profile photo from Google to create and maintain your account. Google&apos;s use of your data is governed by <a href="https://policies.google.com/privacy" rel="noopener noreferrer" target="_blank">Google&apos;s Privacy Policy</a>.</li>
          <li><strong>Onboarding info (optional):</strong> study goals, grade level, country, and US state if you choose to share them.</li>
          <li><strong>Study content you create:</strong> journeys, modules, notes, flashcards, uploaded materials, and AI-generated learning guides and quizzes built from your content.</li>
          <li><strong>Study activity:</strong> session duration, quiz accuracy, hints used, mastery scores, and learning progress — used to power your study plan and product analytics.</li>
          <li><strong>Public library content (optional):</strong> if you publish a journey to the Community Library, its title, tags, modules, and metadata may be visible to other users.</li>
          <li><strong>Technical data:</strong> device/browser type, approximate usage timestamps, and error logs (see below) to keep the service running.</li>
          <li><strong>Research consent (optional):</strong> if you opt in, anonymized study patterns may be included in academic research.</li>
        </ul>
      </section>

      <section className="legal-section">
        <h2>How we use your data</h2>
        <ul className="legal-list">
          <li>To run the study system — scheduling reviews, generating practice, and tracking mastery.</li>
          <li>To enforce fair-use limits on AI features and protect the service from abuse.</li>
          <li>To diagnose bugs, monitor reliability, and improve Veridian based on aggregate usage.</li>
          <li>With your consent, to include anonymized, aggregate study patterns in academic research.</li>
        </ul>
        <p>We do not sell your personal data. We do not serve behavioral advertising.</p>
      </section>

      <section className="legal-section">
        <h2>AI processing</h2>
        <p>
          Veridian uses <strong>AI models</strong> to power AI features (learning guides, quizzes,
          flashcards, grading, and journey creation). Text and materials you submit may be transmitted to
          our AI provider to generate outputs. Generated content is stored in your Veridian account.
          We send only what is needed to provide the feature you requested.
        </p>
        <p>
          Do not submit sensitive personal information (Social Security numbers, financial account numbers,
          medical records, passwords, or other highly sensitive data) into AI features. You are responsible
          for the content you upload.
        </p>
      </section>

      <section className="legal-section">
        <h2>Third-party services</h2>
        <p>
          Veridian uses <strong>Base44</strong> for authentication, data storage, and app infrastructure.
          These providers process data on our behalf under their own terms and privacy policies. Service
          availability and security also depend on these providers.
        </p>
      </section>

      <section className="legal-section">
        <h2>Error logging</h2>
        <p>
          When the app encounters an error, we may log technical details (error message, route, browser type,
          and your account email if signed in) to diagnose problems. Logs are used for reliability, not
          marketing. Admin-only dashboards may display grouped error reports.
        </p>
      </section>

      <section className="legal-section">
        <h2>Cookies and local storage</h2>
        <p>
          Veridian uses essential cookies and browser storage to keep you signed in, remember preferences,
          and cache app data for performance. We do not use third-party advertising or cross-site tracking cookies.
        </p>
      </section>

      <section className="legal-section">
        <h2>Age requirement</h2>
        <p>
          You must be at least <strong>13 years old</strong> to create a Veridian account (or the minimum
          age required in your jurisdiction, if higher). By signing up, you confirm that you meet this
          requirement. We do not knowingly collect personal information from children under 13. If you
          believe a child has provided us data, contact us and we will delete it.
        </p>
      </section>

      <section className="legal-section">
        <h2>Data retention and deletion</h2>
        <p>
          We keep your data while your account is active. If you delete your account in Settings, we delete
          your app data (journeys, sessions, preferences, and related content) within <strong>30 days</strong>.
          Backups and auth-provider records may take additional time to purge. To request deletion of auth
          records, email{' '}
          <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a>.
        </p>
      </section>

      <section className="legal-section">
        <h2>Security</h2>
        <p>
          We use industry-standard practices available through our infrastructure providers (encrypted
          transport, access controls, and row-level security where configured). No online service is
          perfectly secure. You are responsible for keeping your login credentials confidential and for
          signing out on shared devices.
        </p>
      </section>

      <section className="legal-section">
        <h2>Your rights and choices</h2>
        <ul className="legal-list">
          <li>Update research consent and notification preferences in Settings.</li>
          <li>Delete your account and associated data in Settings → Delete account.</li>
          <li>Request a copy of or correction to your data by emailing us (we will respond within a reasonable time).</li>
          <li>California and similar jurisdictions: you may have additional rights to know, delete, or opt out of certain processing. Veridian does not sell personal information.</li>
        </ul>
      </section>

      <section className="legal-section">
        <h2>International users</h2>
        <p>
          Veridian is operated from the United States. If you use the service from another country, your
          data may be processed in the U.S. or where our service providers operate.
        </p>
      </section>

      <section className="legal-section">
        <h2>Changes to this policy</h2>
        <p>
          We may update this policy as the product evolves. Material changes will be reflected by updating
          the &quot;Last updated&quot; date. Continued use after changes means you accept the updated policy.
        </p>
      </section>

      <section className="legal-section">
        <h2>Contact</h2>
        <p>
          Questions about privacy:{' '}
          <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a>.
        </p>
      </section>
    </LegalPageLayout>
  );
}