import { useState } from 'react';
import { Link } from 'react-router-dom';
import LatexRenderer from '@/components/shared/LatexRenderer';
import SessionFailureInsight from '@/components/failures/SessionFailureInsight';
import QuizContentSourceBadge from '@/components/study/quiz/QuizContentSourceBadge';
import { formatStudyTime } from '@/utils/study/feedback';

function formatCorrectAnswer(q) {
  if (q.type === 'matching' && q.correctAnswer && typeof q.correctAnswer === 'object') {
    return Object.entries(q.correctAnswer)
      .map(([left, right]) => `${left} → ${right}`)
      .join('; ');
  }
  if (q.type === 'ordering' && Array.isArray(q.correctAnswer)) {
    return q.correctAnswer.join(' → ');
  }
  if (Array.isArray(q.correctAnswer)) return q.correctAnswer.join(', ');
  return String(q.correctAnswer ?? '');
}

function formatResponse(q, response) {
  if (response == null) return 'Skipped';
  if (q.type === 'matching' && typeof response === 'object' && !Array.isArray(response)) {
    return Object.entries(response)
      .map(([left, right]) => `${left} → ${right}`)
      .join('; ');
  }
  if (q.type === 'ordering' && Array.isArray(response)) {
    return response.join(' → ');
  }
  if (Array.isArray(response)) return response.join(', ');
  return String(response);
}

export default function QuizSummary({
  questions,
  answers,
  totalTimeSec,
  journeyTitle,
  moduleTitle,
  returnHref = '/home',
  failureInsight = null,
  failureModeId = null,
  contentSource = null,
}) {
  const [copied, setCopied] = useState(false);

  const graded = answers.filter((a) => a && !a.skipped);
  const correctCount = graded.filter((a) => a.correct).length;
  const accuracy = graded.length ? Math.round((correctCount / graded.length) * 100) : 0;

  const answerByQuestionId = {};
  for (const a of answers) {
    if (a?.questionId) answerByQuestionId[a.questionId] = a;
  }

  const copyText = () => {
    const lines = [
      'Veridian Results',
      `Journey: ${journeyTitle ?? '—'}`,
      `Module: ${moduleTitle ?? '—'}`,
      `Score: ${accuracy}%`,
      `Time: ${formatStudyTime(totalTimeSec)}`,
      '',
    ];

    questions.forEach((q, idx) => {
      const ans = answerByQuestionId[q.id];
      const selected = formatResponse(q, ans?.response);
      const correct = formatCorrectAnswer(q);
      const time = ans?.timeSec != null ? `${ans.timeSec.toFixed(1)}s` : '—';
      lines.push(`${idx + 1}. ${q.stem}`);
      lines.push(`Selected: ${selected}`);
      lines.push(`Correct: ${correct}`);
      lines.push(`Time: ${time}`);
      lines.push('');
    });

    return lines.join('\n').trim();
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(copyText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable
    }
  };

  return (
    <main className="study-mode-view session-summary-view">
      {contentSource && (
        <div className="quiz-content-source-row">
          <QuizContentSourceBadge source={contentSource} />
        </div>
      )}
      <div className="summary-stats">
        <div className="stat-box">
          <span className="stat-value">{accuracy}%</span>
          <span className="stat-label">Accuracy</span>
        </div>
        <div className="stat-box">
          <span className="stat-value">{formatStudyTime(totalTimeSec)}</span>
          <span className="stat-label">Total Time</span>
        </div>
      </div>

      <div className="review-list">
        {questions.map((q, idx) => {
          const ans = answerByQuestionId[q.id];
          const isCorrect = ans?.correct === true;
          const selected = formatResponse(q, ans?.response);
          const correct = formatCorrectAnswer(q);
          const timeLabel = ans?.timeSec != null ? `${ans.timeSec.toFixed(1)}s` : '—';

          return (
            <div
              key={q.id}
              className={`review-item ${isCorrect ? 'review-correct' : 'review-wrong'}`}
            >
              <div className="review-meta-bar">
                <div className="review-q">{idx + 1}. <LatexRenderer text={q.stem} /></div>
                <div className="review-tta">{timeLabel}</div>
              </div>
              <div className="review-a">
                Selected: <LatexRenderer text={selected} />
                {!isCorrect && (
                  <>
                    <br />
                    Correct: <LatexRenderer text={correct} />
                  </>
                )}
                {q.explanation && (
                  <>
                    <br />
                    <LatexRenderer text={q.explanation} />
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <SessionFailureInsight insight={failureInsight} modeId={failureModeId} />

      <div className="action-row summary-actions">
        <div>
          <button type="button" className="btn" onClick={handleCopy}>
            Copy Results
          </button>
          {copied && <span className="summary-copy-feedback">Copied!</span>}
        </div>
        <Link to={returnHref} className="btn btn-primary">
          Back to Home
        </Link>
      </div>
    </main>
  );
}
