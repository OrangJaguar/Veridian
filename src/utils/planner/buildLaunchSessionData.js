/**
 * Map a Due Today / plan assignment item to study session initial data.
 */
export function buildLaunchSessionData(item = {}) {
  const data = {};

  if (item.assignmentId) {
    data.assignmentId = item.assignmentId;
  }

  if (item.commitmentId) {
    data.commitmentId = item.commitmentId;
  }

  if (item.weekKey) {
    data.weekKey = item.weekKey;
  }

  if (item.dateKey) {
    data.dateKey = item.dateKey;
  }

  if (item.prescription) {
    data.prescription = item.prescription;
  } else if (item.prescriptionType || item.primaryMode || item.prescriptionSummary) {
    data.prescription = {
      prescriptionType: item.prescriptionType,
      primaryMode: item.primaryMode ?? null,
      summary: item.prescriptionSummary ?? null,
    };
  }

  if (item.quizConfig) {
    data.quizConfig = item.quizConfig;
  }

  if (item.flashcardMode) {
    data.flashcardMode = item.flashcardMode;
  }

  if (item.mixedPhrasing) {
    data.mixedPhrasing = true;
  }

  return data;
}
