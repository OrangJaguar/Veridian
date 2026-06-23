import LegalPageLayout from '@/pages/legal/LegalPageLayout';
import { LEGAL_CONTACT_EMAIL } from '@/lib/legal';

export default function TermsPage() {
  return (
    <LegalPageLayout
      title="Terms of Service"
      description="Terms governing your use of Veridian, including user content, AI-generated study materials, and limitations of liability."
    >
      <section className="legal-section">
        <h2>Agreement</h2>
        <p>
          By creating a Veridian account or using the service, you agree to these Terms of Service and
          our Privacy Policy. You confirm that you are at least <strong>13 years old</strong> (or the
          minimum age required in your jurisdiction). If you do not agree, do not use Veridian.
        </p>
        <p>
          These terms are written for a small, independently operated application. They are not a
          substitute for advice from a licensed attorney.
        </p>
      </section>

      <section className="legal-section">
        <h2>The service</h2>
        <p>
          Veridian provides study planning tools, spaced repetition scheduling, AI-generated learning
          materials, and community-shared journeys. Features may change, break, or be removed at any time
          without notice. We do not guarantee uninterrupted availability.
        </p>
      </section>

      <section className="legal-section">
        <h2>Your content</h2>
        <p>
          You retain ownership of notes, uploads, and study materials you add to Veridian. You grant us a
          non-exclusive license to store, process, and display your content solely to operate the service
          — including sending portions to AI providers to generate study activities for you.
        </p>
        <p>
          You represent that you have the right to upload and use any content you submit, and that it does
          not infringe anyone else&apos;s copyright, trademark, or privacy rights.
        </p>
      </section>

      <section className="legal-section">
        <h2>Public and community content</h2>
        <p>
          If you publish a journey to the Community Library, you grant other users permission to view and
          clone it for personal study. You may not publish content you do not have rights to share. We may
          remove public content that violates these terms or receives valid copyright complaints.
        </p>
      </section>

      <section className="legal-section">
        <h2>AI-generated content</h2>
        <p>
          Veridian uses AI to generate learning guides, quizzes, flashcards, and feedback. AI output may
          be incomplete, outdated, or wrong — including factual errors, hallucinations, and biased phrasing.
          It is a study aid only, not a substitute for official course materials, textbooks, instructors,
          licensed tutors, or professional advice.
        </p>
        <p>
          You are responsible for verifying important information and for how you use generated content in
          academic, professional, or exam settings.
        </p>
      </section>

      <section className="legal-section">
        <h2>Academic integrity</h2>
        <p>
          You are responsible for complying with your school, employer, or exam board&apos;s honor code and
          rules. Do not use Veridian to cheat, misrepresent authorship, or violate policies on permitted
          study tools. We are not responsible for disciplinary action taken by third parties.
        </p>
      </section>

      <section className="legal-section">
        <h2>Acceptable use</h2>
        <p>You agree not to:</p>
        <ul className="legal-list">
          <li>Scrape, crawl, or use automated tools to access the service without permission</li>
          <li>Attempt to bypass authentication, rate limits, or AI usage quotas</li>
          <li>Probe or attack the service (including injection attacks, spam, or denial-of-service attempts)</li>
          <li>Upload malware, illegal content, or content that harasses, threatens, or exploits others</li>
          <li>Impersonate another person or misrepresent your identity</li>
          <li>Reverse-engineer or resell the service without authorization</li>
          <li>Use the service in a way that could harm Veridian, other users, or third-party providers</li>
        </ul>
      </section>

      <section className="legal-section">
        <h2>AI usage limits</h2>
        <p>
          Free AI features are subject to daily limits to keep the service sustainable. Limits may change
          without notice. Attempting to circumvent limits may result in suspension.
        </p>
      </section>

      <section className="legal-section">
        <h2>No guaranteed outcomes</h2>
        <p>
          Veridian is designed to help you study more effectively, but we do not guarantee any specific
          grade, exam score, admission result, or educational outcome. Your results depend on your effort,
          starting point, and many factors outside our control.
        </p>
      </section>

      <section className="legal-section">
        <h2>Disclaimer of warranties</h2>
        <p>
          VERIDIAN IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND,
          WHETHER EXPRESS OR IMPLIED, INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
          PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE ERROR-FREE,
          SECURE, OR UNINTERRUPTED, OR THAT AI OUTPUT WILL BE ACCURATE OR COMPLETE.
        </p>
      </section>

      <section className="legal-section">
        <h2>Limitation of liability</h2>
        <p>
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, VERIDIAN AND ITS OPERATOR WILL NOT BE LIABLE FOR ANY
          INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR FOR ANY LOSS OF DATA,
          PROFITS, GOODWILL, OR ACADEMIC OPPORTUNITIES, ARISING FROM YOUR USE OF THE SERVICE — EVEN IF WE
          HAVE BEEN ADVISED OF THE POSSIBILITY.
        </p>
        <p>
          OUR TOTAL LIABILITY FOR ANY CLAIM RELATED TO THE SERVICE IS LIMITED TO THE GREATER OF (A) THE
          AMOUNT YOU PAID US IN THE TWELVE MONTHS BEFORE THE CLAIM, OR (B) FIFTY U.S. DOLLARS ($50).
          BECAUSE THE SERVICE IS FREE FOR MOST USERS, THIS LIMIT WILL OFTEN BE $50.
        </p>
      </section>

      <section className="legal-section">
        <h2>Indemnification</h2>
        <p>
          You agree to defend, indemnify, and hold harmless Veridian and its operator from claims, damages,
          and expenses (including reasonable legal fees) arising from your content, your misuse of the
          service, or your violation of these terms or any third party&apos;s rights.
        </p>
      </section>

      <section className="legal-section">
        <h2>Account termination</h2>
        <p>
          You may delete your account at any time in Settings. We may suspend or terminate accounts that
          violate these terms, abuse the service, create legal or security risk, or harm other users —
          with or without notice where permitted by law.
        </p>
      </section>

      <section className="legal-section">
        <h2>Copyright complaints</h2>
        <p>
          If you believe content on Veridian infringes your copyright, email{' '}
          <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a>{' '}
          with a description of the work, the infringing material, and your contact information. We will
          review and respond as appropriate.
        </p>
      </section>

      <section className="legal-section">
        <h2>Governing law and disputes</h2>
        <p>
          These terms are governed by the laws of the State of Ohio, USA, without regard to conflict-of-law
          rules. Any dispute arising from these terms or the service shall be brought in the state or
          federal courts located in Ohio, and you consent to their jurisdiction.
        </p>
      </section>

      <section className="legal-section">
        <h2>Changes to these terms</h2>
        <p>
          We may update these terms at any time. Continued use after the &quot;Last updated&quot; date
          changes constitutes acceptance of the revised terms. If you do not agree, stop using the service
          and delete your account.
        </p>
      </section>

      <section className="legal-section">
        <h2>Contact</h2>
        <p>
          Questions about these terms:{' '}
          <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a>.
        </p>
      </section>
    </LegalPageLayout>
  );
}
