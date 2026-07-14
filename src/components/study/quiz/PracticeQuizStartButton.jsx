import { useState } from 'react';
import QuizSetupModal from '@/components/study/quiz/QuizSetupModal';
import { useLaunchStudy } from '@/hooks/study/useLaunchStudy';
import { usePreferences } from '@/hooks/queries/usePreferences';
import { useModulePrescription } from '@/hooks/queries/useModulePrescription';
import { buildLaunchSessionData } from '@/utils/planner/buildLaunchSessionData';

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
  const { data: prescription } = useModulePrescription(moduleId);

  const prescriptionSummary = prescription?.shouldApply ? prescription.summary : null;
  const timedDefault = prescription?.spec?.timed ?? false;

  const defaultConfig = {
    ...activity.content?.lastConfig,
    strictMode: activity.content?.lastConfig?.strictMode ?? preferences?.strictMode ?? false,
    ...(timedDefault ? {
      strictTimedMode: true,
      timedMode: true,
      strictMode: true,
      instantFeedback: false,
    } : {}),
    ...(prescription?.shouldApply ? {
      questionCount: activity.content?.lastConfig?.questionCount ?? 5,
      focusPreset: 'weakSpots',
      prescriptionDriven: true,
    } : {}),
  };

  const handleStart = async (config) => {
    setLoading(true);
    try {
      const launchItem = {
        quizConfig: config,
        prescription: prescription?.shouldApply
          ? {
            prescriptionType: prescription.spec?.prescriptionType,
            primaryMode: prescription.primaryMode,
            summary: prescription.summary,
            spec: prescription.spec,
          }
          : null,
        prescriptionSummary: prescription?.summary,
        timed: timedDefault,
      };
      await launchStudy({
        journeyId,
        activity,
        moduleId,
        initialSessionData: buildLaunchSessionData(launchItem),
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
        defaultConfig={defaultConfig}
        onClose={() => setModalOpen(false)}
        onStart={handleStart}
        loading={loading}
        prescriptionSummary={prescriptionSummary}
      />
    </>
  );
}
