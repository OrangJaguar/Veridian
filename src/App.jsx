import { Routes, Route } from 'react-router-dom';
import MarketingLayout from '@/layouts/MarketingLayout';
import AppShell from '@/layouts/AppShell';
import RequireAuth from '@/components/routing/RequireAuth';
import LandingPage from '@/pages/landing/LandingPage';
import SignInPage from '@/pages/auth/SignInPage';
import SignUpPage from '@/pages/auth/SignUpPage';
import LibraryStubPage from '@/pages/stubs/LibraryStubPage';
import LibraryPreviewStubPage from '@/pages/stubs/LibraryPreviewStubPage';
import HomeStubPage from '@/pages/stubs/HomeStubPage';
import JourneysStubPage from '@/pages/stubs/JourneysStubPage';
import JourneyDetailStubPage from '@/pages/stubs/JourneyDetailStubPage';
import ModuleDetailStubPage from '@/pages/stubs/ModuleDetailStubPage';
import StudyStubPage from '@/pages/stubs/StudyStubPage';
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
        <Route path="/library" element={<LibraryStubPage />} />
        <Route path="/library/:journeyId" element={<LibraryPreviewStubPage />} />
      </Route>

      <Route element={(
        <RequireAuth>
          <AppShell />
        </RequireAuth>
      )}>
        <Route path="/home" element={<HomeStubPage />} />
        <Route path="/journeys" element={<JourneysStubPage />} />
        <Route path="/journeys/:id" element={<JourneyDetailStubPage />} />
        <Route path="/journeys/:id/modules/:moduleId" element={<ModuleDetailStubPage />} />
        <Route path="/study/:sessionId" element={<StudyStubPage />} />
        <Route path="/profile" element={<ProfileStubPage />} />
      </Route>

      <Route path="/app" element={<LegacyAppPage />} />

      <Route element={<MarketingLayout />}>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
