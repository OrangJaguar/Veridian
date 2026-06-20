import { useState, useEffect, useCallback, useRef } from 'react';
import { Pause } from 'lucide-react';
import LatexRenderer from '@/components/shared/LatexRenderer';
import CramQuestionNav from '@/components/study/cram/CramQuestionNav';
import {
  fuzzyMatchAnswer,
  playStudySound,
  triggerStudyHaptic,
  formatStudyTime,
} from '@/utils/study/feedback';

export default function CramRunner({
  questions,
  durationMin,
  onComplete,
  onExit,
}) {
  const totalLimitSec = durationMin * 60;

  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [answersByIndex, setAnswersByIndex] = useState(() => questions.map(() => null));
  const [navOpen, setNavOpen] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [paused, setPaused] = useState(false);
  const autoSubmitted = useRef(false);
  const questionStartRef = useRef(Date.now());
  const sessionStartRef = useRef(Date.now());
  const answersByIndexRef = useRef(answersByIndex);

  const q = questions[index];
  const remainingSec = Math.max(0, totalLimitSec - elapsedSec);

  useEffect(() => {
    answersByIndexRef.current = answersByIndex;
  }, [answersByIndex]);

  useEffect(() => {
    questionStartRef.current = Date.now();
  }, [index]);

  useEffect(() => {
    if (paused) return undefined;
    const id = setInterval(() => setElapsedSec((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [paused]);

  const finish = useCallback(() => {
    if (autoSubmitted.current) return;
    autoSubmitted.current = true;
    const flat = answersByIndexRef.current.filter(Boolean);
    onComplete(flat, Math.round((Date.now() - sessionStartRef.current) / 1000));
  }, [onComplete]);

  useEffect(() => {
    if (paused || autoSubmitted.current) return;
    if (remainingSec === 0) finish();
  }, [remainingSec, paused, finish]);

  const isCorrect = useCallback((response, question) => {
    if (!question) return false;
    if (Array.isArray(question.correctAnswer)) {
      return Array.isArray(response)
        && response.length === question.correctAnswer.length
        && response.every((r) => question.correctAnswer.includes(r));
    }
    if (question.type === 'shortAnswer') return fuzzyMatchAnswer(response, question.correctAnswer);
    return response === question.correctAnswer;
  }, []);

  const restoreQuestionState = useCallback((i) => {
    const existing = answersByIndex[i];
    if (existing) {
      setSelected(existing.response);
      setAnswered(true);
    } else {
      setSelected(null);
      setAnswered(false);
    }
  }, [answersByIndex]);

  const jumpToQuestion = (i) => {
    setIndex(i);
    restoreQuestionState(i);
  };

  const recordAnswer = useCallback((response) => {
    if (!q) return;
    const timeSec = (Date.now() - questionStartRef.current) / 1000;
    const correct = isCorrect(response, q);
    playStudySound(correct ? 'correct' : 'wrong');
    triggerStudyHaptic(correct ? 'correct' : 'wrong');

    const ans = {
      questionId: q.id,
      response,
      correct,
      skipped: false,
      conceptId: q.conceptId,
      timeSec,
    };

    setAnswersByIndex((prev) => {
      const next = [...prev];
      next[index] = ans;
      return next;
    });
    setSelected(response);
    setAnswered(true);
  }, [q, index, isCorrect]);

  const handleSelect = (option) => {
    if (answered || paused) return;
    recordAnswer(option);
  };

  const advance = useCallback(() => {
    if (index + 1 >= questions.length) {
      finish();
      return;
    }
    const nextIndex = index + 1;
    setIndex(nextIndex);
    restoreQuestionState(nextIndex);
  }, [index, questions.length, finish, restoreQuestionState]);

  if (!q) {
    return (
      <div className="study-mode-view cram-runner">
        <p>No questions available.</p>
        <button type="button" className="btn btn-secondary" onClick={onExit}>Exit</button>
      </div>
    );
  }

  const options = q.options ?? (q.type === 'trueFalse' ? ['True', 'False'] : []);

  return (
    <div className="study-mode-view cram-runner">
      <div className="quiz-runner-header">
        <CramQuestionNav
          open={navOpen}
          onToggle={setNavOpen}
          currentIndex={index}
          total={questions.length}
          answersByIndex={answersByIndex}
          onJump={jumpToQuestion}
        />
        <div className="quiz-timer cram-session-timer">
          <span>{formatStudyTime(remainingSec)} left</span>
          <button type="button" className="quiz-pause-btn" onClick={() => setPaused((p) => !p)}>
            <Pause size={16} />
            {paused ? 'Resume' : 'Pause'}
          </button>
        </div>
      </div>

      {!paused && (
        <>
          <div className="quiz-question-stem">
            <LatexRenderer text={q.stem} />
          </div>
          <div className="quiz-options">
            {options.map((opt) => {
              let cls = 'quiz-option';
              if (answered) {
                if (opt === q.correctAnswer || (Array.isArray(q.correctAnswer) && q.correctAnswer.includes(opt))) {
                  cls += ' correct';
                } else if (opt === selected) cls += ' wrong';
              } else if (opt === selected) cls += ' selected';
              return (
                <button
                  key={opt}
                  type="button"
                  className={cls}
                  disabled={answered}
                  onClick={() => handleSelect(opt)}
                >
                  <LatexRenderer text={opt} />
                </button>
              );
            })}
          </div>
          {answered && q.explanation && (
            <div className="quiz-explanation">
              <LatexRenderer text={q.explanation} />
            </div>
          )}
          {answered && (
            <button type="button" className="btn btn-primary quiz-next-btn" onClick={advance}>
              {index + 1 >= questions.length ? 'Finish' : 'Next'}
            </button>
          )}
        </>
      )}
    </div>
  );
}
