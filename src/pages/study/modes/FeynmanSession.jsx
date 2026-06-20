import { useState, useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import AiGenerationLoading from '@/components/shared/AiGenerationLoading';
import FeynmanConversation from '@/components/study/feynman/FeynmanConversation';
import FeynmanSummary from '@/components/study/feynman/FeynmanSummary';
import { feynmanConversationTurn, feynmanSummarizeConcept } from '@/api/ai/study';
import {
  pickRandomConceptId,
  createOpeningMessage,
  createEmptyThread,
  threadHasUserMessages,
  getDiscussedConceptIds,
  averageConfidence,
  MAX_FEYNMAN_AI_TURNS,
} from '@/api/ai/prompts/feynman';
import { useCompleteSession } from '@/hooks/study/useCompleteSession';
import { useAbandonSession } from '@/hooks/study/useAbandonSession';

function ensureThread(threads, conceptId) {
  const existing = threads[conceptId];
  if (!existing) {
    return {
      ...createEmptyThread(),
      messages: [createOpeningMessage(conceptId)],
    };
  }
  if (!existing.messages.length) {
    return {
      ...existing,
      messages: [createOpeningMessage(conceptId)],
    };
  }
  return existing;
}

function initState(concepts) {
  const startId = pickRandomConceptId(concepts) || concepts[0]?.id || '';
  return {
    currentConceptId: startId,
    conceptThreads: startId
      ? { [startId]: ensureThread({}, startId) }
      : {},
  };
}

export default function FeynmanSession({ session, activity, module, journeyId }) {
  const concepts = module?.knowledgeMap?.concepts ?? [];
  const [{ currentConceptId, conceptThreads }, setSessionState] = useState(() => initState(concepts));
  const [finishedConceptIds, setFinishedConceptIds] = useState([]);
  const [showTopicPicker, setShowTopicPicker] = useState(false);
  const [pickerConceptId, setPickerConceptId] = useState('');
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [phase, setPhase] = useState('active');
  const [summaryThreads, setSummaryThreads] = useState(null);

  const { completeSessionInBackground } = useCompleteSession();
  const abandonSession = useAbandonSession();
  const returnPath = `/journeys/${journeyId}/modules/${module?.moduleId}`;

  const currentThread = conceptThreads[currentConceptId] ?? createEmptyThread();
  const messages = currentThread.messages;
  const aiTurnCount = currentThread.aiTurnCount;
  const atTurnLimit = aiTurnCount >= MAX_FEYNMAN_AI_TURNS;

  const lastAiMessage = [...messages].reverse().find((m) => m.role === 'ai' && m.type !== 'opening');
  const hasUserMessages = threadHasUserMessages(currentThread);

  const undiscussedCount = useMemo(
    () => concepts.filter((c) => !finishedConceptIds.includes(c.id)).length,
    [concepts, finishedConceptIds],
  );

  const switchableConcepts = useMemo(
    () => concepts.filter((c) => !finishedConceptIds.includes(c.id)),
    [concepts, finishedConceptIds],
  );

  const pickerOptions = useMemo(() => concepts.filter((c) => {
    if (finishedConceptIds.includes(c.id)) return false;
    if (c.id === currentConceptId && threadHasUserMessages(currentThread)) return false;
    return true;
  }), [concepts, finishedConceptIds, currentConceptId, currentThread]);

  const showDone = hasUserMessages && (lastAiMessage?.readyToComplete || atTurnLimit);

  const handleExit = () => {
    abandonSession({ sessionId: session.sessionId, journeyId, returnPath });
  };

  const handleExploreAnother = useCallback(() => {
    const remaining = concepts.filter((c) => {
      if (finishedConceptIds.includes(c.id)) return false;
      if (c.id === currentConceptId && threadHasUserMessages(currentThread)) return false;
      return true;
    });

    if (!remaining.length) {
      toast.message('All concepts covered — finish the session when you\'re ready.');
      setShowTopicPicker(false);
      return;
    }

    setPickerConceptId(remaining[0].id);
    setShowTopicPicker(true);
  }, [concepts, currentConceptId, currentThread, finishedConceptIds]);

  const handleConfirmTopic = useCallback(() => {
    if (!pickerConceptId) return;

    setFinishedConceptIds((prev) => {
      const next = new Set(prev);
      if (threadHasUserMessages(currentThread)) next.add(currentConceptId);
      return Array.from(next);
    });

    setSessionState((prev) => {
      const nextThreads = { ...prev.conceptThreads };
      nextThreads[pickerConceptId] = ensureThread(prev.conceptThreads, pickerConceptId);
      return { currentConceptId: pickerConceptId, conceptThreads: nextThreads };
    });
    setDraft('');
    setShowTopicPicker(false);
  }, [pickerConceptId, currentConceptId, currentThread]);

  const handleConceptChange = useCallback((newConceptId) => {
    setSessionState((prev) => {
      const nextThreads = { ...prev.conceptThreads };
      nextThreads[newConceptId] = ensureThread(prev.conceptThreads, newConceptId);
      return { currentConceptId: newConceptId, conceptThreads: nextThreads };
    });
    setDraft('');
  }, []);

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || sending || atTurnLimit || !currentConceptId) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      role: 'user',
      text,
    };

    const messagesWithUser = [...messages, userMsg];
    setSessionState((prev) => ({
      ...prev,
      conceptThreads: {
        ...prev.conceptThreads,
        [currentConceptId]: {
          ...prev.conceptThreads[currentConceptId],
          messages: messagesWithUser,
        },
      },
    }));
    setDraft('');
    setSending(true);

    try {
      const concept = concepts.find((c) => c.id === currentConceptId);
      const history = messagesWithUser
        .filter((m) => m.type !== 'opening')
        .map((m) => ({ role: m.role, text: m.text }));

      const turnNumber = aiTurnCount + 1;
      const data = await feynmanConversationTurn({
        concept,
        moduleName: module?.name,
        knowledgeMap: module?.knowledgeMap,
        conversationHistory: history,
        turnNumber,
        maxTurns: MAX_FEYNMAN_AI_TURNS,
      });

      const aiMsg = {
        id: `ai-${Date.now()}`,
        role: 'ai',
        text: String(data?.reply ?? '').trim() || 'Thanks — can you say a bit more about that?',
        readyToComplete: Boolean(data?.readyToComplete) || turnNumber >= MAX_FEYNMAN_AI_TURNS,
      };

      setSessionState((prev) => {
        const thread = prev.conceptThreads[currentConceptId];
        return {
          ...prev,
          conceptThreads: {
            ...prev.conceptThreads,
            [currentConceptId]: {
              ...thread,
              messages: [...messagesWithUser, aiMsg],
              aiTurnCount: turnNumber,
            },
          },
        };
      });
    } catch (err) {
      toast.error(err.message || 'Failed to get a response');
      setSessionState((prev) => ({
        ...prev,
        conceptThreads: {
          ...prev.conceptThreads,
          [currentConceptId]: {
            ...prev.conceptThreads[currentConceptId],
            messages,
          },
        },
      }));
      setDraft(text);
    } finally {
      setSending(false);
    }
  };

  const handleDone = async () => {
    const discussedIds = getDiscussedConceptIds(conceptThreads);
    if (!discussedIds.length) {
      toast.error('Explain at least one concept before finishing.');
      return;
    }

    setSummarizing(true);
    try {
      const enriched = { ...conceptThreads };
      await Promise.all(discussedIds.map(async (conceptId) => {
        const concept = concepts.find((c) => c.id === conceptId);
        const thread = enriched[conceptId];
        const history = thread.messages
          .filter((m) => m.type !== 'opening')
          .map((m) => ({ role: m.role, text: m.text }));

        const summary = await feynmanSummarizeConcept({
          concept,
          moduleName: module?.name,
          knowledgeMap: module?.knowledgeMap,
          conversationHistory: history,
        });

        enriched[conceptId] = {
          ...thread,
          summary: {
            confidencePercent: summary?.confidencePercent ?? 0,
            thoroughness: summary?.thoroughness ?? '',
            strengths: summary?.strengths ?? [],
            weaknesses: summary?.weaknesses ?? [],
            suggestedNextSteps: summary?.suggestedNextSteps ?? [],
          },
        };
      }));

      const overallScore = averageConfidence(enriched, discussedIds);
      const sessionData = {
        conceptThreads: enriched,
        discussedConceptIds: discussedIds,
        overallScore,
      };

      setSummaryThreads(enriched);
      setPhase('summary');

      completeSessionInBackground({
        sessionId: session.sessionId,
        journeyId,
        activityId: activity.activityId,
        activity,
        sessionData,
        score: overallScore,
        outcomeSummary: {
          confidence: overallScore,
          conceptsDiscussed: discussedIds.length,
        },
        startedAt: session.startedAt,
      });
    } catch (err) {
      toast.error(err.message || 'Failed to generate summary');
    } finally {
      setSummarizing(false);
    }
  };

  if (concepts.length === 0) {
    return (
      <div className="study-mode-view feynman-mode-view">
        <p className="journeys-status">No concepts available for this module.</p>
      </div>
    );
  }

  if (summarizing) {
    return (
      <AiGenerationLoading
        action="feynmanSummarizeConcept"
        className="study-mode-view feynman-mode-view"
      />
    );
  }

  if (phase === 'summary' && summaryThreads) {
    return (
      <FeynmanSummary
        conceptThreads={summaryThreads}
        concepts={concepts}
        discussedConceptIds={getDiscussedConceptIds(summaryThreads)}
        returnHref="/home"
      />
    );
  }

  return (
    <FeynmanConversation
      concepts={switchableConcepts.length ? switchableConcepts : concepts}
      currentConceptId={currentConceptId}
      messages={messages}
      draft={draft}
      onDraftChange={setDraft}
      onSend={handleSend}
      onConceptChange={handleConceptChange}
      onDone={handleDone}
      onExploreAnother={handleExploreAnother}
      onConfirmTopic={handleConfirmTopic}
      showTopicPicker={showTopicPicker}
      pickerConceptId={pickerConceptId}
      onPickerConceptChange={setPickerConceptId}
      pickerOptions={pickerOptions}
      onExit={handleExit}
      sending={sending}
      showDone={showDone}
      aiTurnCount={aiTurnCount}
      atTurnLimit={atTurnLimit}
      undiscussedCount={undiscussedCount}
    />
  );
}
