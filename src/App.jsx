import { Routes, Route, Outlet } from 'react-router-dom';
import MarketingLayout from '@/layouts/MarketingLayout';
import AppShell from '@/layouts/AppShell';
import LandingPage from '@/pages/landing/LandingPage';
import SignInPage from '@/pages/auth/SignInPage';
import SignUpPage from '@/pages/auth/SignUpPage';
import LibraryPage from '@/pages/library/LibraryPage';
import LibraryPreviewPage from '@/pages/library/LibraryPreviewPage';
import SettingsPage from '@/pages/settings/SettingsPage';
import ProfilePage from '@/pages/profile/ProfilePage';
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage';
import HomePage from '@/pages/home/HomePage';
import JourneysPage from '@/pages/journeys/JourneysPage';
import CreateJourneyPage from '@/pages/journeys/CreateJourneyPage';
import DiagnosticPage from '@/pages/journeys/DiagnosticPage';
import JourneyDetailPage from '@/pages/journeys/JourneyDetailPage';
import ModuleDetailPage from '@/pages/journeys/ModuleDetailPage';
import CreateDeckPage from '@/pages/decks/CreateDeckPage';
import EditDeckPage from '@/pages/decks/EditDeckPage';
import StudyShell from '@/pages/study/StudyShell';
import PrivacyPage from '@/pages/legal/PrivacyPage';
import TermsPage from '@/pages/legal/TermsPage';
import AboutPage from '@/pages/about/AboutPage';
import BlogIndexPage from '@/pages/blog/BlogIndexPage';
import BlogPostPage from '@/pages/blog/BlogPostPage';
import OnboardingPage from '@/pages/onboarding/OnboardingPage';
import OnboardingGate from '@/components/onboarding/OnboardingGate';
import NotFoundPage from '@/pages/NotFoundPage';
import RequireAdmin from '@/components/routing/RequireAdmin';
import ErrorsDashboardPage from '@/pages/admin/ErrorsDashboardPage';
import DataDashboardPage from '@/pages/admin/DataDashboardPage';
import AdminJourneysPage from '@/pages/admin/AdminJourneysPage';
import AdminJourneyNewPage from '@/pages/admin/AdminJourneyNewPage';
import AdminJourneyEditorPage from '@/pages/admin/AdminJourneyEditorPage';
import AdminModuleEditorPage from '@/pages/admin/AdminModuleEditorPage';
import FeedbackPage from '@/pages/feedback/FeedbackPage';

export default function App() {
  return (
    <Routes>
      <Route element={<MarketingLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/blog" element={<BlogIndexPage />} />
        <Route path="/blog/:slug" element={<BlogPostPage />} />
      </Route>

      <Route element={<AppShell />}>
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/library" element={<LibraryPage />} />
        <Route path="/library/:journeyId" element={<LibraryPreviewPage />} />
        <Route path="/feedback" element={<FeedbackPage />} />
        <Route
          path="/errors"
          element={(
            <RequireAdmin>
              <ErrorsDashboardPage />
            </RequireAdmin>
          )}
        />
        <Route
          path="/data"
          element={(
            <RequireAdmin>
              <DataDashboardPage />
            </RequireAdmin>
          )}
        />
        <Route
          path="/adminjourneys"
          element={(
            <RequireAdmin>
              <AdminJourneysPage />
            </RequireAdmin>
          )}
        />
        <Route
          path="/adminjourneys/new"
          element={(
            <RequireAdmin>
              <AdminJourneyNewPage />
            </RequireAdmin>
          )}
        />
        <Route
          path="/adminjourneys/:journeyId"
          element={(
            <RequireAdmin>
              <AdminJourneyEditorPage />
            </RequireAdmin>
          )}
        />
        <Route
          path="/adminjourneys/:journeyId/modules/:moduleId"
          element={(
            <RequireAdmin>
              <AdminModuleEditorPage />
            </RequireAdmin>
          )}
        />
        <Route element={<OnboardingGate><Outlet /></OnboardingGate>}>
        <Route path="/home" element={<HomePage />} />
        <Route path="/journeys" element={<JourneysPage />} />
        <Route path="/journeys/new" element={<CreateJourneyPage />} />
        <Route path="/journeys/:id/diagnostic" element={<DiagnosticPage />} />
        <Route path="/journeys/:id" element={<JourneyDetailPage />} />
        <Route path="/journeys/:id/modules/:moduleId/decks/new" element={<CreateDeckPage />} />
        <Route path="/journeys/:id/modules/:moduleId/decks/:activityId/edit" element={<EditDeckPage />} />
        <Route path="/journeys/:id/modules/:moduleId" element={<ModuleDetailPage />} />
        <Route path="/study/:sessionId" element={<StudyShell />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>

      <Route element={<MarketingLayout />}>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
