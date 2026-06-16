import { useState } from 'react';
import QuizSetupModal from '@/components/study/quiz/QuizSetupModal';
import { useLaunchStudy } from '@/hooks/study/useLaunchStudy';
import { usePreferences } from '@/hooks/queries/usePreferences';

export default function PracticeQuizStartButton({
  activity,
  journeyId,
  moduleId,
  className = 'btn btn-secondary btn-sm',
  disabled,
  children,
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const launchStudy = useLaunchStudy();
  const { data: preferences } = usePreferences();

  const handleStart = async (config) => {
    setLoading(true);
    try {
      await launchStudy({
        journeyId,
        activity,
        moduleId,
        initialSessionData: { quizConfig: config },
      });
      setModalOpen(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className={className}
        disabled={disabled || loading}
        onClick={() => setModalOpen(true)}
      >
        {children}
      </button>
      <QuizSetupModal
        open={modalOpen}
        defaultConfig={{
          ...activity.content?.lastConfig,
          strictMode: activity.content?.lastConfig?.strictMode ?? preferences?.strictMode ?? false,
        }}
        onClose={() => setModalOpen(false)}
        onStart={handleStart}
        loading={loading}
      />
    </>
  );
}
