import React, { useState } from 'react';
import { useAxiomStore } from '../../store/useAxiomStore';

function buildQuestions(cards, count) {
  const shuffled = [...cards].sort(() => Math.random() - 0.5).slice(0, count);
  return shuffled.map(card => {
    const distractors = cards.filter(c => c.back !== card.back).sort(() => Math.random() - 0.5).slice(0, 3).map(c => c.back);
    const options = [card.back, ...distractors].sort(() => Math.random() - 0.5);
    return { question: card.front, correct: card.back, options };
  });
}

export default function QuizMain() {
  const { decks, activeDeckId } = useAxiomStore();
  const [quizState, setQuizState] = useState('setup');
  const [selectedDeckId, setSelectedDeckId] = useState(activeDeckId ?? decks[0]?.id ?? '');
  const [questionCount, setQuestionCount] = useState(10);
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [selected, setSelected] = useState(null);

  const deck = decks.find(d => d.id === selectedDeckId);

  const startQuiz = () => {
    if (!deck || deck.cards.length < 2) return;
    const qs = buildQuestions(deck.cards, Math.min(questionCount, deck.cards.length));
    setQuestions(qs); setAnswers(new Array(qs.length).fill(null));
    setCurrentIdx(0); setSelected(null); setQuizState('running');
  };

  const handleAnswer = (option) => {
    if (selected !== null) return;
    setSelected(option);
    const updated = [...answers]; updated[currentIdx] = option; setAnswers(updated);
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) { setCurrentIdx(i => i + 1); setSelected(null); }
    else setQuizState('results');
  };

  const score = answers.filter((a, i) => a === questions[i]?.correct).length;

  if (quizState === 'setup') return (
    <div className="axiom-view axiom-quiz-setup">
      <h2>Quiz Mode</h2>
      <div className="axiom-quiz-form">
        <label className="axiom-settings-label">Select Deck
          <select className="axiom-input" value={selectedDeckId} onChange={e => setSelectedDeckId(e.target.value)}>
            {decks.map(d => <option key={d.id} value={d.id}>{d.name} ({d.cards.length} cards)</option>)}
          </select>
        </label>
        <label className="axiom-settings-label">Questions
          <input type="number" className="axiom-input" min={2} max={50} value={questionCount} onChange={e => setQuestionCount(Number(e.target.value))} />
        </label>
        <button className="axiom-btn axiom-btn-primary" disabled={!deck || deck.cards.length < 2} onClick={startQuiz}>Start Quiz</button>
        {decks.length === 0 && <p className="axiom-muted">Create flashcard decks first</p>}
      </div>
    </div>
  );

  if (quizState === 'results') return (
    <div className="axiom-view axiom-quiz-results">
      <h2>Quiz Results</h2>
      <div className="axiom-quiz-score">
        <div className="axiom-stat-big">{score}/{questions.length}</div>
        <p className="axiom-muted">{Math.round((score / questions.length) * 100)}% correct</p>
      </div>
      <div className="axiom-quiz-review">
        {questions.map((q, i) => (
          <div key={i} className={`axiom-quiz-result-item ${answers[i] === q.correct ? 'correct' : 'incorrect'}`}>
            <p className="axiom-quiz-q">{q.question}</p>
            <p>Your answer: <strong>{answers[i] ?? '—'}</strong></p>
            {answers[i] !== q.correct && <p>Correct: <strong>{q.correct}</strong></p>}
          </div>
        ))}
      </div>
      <button className="axiom-btn axiom-btn-primary" onClick={() => setQuizState('setup')}>Try Again</button>
    </div>
  );

  const q = questions[currentIdx];
  return (
    <div className="axiom-view axiom-quiz-running">
      <div className="axiom-quiz-progress">
        <span>{currentIdx + 1} / {questions.length}</span>
        <div className="axiom-progress-bar"><div className="axiom-progress-fill" style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }} /></div>
      </div>
      <div className="axiom-quiz-question"><h3>{q.question}</h3></div>
      <div className="axiom-quiz-options">
        {q.options.map(opt => (
          <button key={opt}
            className={`axiom-quiz-option ${selected === opt ? (opt === q.correct ? 'correct' : 'incorrect') : ''} ${selected && opt === q.correct ? 'correct' : ''}`}
            onClick={() => handleAnswer(opt)}>{opt}</button>
        ))}
      </div>
      {selected !== null && (
        <button className="axiom-btn axiom-btn-primary" onClick={handleNext}>
          {currentIdx < questions.length - 1 ? 'Next →' : 'See Results'}
        </button>
      )}
    </div>
  );
}