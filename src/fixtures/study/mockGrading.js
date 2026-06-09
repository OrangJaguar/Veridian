/** Client-side mock grading for Stage C modes (until geminiStudy is deployed). */

const FEYNMAN_RESPONSES = {
  transformer: {
    aiFeedback: 'You explained that Transformers use attention to connect tokens — good start. You mentioned parallel training but did not explain *why* self-attention replaces recurrence or how query/key/value interact. A complete answer links attention weights to contextual representations.',
    missingConcepts: ['query-key-value mechanism', 'positional encoding'],
    misconceptionsDetected: [],
    weakestPoint: 'The role of scaled dot-product attention in building contextual embeddings.',
    followUpQuestion: 'How does self-attention let each token gather context from every other token in one layer?',
    overallConfidenceRating: 'partial',
  },
  llm: {
    aiFeedback: 'You captured that LLMs are large text models trained on next-token prediction. Missing: scale effects (emergent abilities), pretraining vs fine-tuning, and why hallucinations occur despite fluent output.',
    missingConcepts: ['pretraining objective', 'hallucination causes'],
    misconceptionsDetected: ['LLMs retrieve facts from a database'],
    weakestPoint: 'Distinguishing statistical pattern matching from grounded factual knowledge.',
    followUpQuestion: 'Why can an LLM sound confident while stating a false fact?',
    overallConfidenceRating: 'partial',
  },
  default: {
    aiFeedback: 'Solid plain-language explanation — you hit the main idea. To reach mastery, add a concrete example and name one limitation or failure mode of the concept.',
    missingConcepts: ['concrete example', 'limitation'],
    misconceptionsDetected: [],
    weakestPoint: 'Connecting the concept to a real-world AI system or historical milestone.',
    followUpQuestion: 'Can you give an example where this concept matters in a modern AI product?',
    overallConfidenceRating: 'partial',
  },
};

const FREE_RECALL_RESPONSE = {
  coveragePercent: 68,
  conceptsCovered: ['dartmouth', 'symbolic-ai', 'supervised', 'transformer', 'alignment'],
  conceptsMissed: ['backprop', 'hallucination', 'ai-winter'],
  incorrectIdeas: [],
  aiGradingSummary: 'You recalled the historical arc (Dartmouth → symbolic AI) and modern themes (transformers, alignment). Gaps: AI winters, backpropagation mechanics, and hallucination as an LLM failure mode. Structure was logical — deepen technical links between ML fundamentals and modern systems.',
  nextConceptRecommendation: 'Review backpropagation and how it enabled the deep learning era.',
};

export function mockGradeFeynman({ concept }) {
  const term = concept?.term?.toLowerCase() ?? '';
  const key = term.includes('transformer') ? 'transformer'
    : term.includes('language') || term.includes('llm') ? 'llm'
      : 'default';
  return FEYNMAN_RESPONSES[key];
}

export function mockGradeFreeRecall({ studentResponse, hintsUsed }) {
  const len = (studentResponse ?? '').trim().length;
  const coverage = Math.min(95, Math.max(25, Math.round(len / 12) - hintsUsed * 8));
  return {
    ...FREE_RECALL_RESPONSE,
    coveragePercent: coverage,
    aiGradingSummary: coverage >= 70
      ? FREE_RECALL_RESPONSE.aiGradingSummary
      : 'Your recall is developing — expand on ML fundamentals (loss, gradients, backprop) and modern risks (hallucination, bias).',
  };
}
