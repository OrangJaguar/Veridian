/**
 * Map a Due Today / plan assignment item to study session initial data.
 */
export function buildLaunchSessionData(item = {}) {
  const data = {};

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
