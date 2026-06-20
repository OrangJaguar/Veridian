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
  onExploreAnother,
  onConfirmTopic,
  showTopicPicker,
  pickerConceptId,
  onPickerConceptChange,
  pickerOptions,
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
  }, [messages, sending, showDone, showTopicPicker]);

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
              {pickerOptions.length === 0 && (
                <p className="feynman-all-covered">All concepts have been discussed.</p>
              )}
              <div className="feynman-done-actions">
                {pickerOptions.length > 0 && (
                  <button type="button" className="btn btn-secondary" onClick={onExploreAnother}>
                    Explore another topic
                  </button>
                )}
                <button type="button" className="btn btn-primary" onClick={onDone}>
                  Done — view summary
                </button>
              </div>
              {showTopicPicker && pickerOptions.length > 0 && (
                <div className="feynman-topic-picker">
                  <p className="feynman-topic-picker-label">Pick your next topic:</p>
                  <div className="feynman-topic-picker-row">
                    <select
                      className="feynman-concept-select feynman-topic-picker-select"
                      value={pickerConceptId}
                      onChange={(e) => onPickerConceptChange(e.target.value)}
                      aria-label="Select next concept"
                    >
                      {pickerOptions.map((c) => (
                        <option key={c.id} value={c.id}>{c.term}</option>
                      ))}
                    </select>
                    <button type="button" className="btn btn-primary btn-sm" onClick={onConfirmTopic}>
                      Start explaining
                    </button>
                  </div>
                </div>
              )}
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
