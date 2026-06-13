import { useEffect, useRef } from 'react';
import StudyBackButton from '@/components/study/shared/StudyBackButton';
import FeynmanMessageBubble, { FeynmanTypingIndicator } from '@/components/study/feynman/FeynmanMessageBubble';
import FeynmanChatInput from '@/components/study/feynman/FeynmanChatInput';
import { MAX_FEYNMAN_AI_TURNS } from '@/api/ai/prompts/feynman';

export default function FeynmanConversation({
  concepts,
  currentConceptId,
  messages,
  draft,
  onDraftChange,
  onSend,
  onConceptChange,
  onDone,
  onExit,
  sending,
  showDone,
  aiTurnCount,
  atTurnLimit,
  undiscussedCount,
}) {
  const scrollRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending, showDone]);

  const inputDisabled = atTurnLimit || sending;

  return (
    <div className="feynman-mode-view">
      <div className="feynman-top-bar">
        <StudyBackButton onClick={onExit} label="Exit session" />
      </div>

      <div className="feynman-chat-scroll" ref={scrollRef}>
        <div className="feynman-chat-messages">
          {messages.map((msg) => (
            <FeynmanMessageBubble
              key={msg.id}
              message={msg}
              concepts={concepts}
              currentConceptId={currentConceptId}
              onConceptChange={onConceptChange}
            />
          ))}
          {sending && <FeynmanTypingIndicator />}
          {atTurnLimit && !sending && (
            <div className="feynman-limit-notice">
              You&apos;ve reached {MAX_FEYNMAN_AI_TURNS} responses for this concept. Wrap up or pick a new topic.
            </div>
          )}
          {showDone && !sending && (
            <div className="feynman-done-row">
              {undiscussedCount === 0 && (
                <p className="feynman-all-covered">All concepts have been discussed.</p>
              )}
              <button type="button" className="btn btn-primary" onClick={onDone}>
                Done — view summary
              </button>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="feynman-chat-input-wrap">
        <FeynmanChatInput
          value={draft}
          onChange={onDraftChange}
          onSend={onSend}
          disabled={inputDisabled}
          sending={sending}
        />
        {aiTurnCount > 0 && (
          <span className="feynman-turn-count">
            {aiTurnCount}/{MAX_FEYNMAN_AI_TURNS} responses
          </span>
        )}
      </div>
    </div>
  );
}
