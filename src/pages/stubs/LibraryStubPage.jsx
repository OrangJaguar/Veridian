import StubPage from '@/components/stubs/StubPage';

export default function LibraryStubPage() {
  return (
    <StubPage
      title="Community Library"
      phase="Phase 8"
      description="Browse and clone Journeys created by other Veridian students. Explore public study paths, preview modules, and add them to your library when you are ready."
      loginAction="clone Journeys to your account"
      showStudyAppLink={false}
    />
  );
}
