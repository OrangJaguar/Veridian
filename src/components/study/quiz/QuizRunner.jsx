import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LatexRenderer from '@/components/shared/LatexRenderer';
import { fuzzyMatchAnswer, playStudySound, triggerStudyHaptic } from '@/utils/study/feedback';

export default function QuizRunner({
  questions,
  onComplete,
  onIntervention,
  interventionConceptId,
  refresherContent,
}) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [answers, setAnswers] = useState([]);
  const [consecutiveMisses, setConsecutiveMisses] = useState({});
  const [pendingIntervention, setPendingIntervention] = useState(null);

  const q = questions[index];
  if (!q) return null;

  const isCorrect = (response) => {
    if (Array.isArray(q.correctAnswer)) {
      return Array.isArray(response)
        && response.length === q.correctAnswer.length
        && response.every((r) => q.correctAnswer.includes(r));
    }
    if (q.type === 'shortAnswer') return fuzzyMatchAnswer(response, q.correctAnswer);
    return response === q.correctAnswer;
  };

  const handleSelect = (option) => {
    if (showFeedback) return;
    setSelected(option);
    const correct = isCorrect(option);
    playStudySound(correct ? 'correct' : 'wrong');
    triggerStudyHaptic(correct ? 'correct' : 'wrong');
    setShowFeedback(true);

    const ans = {
      questionId: q.id,
      response: option,
      correct,
      conceptId: q.conceptId,
      timeSec: 0,
    };
    setAnswers((prev) => [...prev, ans]);

    if (!correct && q.conceptId) {
      const misses = (consecutiveMisses[q.conceptId] ?? 0) + 1;
      setConsecutiveMisses({ ...consecutiveMisses, [q.conceptId]: misses });
      if (misses >= 3 && onIntervention) {
        setPendingIntervention(q.conceptId);
      }
    } else if (q.conceptId) {
      setConsecutiveMisses({ ...consecutiveMisses, [q.conceptId]: 0 });
    }
  };

  const handleNext = () => {
    if (pendingIntervention && !refresherContent) return;
    setPendingIntervention(null);
    if (index + 1 >= questions.length) {
      onComplete(answers);
      return;
    }
    setIndex(index + 1);
    setSelected(null);
    setShowFeedback(false);
  };

  const options = q.options ?? (q.type === 'trueFalse' ? ['True', 'False'] : []);

  return (
    <div className="study-quiz">
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
            <button type="button" className="btn btn-secondary btn-sm" onClick={handleNext}>
              Keep going
            </button>
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={q.id}
          className="study-quiz-question"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
        >
          <LatexRenderer text={q.stem} />
        </motion.div>
      </AnimatePresence>

      <div className="study-quiz-options">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            className={`study-quiz-option${selected === opt ? (isCorrect(opt) ? ' correct' : ' wrong') : ''}`}
            disabled={showFeedback}
            onClick={() => handleSelect(opt)}
          >
            <LatexRenderer text={opt} />
          </button>
        ))}
      </div>

      {showFeedback && (
        <div className={`study-quiz-feedback${isCorrect(selected) ? ' correct' : ' wrong'}`}>
          <LatexRenderer text={q.explanation} />
          {!pendingIntervention && (
            <button type="button" className="btn btn-primary" onClick={handleNext}>
              {index + 1 >= questions.length ? 'Finish' : 'Next'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
