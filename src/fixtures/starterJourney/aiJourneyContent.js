/** Manually authored starter journey — Artificial Intelligence (3 modules, stages A/B/C). */

export const STARTER_JOURNEY_META = {
  subject: 'Computer Science',
  title: 'Artificial Intelligence — From Origins to Modern Systems',
  priorKnowledge: 'some',
  examDateOffsetDays: 21,
};

export const STARTER_MODULES = [
  {
    name: 'Origins & History of AI',
    description: 'Dartmouth to deep learning — how the field was born and evolved',
    stage: 'A',
    masteryScore: 0,
    knowledgeMap: {
      concepts: [
        { id: 'dartmouth', term: 'Dartmouth Conference (1956)', definition: 'Workshop where "artificial intelligence" was coined; launched symbolic AI research.' },
        { id: 'symbolic-ai', term: 'Symbolic AI', definition: 'Rule-based systems using logic and explicit knowledge representation.' },
        { id: 'ai-winter', term: 'AI Winter', definition: 'Periods of reduced funding and interest after overpromised results.' },
        { id: 'expert-systems', term: 'Expert Systems', definition: '1980s commercial AI using encoded human expertise (e.g. MYCIN).' },
        { id: 'ml-shift', term: 'Statistical ML Shift', definition: 'Move from hand-coded rules to learning patterns from data.' },
      ],
    },
  },
  {
    name: 'Machine Learning Fundamentals',
    description: 'How models learn — data, loss, optimization, and neural networks',
    stage: 'B',
    masteryScore: 0,
    knowledgeMap: {
      concepts: [
        { id: 'supervised', term: 'Supervised Learning', definition: 'Learning a mapping from labeled input–output pairs.' },
        { id: 'loss', term: 'Loss Function', definition: 'Scalar measure of prediction error the model minimizes.' },
        { id: 'gradient-descent', term: 'Gradient Descent', definition: 'Iterative optimization that steps opposite the loss gradient.' },
        { id: 'backprop', term: 'Backpropagation', definition: 'Efficient algorithm to compute gradients in neural networks via chain rule.' },
        { id: 'overfitting', term: 'Overfitting', definition: 'Model memorizes training data and fails to generalize.' },
      ],
    },
  },
  {
    name: 'Modern AI Systems & Ethics',
    description: 'Transformers, large language models, alignment, and societal impact',
    stage: 'C',
    masteryScore: 0,
    knowledgeMap: {
      concepts: [
        { id: 'transformer', term: 'Transformer Architecture', definition: 'Attention-based model enabling parallel sequence processing; basis of modern LLMs.' },
        { id: 'llm', term: 'Large Language Model', definition: 'Billions-parameter model trained on text to predict/generate language.' },
        { id: 'hallucination', term: 'Hallucination', definition: 'Confident but incorrect or fabricated model output.' },
        { id: 'alignment', term: 'AI Alignment', definition: 'Ensuring AI systems pursue intended human goals and values.' },
        { id: 'bias', term: 'Algorithmic Bias', definition: 'Systematic unfair outcomes from biased training data or objectives.' },
      ],
    },
  },
];

export { LEARNING_GUIDE_CONTENT } from '@/fixtures/starterJourney/learningGuideContent';

