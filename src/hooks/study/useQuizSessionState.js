import { useState, useCallback, useEffect, useRef } from 'react';
import { fuzzyMatchAnswer } from '@/utils/study/feedback';

const CHOICE_LETTERS = ['A', 'B', 'C', 'D'];

function isCorrect(response, question) {
  if (!question) return false;
  if (Array.isArray(question.correctAnswer)) {
    return Array.isArray(response)
      && response.length === question.correctAnswer.length
      && response.every((r) => question.correctAnswer.includes(r));
  }
  if (question.type === 'shortAnswer') return fuzzyMatchAnswer(response, question.correctAnswer);
  return response === question.correctAnswer;
}

export function optionLetter(index) {
  return CHOICE_LETTERS[index] ?? String.fromCharCode(65 + index);
}

/**
 * Shared quiz session state for Classic and AP Classroom runners.
 */
export default function useQuizSessionState(questions, { onComplete, sessionStartRef } = {}) {
  const [index, setIndex] = useState(0);
  const [answersByIndex, setAnswersByIndex] = useState(() => questions.map(() => null));
  const [flagged, setFlagged] = useState(() => new Set());
  const [crossedOut, setCrossedOut] = useState(() => new Map());
  const [navModalOpen, setNavModalOpen] = useState(false);
  const [reviewScreen, setReviewScreen] = useState(false);
  const [lastQuestionIndex, setLastQuestionIndex] = useState(0);

  const answersByIndexRef = useRef(answersByIndex);
  const questionStartRef = useRef(Date.now());
  const internalSessionStartRef = useRef(Date.now());
  const startRef = sessionStartRef ?? internalSessionStartRef;

  useEffect(() => {
    answersByIndexRef.current = answersByIndex;
  }, [answersByIndex]);

  useEffect(() => {
    setAnswersByIndex(questions.map(() => null));
    setIndex(0);
    setFlagged(new Set());
    setCrossedOut(new Map());
    setNavModalOpen(false);
    setReviewScreen(false);
    setLastQuestionIndex(0);
    questionStartRef.current = Date.now();
  }, [questions]);

  useEffect(() => {
    questionStartRef.current = Date.now();
  }, [index]);

  const q = questions[index];

  const getSelected = useCallback((i = index) => {
    const ans = answersByIndex[i];
    return ans?.response ?? null;
  }, [answersByIndex, index]);

  const getCrossedOutForIndex = useCallback((i) => {
    return crossedOut.get(i) ?? new Set();
  }, [crossedOut]);

  const isFlagged = useCallback((i = index) => flagged.has(i), [flagged, index]);

  const isAnswered = useCallback((i) => answersByIndex[i] != null, [answersByIndex]);

  const select = useCallback((response) => {
    if (!q) return;
    const crossed = getCrossedOutForIndex(index);
    const letter = q.options?.indexOf(response);
    if (letter >= 0 && crossed.has(optionLetter(letter))) return;

    const timeSec = (Date.now() - questionStartRef.current) / 1000;
    const ans = {
      questionId: q.id,
      response,
      correct: false,
      skipped: false,
      conceptId: q.conceptId,
      timeSec,
    };

    setAnswersByIndex((prev) => {
      const next = [...prev];
      next[index] = ans;
      return next;
    });
  }, [q, index, getCrossedOutForIndex]);

  const toggleFlag = useCallback((i = index) => {
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }, [index]);

  const toggleCrossout = useCallback((optionIndex, i = index) => {
    const letter = optionLetter(optionIndex);
    setCrossedOut((prev) => {
      const next = new Map(prev);
      const current = new Set(next.get(i) ?? []);
      if (current.has(letter)) current.delete(letter);
      else current.add(letter);
      next.set(i, current);
      return next;
    });

    const selected = getSelected(i);
    const question = questions[i];
    if (question?.options?.[optionIndex] === selected) {
      setAnswersByIndex((prev) => {
        const next = [...prev];
        next[i] = null;
        return next;
      });
    }
  }, [index, getSelected, questions]);

  const undoCrossout = useCallback((i = index) => {
    setCrossedOut((prev) => {
      const next = new Map(prev);
      next.set(i, new Set());
      return next;
    });
  }, [index]);

  const jump = useCallback((i) => {
    setLastQuestionIndex(index);
    setIndex(i);
    setNavModalOpen(false);
    setReviewScreen(false);
  }, [index]);

  const goBack = useCallback(() => {
    if (index <= 0) return;
    jump(index - 1);
  }, [index, jump]);

  const advance = useCallback(() => {
    if (index + 1 >= questions.length) {
      setLastQuestionIndex(index);
      setReviewScreen(true);
      setNavModalOpen(false);
      return;
    }
    jump(index + 1);
  }, [index, questions.length, jump]);

  const openReview = useCallback(() => {
    setLastQuestionIndex(index);
    setReviewScreen(true);
    setNavModalOpen(false);
  }, [index]);

  const closeReview = useCallback(() => {
    setReviewScreen(false);
    setIndex(lastQuestionIndex);
  }, [lastQuestionIndex]);

  const openNavModal = useCallback(() => {
    setNavModalOpen(true);
  }, []);

  const closeNavModal = useCallback(() => {
    setNavModalOpen(false);
  }, []);

  const toggleNavModal = useCallback(() => {
    setNavModalOpen((open) => !open);
  }, []);

  const submit = useCallback(() => {
    if (!onComplete) return;
    const graded = answersByIndexRef.current.map((ans, i) => {
      if (!ans) return null;
      const question = questions[i];
      return { ...ans, correct: isCorrect(ans.response, question) };
    });
    const flat = graded.filter(Boolean);
    onComplete(
      flat,
      Math.round((Date.now() - startRef.current) / 1000),
      { flaggedIndices: [...flagged] },
    );
  }, [onComplete, flagged, startRef, questions]);

  return {
    index,
    q,
    questions,
    answersByIndex,
    flagged,
    crossedOut,
    navModalOpen,
    reviewScreen,
    lastQuestionIndex,
    getSelected,
    getCrossedOutForIndex,
    isFlagged,
    isAnswered,
    select,
    toggleFlag,
    toggleCrossout,
    undoCrossout,
    jump,
    goBack,
    advance,
    openReview,
    closeReview,
    openNavModal,
    closeNavModal,
    toggleNavModal,
    submit,
    setReviewScreen,
  };
}
