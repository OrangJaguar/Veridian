import { shouldUseQuestionBank } from '@/utils/study/sampleQuestionBank';
import { getJourney } from '@/api/entities/journeys';
import { getActivity, updateActivity } from '@/api/entities/activities';
import { generateQuestionBankSlice } from '@/api/ai/study';
import { normalizeQuizQuestions } from '@/utils/quiz/normalizeQuizQuestions';
import { toast } from 'sonner';

const BANK_CAP = 80;
const TOPUP_COUNT = 8;
const IDEMPOTENCY_MS = 24 * 60 * 60 * 1000;

function lastTopUpMap(content = {}) {
  const map = content.lastBankTopUpByType;
  if (map && typeof map === 'object') return { ...map };
  if (content.lastBankTopUpAt && content.lastBankTopUpType) {
    return { [content.lastBankTopUpType]: content.lastBankTopUpAt };
  }
  return {};
}

function wasToppedUpRecently(content, prescriptionType) {
  const at = lastTopUpMap(content)[prescriptionType];
  if (!at) return false;
  return Date.now() - Number(at) < IDEMPOTENCY_MS;
}

function trimBank(bank = []) {
  if (bank.length <= BANK_CAP) return bank;
  // Drop oldest untagged first, then oldest overall.
  const sorted = [...bank].sort((a, b) => {
    const aTagged = a.prescriptionType || a.mixCategory || a.variantType ? 1 : 0;
    const bTagged = b.prescriptionType || b.mixCategory || b.variantType ? 1 : 0;
    if (aTagged !== bTagged) return aTagged - bTagged;
    return (a.addedAt ?? 0) - (b.addedAt ?? 0);
  });
  return sorted.slice(sorted.length - BANK_CAP);
}

/**
 * Best-effort async bank top-up when a prescription mode is newly confirmed.
 * Fire-and-forget — does not block post-session.
 */
export async function queuePrescriptionBankTopUp({
  module,
  journeyId,
  activityId,
  prescriptionType,
  primaryMode,
}) {
  if (!module?.moduleId || !activityId || !prescriptionType) return;

  try {
    const [journey, activity] = await Promise.all([
      getJourney(journeyId),
      getActivity(activityId),
    ]);
    if (!shouldUseQuestionBank(journey, activity)) return;
    if (wasToppedUpRecently(activity.content, prescriptionType)) return;

    const concepts = module?.knowledgeMap?.concepts ?? [];
    if (!concepts.length) return;

    const compositionSlots = Array.from({ length: TOPUP_COUNT }, (_, i) => ({
      type: 'multipleChoice',
      conceptId: concepts[i % concepts.length]?.id,
      variantType: i % 3 === 0 ? 'application' : 'verbatim',
      mixCategory: prescriptionType,
      prescriptionType,
    }));

    const raw = await generateQuestionBankSlice({
      moduleName: module.name,
      concepts,
      questionCount: TOPUP_COUNT,
      compositionSlots,
    });

    const normalized = normalizeQuizQuestions(raw, TOPUP_COUNT).map((q) => ({
      ...q,
      prescriptionType,
      mixCategory: q.mixCategory ?? prescriptionType,
      primaryMode: primaryMode ?? null,
      addedAt: Date.now(),
    }));

    if (!normalized.length) return;

    const existing = Array.isArray(activity.content?.questionBank)
      ? activity.content.questionBank
      : [];
    const nextBank = trimBank([...existing, ...normalized]);
    const topUpMap = {
      ...lastTopUpMap(activity.content),
      [prescriptionType]: Date.now(),
    };

    await updateActivity(activityId, {
      content: {
        ...activity.content,
        questionBank: nextBank,
        lastBankTopUpAt: Date.now(),
        lastBankTopUpType: prescriptionType,
        lastBankTopUpByType: topUpMap,
      },
    });

    toast.success('Practice bank updated for next time');
  } catch (err) {
    if (import.meta.env?.DEV) {
      console.info('[prescription-bank-topup] failed', err);
    }
  }
}

/** Test helpers */
export const __test = {
  BANK_CAP,
  TOPUP_COUNT,
  IDEMPOTENCY_MS,
  wasToppedUpRecently,
  trimBank,
  lastTopUpMap,
};
