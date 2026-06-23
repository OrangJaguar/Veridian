import { base44 } from '@/api/base44Client';
import { requireAuth } from '@/api/requireAuth';
import { generateSurveyResponseId } from '@/utils/schemas/ids';

export async function createSurveyResponse(payload) {
  const user = await requireAuth();
  return base44.entities.SurveyResponse.create({
    responseId: payload.responseId ?? generateSurveyResponseId(),
    userEmail: user.email,
    createdAt: payload.createdAt ?? Date.now(),
    ...payload,
  });
}

export async function listSurveyResponsesByUser() {
  const user = await requireAuth();
  return base44.entities.SurveyResponse.filter({ userEmail: user.email });
}
