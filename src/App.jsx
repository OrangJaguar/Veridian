import { Routes, Route } from 'react-router-dom';
import MarketingLayout from '@/layouts/MarketingLayout';
import AppShell from '@/layouts/AppShell';
import LandingPage from '@/pages/landing/LandingPage';
import SignInPage from '@/pages/auth/SignInPage';
import SignUpPage from '@/pages/auth/SignUpPage';
import LibraryStubPage from '@/pages/stubs/LibraryStubPage';
import LibraryPreviewStubPage from '@/pages/stubs/LibraryPreviewStubPage';
import HomePage from '@/pages/home/HomePage';
import JourneysPage from '@/pages/journeys/JourneysPage';
import CreateJourneyPage from '@/pages/journeys/CreateJourneyPage';
import JourneyDetailPage from '@/pages/journeys/JourneyDetailPage';
import ModuleDetailPage from '@/pages/journeys/ModuleDetailPage';
import StudyShell from '@/pages/study/StudyShell';
import ProfileStubPage from '@/pages/stubs/ProfileStubPage';
import LegacyAppPage from '@/pages/legacy/LegacyAppPage';
import NotFoundPage from '@/pages/NotFoundPage';

export default function App() {
  return (
    <Routes>
      <Route element={<MarketingLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/signup" element={<SignUpPage />} />
      </Route>

      <Route element={<AppShell />}>
        <Route path="/home" element={<HomePage />} />
        <Route path="/journeys" element={<JourneysPage />} />
        <Route path="/journeys/new" element={<CreateJourneyPage />} />
        <Route path="/journeys/:id" element={<JourneyDetailPage />} />
        <Route path="/journeys/:id/modules/:moduleId" element={<ModuleDetailPage />} />
        <Route path="/study/:sessionId" element={<StudyShell />} />
        <Route path="/profile" element={<ProfileStubPage />} />
        <Route path="/library" element={<LibraryStubPage />} />
        <Route path="/library/:journeyId" element={<LibraryPreviewStubPage />} />
      </Route>

      <Route path="/app" element={<LegacyAppPage />} />

      <Route element={<MarketingLayout />}>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
