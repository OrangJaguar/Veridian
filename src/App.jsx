import { Routes, Route, Outlet, Navigate } from 'react-router-dom';
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
import BaselineCheckPage from '@/pages/journeys/BaselineCheckPage';
import MaiSurveyPage from '@/pages/survey/MaiSurveyPage';
import ResearchDataPage from '@/pages/admin/ResearchDataPage';
import ErrorsDashboardPage from '@/pages/admin/ErrorsDashboardPage';
import DataDashboardPage from '@/pages/admin/DataDashboardPage';
import AdminJourneysPage from '@/pages/admin/AdminJourneysPage';
import AdminJourneyNewPage from '@/pages/admin/AdminJourneyNewPage';
import AdminJourneyEditorPage from '@/pages/admin/AdminJourneyEditorPage';
import AdminModuleEditorPage from '@/pages/admin/AdminModuleEditorPage';
import FeedbackPage from '@/pages/feedback/FeedbackPage';
import AiLimitPage from '@/pages/ai/AiLimitPage';
import { RedirectAdminJourney, RedirectAdminModule } from '@/components/routing/AdminLegacyRedirect';
import ProductAnalyticsTracker from '@/components/analytics/ProductAnalyticsTracker';
import ToolsDashboardPage from '@/pages/tools/ToolsDashboardPage';
import ToolsTasksPage from '@/pages/tools/ToolsTasksPage';
import ToolsCalendarPage from '@/pages/tools/ToolsCalendarPage';
import ToolsFocusPage from '@/pages/tools/ToolsFocusPage';
import ToolsGradesPage from '@/pages/tools/ToolsGradesPage';
import ToolsPdfToolsPage from '@/pages/tools/ToolsPdfToolsPage';
import ToolsStocksPage from '@/pages/tools/ToolsStocksPage';
import ToolsTypingPage from '@/pages/tools/ToolsTypingPage';
import ToolsCollegePage from '@/pages/tools/ToolsCollegePage';
import ToolsUnitsPage from '@/pages/tools/ToolsUnitsPage';
import ToolsJournalPage from '@/pages/tools/ToolsJournalPage';
import ToolsGoalsPage from '@/pages/tools/ToolsGoalsPage';
import ToolsProfileToolPage from '@/pages/tools/ToolsProfileToolPage';
import ToolsListsPage from '@/pages/tools/ToolsListsPage';
import ToolsPasswordsPage from '@/pages/tools/ToolsPasswordsPage';
import ToolsCalculatorPage from '@/pages/tools/ToolsCalculatorPage';
import ToolsCatalogPage from '@/pages/tools/ToolsCatalogPage';
import ToolsSettingsPage from '@/pages/tools/ToolsSettingsPage';

export default function App() {
  return (
    <>
      <ProductAnalyticsTracker />
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
        <Route path="/ai-limit" element={<AiLimitPage />} />
        <Route path="/tools" element={<Navigate to="/tools/dashboard" replace />} />
        <Route path="/tools/dashboard" element={<ToolsDashboardPage />} />
        <Route path="/tools/tasks" element={<ToolsTasksPage />} />
        <Route path="/tools/calendar" element={<ToolsCalendarPage />} />
        <Route path="/tools/focus" element={<ToolsFocusPage />} />
        <Route path="/tools/grades" element={<ToolsGradesPage />} />
        <Route path="/tools/pdf/*" element={<ToolsPdfToolsPage />} />
        <Route path="/tools/pdftools/*" element={<Navigate to="/tools/pdf" replace />} />
        <Route path="/tools/stocks/*" element={<ToolsStocksPage />} />
        <Route path="/tools/typing" element={<ToolsTypingPage />} />
        <Route path="/tools/college" element={<ToolsCollegePage />} />
        <Route path="/tools/units" element={<ToolsUnitsPage />} />
        <Route path="/tools/journal" element={<ToolsJournalPage />} />
        <Route path="/tools/goals" element={<ToolsGoalsPage />} />
        <Route path="/tools/profile" element={<ToolsProfileToolPage />} />
        <Route path="/tools/lists" element={<ToolsListsPage />} />
        <Route path="/tools/passwords" element={<ToolsPasswordsPage />} />
        <Route path="/tools/calculator" element={<ToolsCalculatorPage />} />
        <Route path="/tools/catalog" element={<ToolsCatalogPage />} />
        <Route path="/tools/settings" element={<ToolsSettingsPage />} />
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
          path="/admin/research"
          element={(
            <RequireAdmin>
              <ResearchDataPage />
            </RequireAdmin>
          )}
        />
        <Route element={<OnboardingGate><Outlet /></OnboardingGate>}>
        <Route path="/home" element={<HomePage />} />
        <Route path="/journeys" element={<JourneysPage />} />
        <Route path="/journeys/new" element={<CreateJourneyPage />} />
        <Route path="/journeys/:id/diagnostic" element={<DiagnosticPage />} />
        <Route path="/mai-survey" element={<MaiSurveyPage />} />
        <Route path="/journeys/:id/modules/:moduleId/baseline" element={<BaselineCheckPage />} />
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
    </>
  );
}