export const PRACTICE_QUIZ_QUESTIONS = [
  {
    id: 'ml-q1', type: 'multipleChoice',
    stem: 'In supervised learning, the training set provides:',
    options: ['Only inputs', 'Input–output pairs', 'Random labels', 'Unlabeled clusters'],
    correctAnswer: 'Input–output pairs', explanation: 'Supervised learning learns f(x) ≈ y from labeled examples.',
    conceptId: 'supervised',
  },
  {
    id: 'ml-q2', type: 'multipleChoice',
    stem: 'The purpose of a loss function is to:',
    options: ['Increase model size', 'Quantify prediction error', 'Shuffle the dataset', 'Store hyperparameters'],
    correctAnswer: 'Quantify prediction error', explanation: 'Optimization minimizes loss to improve predictions.',
    conceptId: 'loss',
  },
  {
    id: 'ml-q3', type: 'trueFalse',
    stem: 'Gradient descent updates parameters in the direction that increases loss fastest.',
    options: ['True', 'False'],
    correctAnswer: 'False', explanation: 'Gradient descent steps opposite the gradient (downhill on the loss surface).',
    conceptId: 'gradient-descent',
  },
  {
    id: 'ml-q4', type: 'multipleChoice',
    stem: 'Backpropagation is primarily used to:',
    options: ['Collect training data', 'Compute gradients in neural networks', 'Deploy models to production', 'Visualize attention maps'],
    correctAnswer: 'Compute gradients in neural networks', explanation: 'Backprop applies the chain rule layer-by-layer for efficient gradient computation.',
    conceptId: 'backprop',
  },
  {
    id: 'ml-q5', type: 'multipleChoice',
    stem: 'A model with near-perfect training accuracy but poor test accuracy is likely:',
    options: ['Underfitting', 'Overfitting', 'Well-regularized', 'Using too little data only'],
    correctAnswer: 'Overfitting', explanation: 'Memorizing training noise hurts generalization to unseen data.',
    conceptId: 'overfitting',
  },
  {
    id: 'ml-q6', type: 'multipleChoice',
    stem: 'Which is an example of unsupervised learning?',
    options: ['Spam classification with labels', 'Customer segmentation without labels', 'House price regression', 'Image labeling with tags'],
    correctAnswer: 'Customer segmentation without labels', explanation: 'Clustering discovers structure without explicit output labels.',
    conceptId: 'supervised',
  },
  {
    id: 'ml-q7', type: 'multipleChoice',
    stem: 'A validation set is used to:',
    options: ['Train more epochs always', 'Tune hyperparameters and detect overfitting', 'Replace the test set', 'Store model weights'],
    correctAnswer: 'Tune hyperparameters and detect overfitting', explanation: 'Validation provides unbiased feedback during development; test set is held out for final evaluation.',
    conceptId: 'overfitting',
  },
  {
    id: 'ml-q8', type: 'multipleChoice',
    stem: 'The chain rule in backpropagation connects:',
    options: ['Hardware layers', 'Gradients across composed functions', 'Database tables', 'Loss to dataset size only'],
    correctAnswer: 'Gradients across composed functions', explanation: 'Neural nets are nested functions; chain rule propagates ∂loss/∂weight through layers.',
    conceptId: 'backprop',
  },
  {
    id: 'ml-q9', type: 'trueFalse',
    stem: 'Mini-batch gradient descent uses the entire dataset for each update.',
    options: ['True', 'False'],
    correctAnswer: 'False', explanation: 'Mini-batch uses a subset per step — faster and noisier than full-batch descent.',
    conceptId: 'gradient-descent',
  },
  {
    id: 'ml-q10', type: 'multipleChoice',
    stem: 'Regularization (e.g. L2 weight decay) helps combat:',
    options: ['Underfitting only', 'Overfitting', 'Data collection', 'GPU memory limits'],
    correctAnswer: 'Overfitting', explanation: 'Penalizing large weights encourages simpler models that generalize better.',
    conceptId: 'overfitting',
  },
];

export const FLASHCARD_DECK = {
  title: 'ML Fundamentals Deck',
  cards: [
    { front: 'Supervised learning', back: 'Learning from labeled input–output pairs to predict outputs for new inputs.' },
    { front: 'Unsupervised learning', back: 'Finding structure (clusters, dimensions) in data without labels.' },
    { front: 'Loss function', back: 'Scalar measuring how wrong predictions are; minimized during training.' },
    { front: 'Gradient descent', back: 'Iterative update: θ ← θ − η∇L(θ) stepping downhill on the loss surface.' },
    { front: 'Learning rate (η)', back: 'Step size in gradient descent; too large diverges, too small trains slowly.' },
    { front: 'Backpropagation', back: 'Efficient gradient computation in neural nets via chain rule from output to weights.' },
    { front: 'Epoch', back: 'One full pass through the entire training dataset.' },
    { front: 'Overfitting', back: 'Low training error, high test error — model memorized noise.' },
    { front: 'Bias–variance tradeoff', back: 'Simple models underfit (high bias); complex models overfit (high variance).' },
    { front: 'Activation function', back: 'Nonlinearity (ReLU, sigmoid) enabling networks to learn nonlinear mappings.' },
    { front: 'Train / validation / test split', back: 'Train fits weights; validation tunes hyperparameters; test estimates final performance.' },
    { front: 'Cross-entropy loss', back: 'Common classification loss: −Σ y log ŷ penalizing confident wrong predictions.' },
  ],
};

