import { ACTIVITY_LABELS } from '@/utils/studyPlanner';
import {
  isLegacyGeneratingActivity,
  hasLearningGuideContent,
  isLearningGuideComplete,
  isLearningGuideInProgress,
} from '@/utils/study/activityContent';

export function getActivityDisplayName(activity) {
  return activity.title ?? ACTIVITY_LABELS[activity.type] ?? activity.type;
}

export function getActivityActionLabel(activity) {
  if (isLegacyGeneratingActivity(activity)) return 'Generating…';
  if (activity.status === 'failed') return 'Tap to resume';
  if (activity.type === 'flashcardSet') return 'Review';

  if (activity.type === 'learningGuide') {
    if (activity.status === 'notGenerated') return 'Generate';
    if (!hasLearningGuideContent(activity)) return 'Generate';
    if (isLearningGuideComplete(activity)) return 'Redo';
    if (isLearningGuideInProgress(activity)) return 'Continue';
    return 'Start';
  }

  if (activity.status === 'notGenerated') return 'Generate';

  if (activity.type === 'practiceQuiz' && activity.stats?.totalSessions > 0) {
    return 'Continue';
  }

  return 'Start';
}

export function getActivityStatusNote(activity, cardCount = 0) {
  if (isLegacyGeneratingActivity(activity)) return 'Generating…';
  if (activity.status === 'failed') return 'Tap to resume';

  if (activity.type === 'flashcardSet') {
    const due = activity.stats?.dueCount ?? 0;
    if (cardCount === 0) return 'No cards yet';
    return `${cardCount} cards · ${due} due`;
  }

  if (activity.type === 'learningGuide') {
    if (activity.status === 'notGenerated') return 'Not generated yet';
    const completed = activity.content?.progress?.completedSectionIds?.length ?? 0;
    const total = activity.content?.sections?.length ?? activity.itemCount ?? 0;
    if (completed === 0) return 'Not started';
    if (total && completed >= total) return 'Complete';
    return 'In progress';
  }

  if (activity.type === 'practiceQuiz') {
    if (activity.stats?.lastScore != null) {
      return `Last score: ${Math.round(activity.stats.lastScore)}%`;
    }
    return activity.stats?.totalSessions ? 'Ready' : 'Not started';
  }

  if (activity.stats?.totalSessions) {
    return `${activity.stats.totalSessions} session${activity.stats.totalSessions === 1 ? '' : 's'} completed`;
  }
  if (activity.stats?.lastCompletedAt) return 'Completed recently';
  if (activity.status === 'ready') return 'Ready';
  return 'Not started';
}
