import { useState, useEffect, useCallback, useRef } from 'react';
import { Pause, Flag } from 'lucide-react';
import LatexRenderer from '@/components/shared/LatexRenderer';
import QuizQuestionNav from '@/components/study/quiz/QuizQuestionNav';
import QuizTimeNotice from '@/components/study/quiz/QuizTimeNotice';
import {
  fuzzyMatchAnswer,
  playStudySound,
  triggerStudyHaptic,
  formatStudyTime,
} from '@/utils/study/feedback';

const URGENCY_THRESHOLDS = [
  { sec: 300, message: '5 minutes left' },
  { sec: 60, message: '1 minute left' },
  { sec: 30, message: '30 seconds left' },
];

export default function QuizRunner({
  questions,
  config = {},
  onComplete,
  onExit,
  onIntervention,
  refresherContent,
}) {
  const strictMode = config.strictMode === true || config.strictTimedMode === true;
  const strictTimedMode = strictMode;
  const instantFeedback = !strictMode && config.instantFeedback !== false;
  const strictSecondsPerQuestion = config.strictSecondsPerQuestion ?? 60;
  const totalLimitSec = strictTimedMode
    ? questions.length * strictSecondsPerQuestion
    : null;

  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [answersByIndex, setAnswersByIndex] = useState(() => questions.map(() => null));
  const [flagged, setFlagged] = useState(() => new Set());
  const [navOpen, setNavOpen] = useState(false);
  const [consecutiveMisses, setConsecutiveMisses] = useState({});
  const [pendingIntervention, setPendingIntervention] = useState(null);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [paused, setPaused] = useState(false);
  const [timerHidden, setTimerHidden] = useState(false);
  const [timeNotice, setTimeNotice] = useState('');
  const shownUrgency = useRef(new Set());
  const questionStartRef = useRef(Date.now());
  const sessionStartRef = useRef(Date.now());
  const autoSubmitted = useRef(false);
  const answersByIndexRef = useRef(answersByIndex);

  const q = questions[index];
  const remainingSec = strictTimedMode && totalLimitSec != null
    ? Math.max(0, totalLimitSec - elapsedSec)
    : null;

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

  useEffect(() => {
    if (!strictTimedMode || paused || autoSubmitted.current) return;
    if (remainingSec == null) return;

    for (const { sec, message } of URGENCY_THRESHOLDS) {
      if (remainingSec <= sec && !shownUrgency.current.has(sec)) {
        shownUrgency.current.add(sec);
        setTimeNotice(message);
        const t = setTimeout(() => setTimeNotice(''), 4000);
        return () => clearTimeout(t);
      }
    }
    return undefined;
  }, [remainingSec, strictTimedMode, paused]);

  useEffect(() => {
    if (!strictTimedMode || paused || autoSubmitted.current) return;
    if (remainingSec === 0) {
      autoSubmitted.current = true;
      const flat = answersByIndexRef.current.filter(Boolean);
      onComplete(flat, Math.round((Date.now() - sessionStartRef.current) / 1000));
    }
  }, [remainingSec, strictTimedMode, paused, onComplete]);

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
    setPendingIntervention(null);
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

    if (!correct && q.conceptId) {
      const misses = (consecutiveMisses[q.conceptId] ?? 0) + 1;
      setConsecutiveMisses({ ...consecutiveMisses, [q.conceptId]: misses });
      if (misses >= 3 && onIntervention) {
        setPendingIntervention(q.conceptId);
      }
    } else if (q.conceptId) {
      setConsecutiveMisses({ ...consecutiveMisses, [q.conceptId]: 0 });
    }

    setAnswered(true);
  }, [q, index, isCorrect, consecutiveMisses, onIntervention]);

  const handleSelect = (option) => {
    if (answered || paused) return;
    recordAnswer(option);
  };

  const advance = useCallback(() => {
    if (pendingIntervention && refresherContent === undefined) return;
    setPendingIntervention(null);

    if (index + 1 >= questions.length) {
      const flat = answersByIndexRef.current.filter(Boolean);
      onComplete(flat, Math.round((Date.now() - sessionStartRef.current) / 1000));
      return;
    }

    const nextIndex = index + 1;
    setIndex(nextIndex);
    restoreQuestionState(nextIndex);
  }, [index, questions.length, onComplete, pendingIntervention, refresherContent, restoreQuestionState]);

  const toggleFlag = () => {
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  useEffect(() => {
    const onKeyDown = (e) => {
      if (paused || !q) return;
      const options = q.options ?? (q.type === 'trueFalse' ? ['True', 'False'] : []);

      if (e.key === ' ' || e.key === 'Spacebar') {
        if (answered) {
          e.preventDefault();
          advance();
        }
        return;
      }

      const num = Number(e.key);
      if (num >= 1 && num <= options.length && !answered) {
        e.preventDefault();
        handleSelect(options[num - 1]);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  if (!q) return null;

  const options = q.options ?? (q.type === 'trueFalse' ? ['True', 'False'] : []);
  const answeredCount = answersByIndex.filter(Boolean).length;
  const progressPct = questions.length ? (answeredCount / questions.length) * 100 : 0;
  const completionPct = Math.round(progressPct);
  const selectedCorrect = selected != null && isCorrect(selected, q);
  const timerDisplay = strictTimedMode
    ? formatStudyTime(remainingSec ?? 0)
    : formatStudyTime(elapsedSec);
  const isFlagged = flagged.has(index);

  const optionClass = (opt) => {
    if (!answered || !instantFeedback) {
      return selected === opt ? ' selected' : '';
    }
    if (selected === opt) {
      return selectedCorrect ? ' option-correct' : ' option-wrong';
    }
    if (!selectedCorrect && opt === q.correctAnswer) {
      return ' option-correct';
    }
    return '';
  };

  return (
    <div className="study-mode-view quiz-mode-view">
      <QuizTimeNotice message={timeNotice} />

      <div className="module-header">
        <div className="progress-container">
          <span className="progress-text">{completionPct}%</span>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progressPct}%` }} />
          </div>
        </div>

        <div className="tool-suite">
          <button type="button" className="util-btn exit-btn" onClick={onExit}>
            Exit
          </button>
          <button
            type="button"
            className={`quiz-flag-btn${isFlagged ? ' active' : ''}`}
            onClick={toggleFlag}
            aria-label={isFlagged ? 'Remove flag' : 'Flag question'}
            aria-pressed={isFlagged}
          >
            <Flag size={14} strokeWidth={2} />
          </button>
          <div className="timer-suite">
            {!timerHidden && (
              <span className={`time-display${strictTimedMode ? ' countdown' : ''}`}>
                {timerDisplay}
              </span>
            )}
            <button
              type="button"
              className="util-btn"
              onClick={() => setPaused((p) => !p)}
              aria-label={paused ? 'Resume timer' : 'Pause timer'}
            >
              <Pause size={12} fill="currentColor" />
            </button>
            <button
              type="button"
              className="util-btn"
              onClick={() => setTimerHidden((h) => !h)}
            >
              {timerHidden ? 'Show' : 'Hide'}
            </button>
          </div>
        </div>
      </div>

      {paused ? (
        <div className="paused-mask quiz-paused-mask">
          <h2 className="paused-title">Timer Paused</h2>
          <p className="paused-desc">Question content is hidden.</p>
          <button type="button" className="btn btn-primary paused-resume" onClick={() => setPaused(false)}>
            Resume Assessment
          </button>
        </div>
      ) : (
        <>
          {pendingIntervention && (
            <div className="study-intervention">
              <p>You&apos;ve missed a few questions on this concept. Want a quick refresher?</p>
              {refresherContent && (
                <div className="study-refresher">
                  <LatexRenderer text={refresherContent.recap} />
                  <LatexRenderer text={refresherContent.example} />
                </div>
              )}
              <div className="study-intervention-actions">
                <button type="button" className="btn btn-primary btn-sm" onClick={() => onIntervention?.(pendingIntervention)}>
                  Show me
                </button>
                <button type="button" className="btn btn-secondary btn-sm" onClick={advance}>
                  Keep going
                </button>
              </div>
            </div>
          )}

          <div className="question-block">
            <div className="question-text">
              <LatexRenderer text={q.stem} />
            </div>
            <div className="options-grid">
              {options.map((opt, i) => (
                <button
                  key={opt}
                  type="button"
                  className={`option-btn${optionClass(opt)}`}
                  disabled={answered}
                  onClick={() => handleSelect(opt)}
                >
                  <span className="option-key">{i + 1}</span>
                  <LatexRenderer text={opt} />
                </button>
              ))}
            </div>
            {instantFeedback && answered && q.explanation && (
              <div className={`feedback-text${selectedCorrect ? ' feedback-correct' : ' feedback-wrong'}`}>
                <LatexRenderer text={q.explanation} />
              </div>
            )}
          </div>

          <div className="action-row">
            <QuizQuestionNav
              open={navOpen}
              onToggle={setNavOpen}
              currentIndex={index}
              total={questions.length}
              answersByIndex={answersByIndex}
              flagged={flagged}
              onJump={jumpToQuestion}
            />
            <div>
              <span className="keyboard-hint" style={{ marginRight: '1rem' }}>
                Press &apos;Space&apos; to advance
              </span>
              <button
                type="button"
                className="btn btn-primary"
                disabled={!answered}
                onClick={advance}
              >
                {index + 1 >= questions.length ? 'Finish' : 'Next'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