export const INTERLEAVED_QUESTIONS = [
  { id: 'int-q1', type: 'multipleChoice', stem: 'The term "artificial intelligence" was coined at which event?', options: ['NeurIPS 2012', 'Dartmouth Conference 1956', 'Launch of ChatGPT', 'Turing\'s 1950 paper only'], correctAnswer: 'Dartmouth Conference 1956', explanation: 'McCarthy, Minsky, Shannon, and others organized the 1956 Dartmouth workshop.', conceptId: 'dartmouth' },
  { id: 'int-q2', type: 'multipleChoice', stem: 'Symbolic AI systems primarily represent knowledge as:', options: ['Pixel intensities', 'Facts and rules', 'Random vectors', 'GPU threads'], correctAnswer: 'Facts and rules', explanation: 'Expert systems used explicit IF–THEN rules and logical inference.', conceptId: 'symbolic-ai' },
  { id: 'int-q3', type: 'multipleChoice', stem: 'What does gradient descent minimize?', options: ['Dataset size', 'Loss function', 'Number of epochs', 'Batch count'], correctAnswer: 'Loss function', explanation: 'Parameters update to reduce loss on training objectives.', conceptId: 'loss' },
  { id: 'int-q4', type: 'trueFalse', stem: 'An AI winter refers to a surge in unlimited AI funding.', options: ['True', 'False'], correctAnswer: 'False', explanation: 'AI winters were periods of disillusionment and reduced investment.', conceptId: 'ai-winter' },
  { id: 'int-q5', type: 'multipleChoice', stem: 'Backpropagation relies on which mathematical tool?', options: ['Fourier transform', 'Chain rule', 'Bayes theorem only', 'Monte Carlo tree search'], correctAnswer: 'Chain rule', explanation: 'Gradients flow backward through composed layer functions.', conceptId: 'backprop' },
  { id: 'int-q6', type: 'multipleChoice', stem: 'Expert systems like MYCIN were strongest when:', options: ['Data was unstructured images', 'Domain knowledge could be encoded as rules', 'GPUs were abundant', 'Internet scale data existed'], correctAnswer: 'Domain knowledge could be encoded as rules', explanation: 'Narrow medical diagnosis domains suited rule-based encoding.', conceptId: 'expert-systems' },
  { id: 'int-q7', type: 'multipleChoice', stem: 'High training accuracy + low test accuracy suggests:', options: ['Underfitting', 'Overfitting', 'Perfect generalization', 'Need more features only'], correctAnswer: 'Overfitting', explanation: 'Classic overfitting signature on held-out evaluation.', conceptId: 'overfitting' },
  { id: 'int-q8', type: 'multipleChoice', stem: 'The shift from symbolic AI to statistical ML emphasized:', options: ['More hand-coded rules', 'Learning from data', 'Eliminating datasets', 'Removing math'], correctAnswer: 'Learning from data', explanation: 'ML scales via data-driven pattern discovery.', conceptId: 'ml-shift' },
];

