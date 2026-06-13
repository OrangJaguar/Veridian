import { useState, useEffect } from 'react';
import { X, Sparkles } from 'lucide-react';
import { applyDeckAiEdit } from '@/api/ai/study';

const AI_ACTIONS = [
  {
    id: 'simplify_long',
    label: 'Simplify long cards',
    description: 'Shorten fronts and backs that are too wordy.',
  },
  {
    id: 'split_multi_concept',
    label: 'Split double-concept cards',
    description: 'Break cards testing two ideas into separate cards.',
  },
  {
    id: 'add_missing',
    label: 'Add missing cards',
    description: 'Fill gaps from module content (up to 5 new cards).',
  },
];

export default function DeckAiPanel({
  open,
  onClose,
  cards,
  moduleContext,
  onApplyCards,
}) {
  const [messages, setMessages] = useState([]);
  const [pendingAction, setPendingAction] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setMessages([]);
      setPendingAction(null);
      return;
    }
    setMessages([{ role: 'assistant', text: 'Hi! Pick something below and I\'ll update your deck.' }]);
  }, [open]);

  if (!open) return null;

  const pushMessage = (role, text) => {
    setMessages((prev) => [...prev, { role, text }]);
  };

  const runAction = async (actionId, clarifyingAnswer = null) => {
    setLoading(true);
    try {
      const result = await applyDeckAiEdit({
        action: actionId,
        cards: cards.map((c) => ({
          cardId: c.cardId,
          front: c.front,
          back: c.back,
          conceptTag: c.conceptTag,
        })),
        moduleName: moduleContext?.moduleName,
        concepts: moduleContext?.concepts ?? [],
        clarifyingAnswer,
      });

      if (result.needsClarification && result.clarifyingQuestion) {
        setPendingAction(actionId);
        pushMessage('assistant', result.clarifyingQuestion);
        return;
      }

      pushMessage('assistant', result.message || 'Done — review the updated cards.');
      if (result.cards?.length) {
        onApplyCards(result.cards);
      }
      setPendingAction(null);
    } catch (err) {
      pushMessage('assistant', err.message || 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <aside className="deck-ai-panel" aria-label="Edit with AI">
      <header className="deck-ai-panel-header">
        <span className="deck-ai-panel-title">
          <Sparkles size={16} />
          Edit with AI
        </span>
        <button type="button" className="deck-ai-panel-close" onClick={onClose} aria-label="Close">
          <X size={16} />
        </button>
      </header>

      <div className="deck-ai-messages">
        {messages.map((msg, i) => (
          <p key={i} className={`deck-ai-msg deck-ai-msg--${msg.role}`}>{msg.text}</p>
        ))}
        {loading && <p className="deck-ai-msg deck-ai-msg--assistant">Working on it…</p>}
      </div>

      {pendingAction ? (
        <div className="deck-ai-clarify">
          <button type="button" className="btn btn-secondary btn-sm" disabled={loading} onClick={() => runAction(pendingAction, 'Yes, proceed')}>
            Yes, go ahead
          </button>
          <button type="button" className="btn btn-secondary btn-sm" disabled={loading} onClick={() => runAction(pendingAction, 'Keep all cards, only simplify wording')}>
            Keep all, simplify only
          </button>
        </div>
      ) : (
        <div className="deck-ai-actions">
          {AI_ACTIONS.map((action) => (
            <button
              key={action.id}
              type="button"
              className="deck-ai-action-btn"
              disabled={loading}
              onClick={() => {
                pushMessage('user', action.label);
                runAction(action.id);
              }}
            >
              <strong>{action.label}</strong>
              <span>{action.description}</span>
            </button>
          ))}
        </div>
      )}
    </aside>
  );
}
