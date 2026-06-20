import { useState, useEffect } from 'react';
import { X, Sparkles } from 'lucide-react';
import { applyDeckAiEdit } from '@/api/ai/study';
import AiGenerationLoading from '@/components/shared/AiGenerationLoading';

const AI_ACTIONS = [
  {
    id: 'other',
    label: 'Something else',
    description: 'Describe any edit — I\'ll confirm before applying.',
    custom: true,
  },
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
  const [customInstruction, setCustomInstruction] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  useEffect(() => {
    if (!open) {
      setMessages([]);
      setPendingAction(null);
      setCustomInstruction('');
      setShowCustomInput(false);
      return;
    }
    setMessages([{ role: 'assistant', text: 'Hi! Pick something below and I\'ll update your deck.' }]);
  }, [open]);

  if (!open) return null;

  const pushMessage = (role, text) => {
    setMessages((prev) => [...prev, { role, text }]);
  };

  const runAction = async (actionId, clarifyingAnswer = null, instruction = null) => {
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
        customInstruction: instruction ?? undefined,
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
      setShowCustomInput(false);
      setCustomInstruction('');
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
        {loading && (
          <AiGenerationLoading action="applyDeckAiEdit" variant="inline" fullPage={false} />
        )}
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
      ) : showCustomInput ? (
        <div className="deck-ai-custom">
          <label className="deck-ai-custom-label">
            What should I change?
            <textarea
              className="deck-ai-custom-input"
              rows={3}
              value={customInstruction}
              placeholder="e.g. Make all backs use bullet points, add mnemonics for enzyme names…"
              onChange={(e) => setCustomInstruction(e.target.value)}
            />
          </label>
          <div className="deck-ai-custom-actions">
            <button
              type="button"
              className="btn btn-primary btn-sm"
              disabled={loading || !customInstruction.trim()}
              onClick={() => {
                pushMessage('user', customInstruction.trim());
                runAction('other', null, customInstruction.trim());
              }}
            >
              Send request
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={loading}
              onClick={() => {
                setShowCustomInput(false);
                setCustomInstruction('');
              }}
            >
              Cancel
            </button>
          </div>
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
                if (action.custom) {
                  setShowCustomInput(true);
                  pushMessage('assistant', 'Tell me what you\'d like changed — I\'ll confirm if anything is unclear.');
                  return;
                }
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
