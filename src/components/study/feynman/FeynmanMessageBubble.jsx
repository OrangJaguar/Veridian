import LatexRenderer from '@/components/shared/LatexRenderer';

export default function FeynmanMessageBubble({ message, concepts, onConceptChange, currentConceptId }) {
  const isUser = message.role === 'user';
  const isOpening = message.type === 'opening';

  if (isOpening) {
    return (
      <div className="feynman-bubble-row feynman-bubble-row--ai">
        <div className="feynman-bubble feynman-bubble--ai">
          <p className="feynman-opening-text">
            Let&apos;s talk about{' '}
            <select
              className="feynman-concept-select"
              value={currentConceptId}
              onChange={(e) => onConceptChange(e.target.value)}
              aria-label="Select concept"
            >
              {concepts.map((c) => (
                <option key={c.id} value={c.id}>{c.term}</option>
              ))}
            </select>
            . Explain the concept in your own words.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`feynman-bubble-row feynman-bubble-row--${isUser ? 'user' : 'ai'}`}>
      <div className={`feynman-bubble feynman-bubble--${isUser ? 'user' : 'ai'}`}>
        <LatexRenderer text={message.text} />
        {message.readyToComplete && !isUser && (
          <span className="feynman-ready-tag">Ready to wrap up</span>
        )}
      </div>
    </div>
  );
}

export function FeynmanTypingIndicator() {
  return (
    <div className="feynman-bubble-row feynman-bubble-row--ai">
      <div className="feynman-bubble feynman-bubble--ai feynman-bubble--typing">
        <span className="feynman-typing-dots" aria-hidden>
          <span /><span /><span />
        </span>
        <span className="sr-only">AI is thinking</span>
      </div>
    </div>
  );
}
