import { useState } from 'react';
import { RECOGNITION_OPTIONS } from './baselineContent';

export default function BaselineScreen3Recognition({ onCorrect }) {
  const [flashId, setFlashId] = useState(null);
  const [shakeId, setShakeId] = useState(null);

  const handleSelect = (opt) => {
    if (flashId) return;
    if (opt.correct) {
      setFlashId(opt.id);
      window.setTimeout(() => onCorrect(), 800);
    } else {
      setShakeId(opt.id);
      window.setTimeout(() => setShakeId(null), 400);
    }
  };

  return (
    <>
      <p className="baseline-question">
        According to the principle, which specific resource shortage causes a colony to transfer power to local farmers?
      </p>
      <div className="baseline-mcq-list" role="listbox" aria-label="Answer choices">
        {RECOGNITION_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            role="option"
            className={[
              'baseline-mcq-option',
              flashId === opt.id ? 'baseline-option--correct' : '',
              shakeId === opt.id ? 'baseline-option--shake' : '',
            ].filter(Boolean).join(' ')}
            onClick={() => handleSelect(opt)}
            disabled={!!flashId}
          >
            <span className="baseline-mcq-letter">{opt.id})</span> {opt.label}
          </button>
        ))}
      </div>
    </>
  );
}