export const JOURNEY_CHALLENGE_QUESTIONS = [
  ...INTERLEAVED_QUESTIONS,
  { id: 'chal-q9', type: 'multipleChoice', stem: 'Self-attention in Transformers allows:', options: ['Only sequential left-to-right processing', 'Each token to attend to all other tokens', 'Elimination of parameters', 'Training without data'], correctAnswer: 'Each token to attend to all other tokens', explanation: 'Attention computes pairwise relevance across the sequence.', conceptId: 'transformer' },
  { id: 'chal-q10', type: 'multipleChoice', stem: 'An LLM hallucination is:', options: ['Hardware failure', 'Confident incorrect generation', 'Too-small batch size', 'Legal regulation'], correctAnswer: 'Confident incorrect generation', explanation: 'Models can produce plausible but false statements.', conceptId: 'hallucination' },
  { id: 'chal-q11', type: 'multipleChoice', stem: 'AI alignment research focuses on:', options: ['Faster GPUs', 'Matching AI behavior to human intent', 'Deleting training data', 'Bigger screens'], correctAnswer: 'Matching AI behavior to human intent', explanation: 'Alignment addresses goal misspecification and value alignment.', conceptId: 'alignment' },
  { id: 'chal-q12', type: 'trueFalse', stem: 'Algorithmic bias can arise from historically biased training data.', options: ['True', 'False'], correctAnswer: 'True', explanation: 'Models learn patterns present in data — including past discrimination.', conceptId: 'bias' },
];

export const SYNTHESIS_QUESTIONS = [
  { id: 'syn-q1', type: 'multipleChoice', stem: 'How did the knowledge bottleneck of symbolic AI motivate the ML revolution?', options: ['Rules became cheaper to write', 'Manual encoding failed to scale; learning from data scaled better', 'GPUs removed need for data', 'Expert systems solved open-world reasoning'], correctAnswer: 'Manual encoding failed to scale; learning from data scaled better', explanation: 'Encoding all world knowledge by hand stalled progress; data-driven learning addressed scalability.', conceptId: 'ml-shift' },
  { id: 'syn-q2', type: 'multipleChoice', stem: 'Connecting backpropagation to the Transformer era, what thread continues?', options: ['Gradient-based learning at scale', 'Elimination of neural networks', 'Pure logic programming', 'No need for optimization'], correctAnswer: 'Gradient-based learning at scale', explanation: 'Modern LLMs still train via gradient descent on differentiable architectures.', conceptId: 'backprop' },
  { id: 'syn-q3', type: 'multipleChoice', stem: 'Why might an LLM deployment require both ML fundamentals and ethics knowledge?', options: ['Ethics replaces loss functions', 'Technical failures and societal harms interact (bias, hallucination, misuse)', 'Regulation removes need for testing', 'History is irrelevant to deployment'], correctAnswer: 'Technical failures and societal harms interact (bias, hallucination, misuse)', explanation: 'Responsible deployment spans capability limits and impact on people.', conceptId: 'alignment' },
  { id: 'syn-q4', type: 'trueFalse', stem: 'Overfitting concerns apply only to small 1980s models, not modern LLMs.', options: ['True', 'False'], correctAnswer: 'False', explanation: 'Generalization remains central — LLMs face related issues (memorization, benchmark overfitting).', conceptId: 'overfitting' },
  { id: 'syn-q5', type: 'multipleChoice', stem: 'An AI winter followed hype when symbolic systems could not:', options: ['Run on electricity', 'Deliver on broad real-world promises', 'Use English words', 'Store facts'], correctAnswer: 'Deliver on broad real-world promises', explanation: 'Overpromised general intelligence with brittle narrow tools hurt credibility.', conceptId: 'ai-winter' },
  { id: 'syn-q6', type: 'multipleChoice', stem: 'Best synthesis: modern AI progress came from combining ___ with ___ at scale.', options: ['Expert rules + slide rules', 'Learning algorithms + data/compute', 'Ethics + regulation only', 'Philosophy + poetry'], correctAnswer: 'Learning algorithms + data/compute', explanation: 'Algorithms (including backprop and attention), datasets, and compute drove the current era.', conceptId: 'transformer' },
];

/** Pick up to `count` questions from a pre-seeded bank (shuffle for variety). */
export function pickQuestions(bank, count) {
  const shuffled = [...bank].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}
