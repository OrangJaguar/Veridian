import { fuzzyMatchAnswer } from '@/utils/study/feedback';
import { gradeMcqResponse } from '@/utils/study/resolveCorrectAnswer';

function normalizeText(value) {
  return String(value ?? '').trim();
}

function gradeShortAnswer(response, question) {
  const given = normalizeText(response);
  if (!given) return false;

  const candidates = [
    question.correctAnswer,
    ...(question.acceptableAnswers ?? []),
  ].map(normalizeText).filter(Boolean);

  const mode = question.matchMode ?? 'fuzzy';
  return candidates.some((expected) => (
    mode === 'exact'
      ? given.toLowerCase() === expected.toLowerCase()
      : fuzzyMatchAnswer(given, expected)
  ));
}

function gradeMultiSelect(response, question) {
  if (!Array.isArray(response) || !Array.isArray(question.correctAnswer)) return false;
  const selected = [...response].map(normalizeText).sort();
  const expected = [...question.correctAnswer].map(normalizeText).sort();
  return selected.length === expected.length
    && selected.every((val, i) => val === expected[i]);
}

function gradeOrdering(response, question) {
  if (!Array.isArray(response) || !Array.isArray(question.correctAnswer)) return false;
  const given = response.map(normalizeText);
  const expected = question.correctAnswer.map(normalizeText);
  return given.length === expected.length
    && given.every((val, i) => val === expected[i]);
}

function gradeMatching(response, question) {
  if (!response || typeof response !== 'object' || Array.isArray(response)) return false;
  const expected = question.correctAnswer ?? {};
  const keys = Object.keys(expected);
  if (!keys.length) return false;
  return keys.every((key) => normalizeText(response[key]) === normalizeText(expected[key]));
}

/**
 * Grade a learner response against a normalized quiz question.
 */
export function gradeQuestionResponse(response, question) {
  if (!question) return false;

  switch (question.type) {
    case 'shortAnswer':
      return gradeShortAnswer(response, question);
    case 'multiSelect':
      return gradeMultiSelect(response, question);
    case 'ordering':
      return gradeOrdering(response, question);
    case 'matching':
      return gradeMatching(response, question);
    case 'trueFalse':
    case 'multipleChoice':
    default:
      return gradeMcqResponse(response, question.correctAnswer, question.options);
  }
}

export function isInteractiveAnswerComplete(response, question) {
  if (!question) return false;

  switch (question.type) {
    case 'shortAnswer':
      return Boolean(normalizeText(response));
    case 'multiSelect':
      return Array.isArray(response) && response.length > 0;
    case 'ordering':
      return Array.isArray(response) && response.length === (question.items?.length ?? question.correctAnswer?.length);
    case 'matching':
      if (!response || typeof response !== 'object' || Array.isArray(response)) return false;
      return (question.leftItems ?? []).every((item) => Boolean(normalizeText(response[item])));
    default:
      return Boolean(normalizeText(response));
  }
}
