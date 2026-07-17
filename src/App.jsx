import { Routes, Route, Outlet, Navigate, useParams } from 'react-router-dom';
import MarketingLayout from '@/layouts/MarketingLayout';
import AppShell from '@/layouts/AppShell';
import LandingPage from '@/pages/landing/LandingPage';
import LearnPage from '@/pages/landing/LearnPage';
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
import FaqPage from '@/pages/faq/FaqPage';
import OnboardingPage from '@/pages/onboarding/OnboardingPage';
import OnboardingGate from '@/components/onboarding/OnboardingGate';
import ReviewMistakesPage from '@/pages/mistakes/ReviewMistakesPage';
import ConceptsPage from '@/pages/concepts/ConceptsPage';
import NotFoundPage from '@/pages/NotFoundPage';
import RequireAdmin from '@/components/routing/RequireAdmin';
import BaselineCheckPage from '@/pages/journeys/BaselineCheckPage';
import MaiSurveyPage from '@/pages/survey/MaiSurveyPage';
import DataDashboardPage, { ResearchDataRedirect } from '@/pages/admin/DataDashboardPage';
import ErrorsDashboardPage from '@/pages/admin/ErrorsDashboardPage';
import AdminJourneysPage from '@/pages/admin/AdminJourneysPage';
import AdminJourneyNewPage from '@/pages/admin/AdminJourneyNewPage';
import AdminJourneyEditorPage from '@/pages/admin/AdminJourneyEditorPage';
import AdminModuleEditorPage from '@/pages/admin/AdminModuleEditorPage';
import AdminBlogListPage from '@/pages/admin/AdminBlogListPage';
import AdminBlogEditorPage from '@/pages/admin/AdminBlogEditorPage';
import FeedbackPage from '@/pages/feedback/FeedbackPage';
import AiLimitPage from '@/pages/ai/AiLimitPage';
import { RedirectAdminJourney, RedirectAdminModule } from '@/components/routing/AdminLegacyRedirect';
import ProductAnalyticsTracker from '@/components/analytics/ProductAnalyticsTracker';

export default function App() {
  return (
    <>
      <ProductAnalyticsTracker />
      <Routes>
      <Route element={<MarketingLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/learn" element={<LearnPage />} />
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/blog" element={<BlogIndexPage />} />
        <Route path="/blog/:slug" element={<BlogPostPage />} />
        <Route path="/faq" element={<FaqPage />} />
      </Route>

      <Route element={<AppShell />}>
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/library" element={<LibraryPage />} />
        <Route path="/library/:journeyId" element={<LibraryPreviewPage />} />
        <Route path="/feedback" element={<FeedbackPage />} />
        <Route path="/ai-limit" element={<AiLimitPage />} />
        <Route path="/tools/*" element={<Navigate to="/home" replace />} />
        <Route path="/errors" element={<Navigate to="/admin/errors" replace />} />
        <Route path="/data" element={<Navigate to="/admin/data" replace />} />
        <Route path="/adminjourneys" element={<Navigate to="/admin/journeys" replace />} />
        <Route path="/adminjourneys/new" element={<Navigate to="/admin/journeys/new" replace />} />
        <Route path="/adminjourneys/:journeyId" element={<RedirectAdminJourney />} />
        <Route path="/adminjourneys/:journeyId/modules/:moduleId" element={<RedirectAdminModule />} />
        <Route
          path="/admin/errors"
          element={(
            <RequireAdmin>
              <ErrorsDashboardPage />
            </RequireAdmin>
          )}
        />
        <Route
          path="/admin/data"
          element={(
            <RequireAdmin>
              <DataDashboardPage />
            </RequireAdmin>
          )}
        />
        <Route
          path="/admin/journeys"
          element={(
            <RequireAdmin>
              <AdminJourneysPage />
            </RequireAdmin>
          )}
        />
        <Route
          path="/admin/journeys/new"
          element={(
            <RequireAdmin>
              <AdminJourneyNewPage />
            </RequireAdmin>
          )}
        />
        <Route
          path="/admin/journeys/:journeyId"
          element={(
            <RequireAdmin>
              <AdminJourneyEditorPage />
            </RequireAdmin>
          )}
        />
        <Route
          path="/admin/journeys/:journeyId/modules/:moduleId"
          element={(
            <RequireAdmin>
              <AdminModuleEditorPage />
            </RequireAdmin>
          )}
        />
        <Route
          path="/admin/blog"
          element={(
            <RequireAdmin>
              <AdminBlogListPage />
            </RequireAdmin>
          )}
        />
        <Route
          path="/admin/blog/:postId"
          element={(
            <RequireAdmin>
              <AdminBlogEditorPage />
            </RequireAdmin>
          )}
        />
        <Route
          path="/admin/research"
          element={(
            <RequireAdmin>
              <ResearchDataRedirect />
            </RequireAdmin>
          )}
        />
        <Route element={<OnboardingGate><Outlet /></OnboardingGate>}>
        <Route path="/home" element={<HomePage />} />
        <Route path="/journeys" element={<JourneysPage />} />
        <Route path="/journeys/new" element={<CreateJourneyPage />} />
        <Route path="/journeys/:id/diagnostic" element={<JourneyDiagnosticRedirect />} />
        <Route path="/mai-survey" element={<MaiSurveyPage />} />
        <Route path="/journeys/:id/modules/:moduleId/baseline" element={<BaselineCheckPage />} />
        <Route path="/journeys/:id" element={<JourneyDetailPage />} />
        <Route path="/journeys/:id/modules/:moduleId/decks/new" element={<CreateDeckPage />} />
        <Route path="/journeys/:id/modules/:moduleId/decks/:activityId/edit" element={<EditDeckPage />} />
        <Route path="/journeys/:id/modules/:moduleId" element={<ModuleDetailPage />} />
        <Route path="/study/:sessionId" element={<StudyShell />} />
        <Route path="/mistakes" element={<ReviewMistakesPage />} />
        <Route path="/concepts" element={<ConceptsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>

      <Route element={<MarketingLayout />}>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
    </>
  );
}

/** The journey-wide diagnostic was removed — old links land on the journey page. */
function JourneyDiagnosticRedirect() {
  const { id } = useParams();
  return <Navigate to={`/journeys/${id}`} replace />;
}
