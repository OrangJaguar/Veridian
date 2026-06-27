import { invokeToolsAssistant } from '@/api/ai/toolsAssistantClient';
import {
  parseCommandLocally,
  parseSlashCommand,
  formatEventPreview,
  formatTaskPreview,
} from '@/lib/tools/command-parser';
import { answerQueryLocally, buildAssistantContext } from '@/lib/tools/command-query';
import { executeSlashCommand, parseSlashPrefix } from '@/lib/tools/command-registry';

function normalizeGeminiResult(data) {
  if (!data || typeof data !== 'object') return null;
  const intent = data.intent;
  if (intent === 'answer' && data.answer) {
    return { type: 'answer', answer: String(data.answer).slice(0, 600) };
  }
  if (intent === 'clarify' && data.clarify) {
    return { type: 'answer', answer: String(data.clarify).slice(0, 400) };
  }
  if (intent === 'create_task' && data.task?.title) {
    const task = {
      title: String(data.task.title).slice(0, 120),
      due: data.task.due ? String(data.task.due) : '',
      priority: data.task.priority || 'medium',
    };
    return {
      type: 'confirm',
      intent: 'create_task',
      task,
      preview: formatTaskPreview(task),
    };
  }
  if (intent === 'create_events' && Array.isArray(data.events) && data.events.length) {
    const events = data.events.slice(0, 3).map((e) => ({
      title: String(e.title || 'Untitled').slice(0, 120),
      start: String(e.start),
      end: String(e.end),
    }));
    return {
      type: 'confirm',
      intent: 'create_events',
      events,
      preview: events.map(formatEventPreview).join('\n'),
    };
  }
  if (data.answer) {
    return { type: 'answer', answer: String(data.answer).slice(0, 600) };
  }
  return null;
}

function buildConfirmResult(local) {
  if (local.intent === 'create_events' && local.events?.length) {
    return {
      type: 'confirm',
      intent: 'create_events',
      events: local.events,
      preview: local.events.map(formatEventPreview).join('\n'),
      source: 'local',
    };
  }
  if (local.intent === 'create_task' && local.task?.title) {
    return {
      type: 'confirm',
      intent: 'create_task',
      task: local.task,
      preview: formatTaskPreview(local.task),
      source: 'local',
    };
  }
  return null;
}

/**
 * @param {string} text
 * @param {{ tasks, events, schedule, pageContext?, signal?: AbortSignal }} ctx
 */
export async function runCommandAssistant(text, ctx) {
  const { commandId } = parseSlashPrefix(text);
  if (commandId) {
    const slash = executeSlashCommand(commandId, parseSlashPrefix(text).remainder, ctx);
    if (slash) return slash;
  }

  const local = parseSlashCommand(text);

  if (local.confidence === 'high' && local.intent === 'query') {
    const { answer } = answerQueryLocally(local.query, ctx);
    return { type: 'answer', answer, source: 'local' };
  }

  const confirm = buildConfirmResult(local);
  if (confirm && local.confidence === 'high') return confirm;

  /* Low confidence → Gemini fallback */
  try {
    const context = buildAssistantContext(ctx);
    const gemini = await invokeToolsAssistant({
      text: local.commandId ? parseSlashPrefix(text).remainder || text : text,
      context,
      signal: ctx.signal,
    });
    const normalized = normalizeGeminiResult(gemini);
    if (normalized) return { ...normalized, source: 'gemini' };
  } catch {
    /* unavailable */
  }

  const lowConfirm = buildConfirmResult(local);
  if (lowConfirm && local.confidence === 'low') return { ...lowConfirm, source: 'local' };

  if (local.intent === 'query' || local.confidence === 'low') {
    const { answer } = answerQueryLocally(local.query || text, ctx);
    return { type: 'answer', answer, source: 'local-fallback' };
  }

  return {
    type: 'answer',
    answer: 'Try / for commands — e.g. /task, /event, /ask — or ask: "How many events today?"',
    source: 'fallback',
  };
}
