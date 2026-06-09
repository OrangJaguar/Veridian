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

export const LEARNING_GUIDE_CONTENT = {
  sections: [
    {
      sectionId: 'ai-what',
      title: 'What Is Artificial Intelligence?',
      explanation: 'Artificial intelligence (AI) is the science of building systems that perform tasks requiring human-like perception, reasoning, or decision-making. Early researchers asked whether machines could think; modern AI asks which problems can be solved by learning from data versus being explicitly programmed. AI is not one technique — it spans search, logic, probability, and neural networks.',
      workedExamples: [{
        scenario: 'Classifying whether an email is spam',
        steps: [
          'Collect thousands of emails labeled spam or not spam',
          'Convert each email to numerical features (word counts, sender reputation)',
          'Train a classifier to minimize prediction errors on labeled data',
          'Evaluate on held-out emails the model never saw during training',
        ],
        answer: 'A supervised learning pipeline — classic applied AI',
        reasoning: 'The system learns a decision boundary from examples rather than hand-written rules, which scales better as spam tactics evolve.',
      }],
      checkInQuestion: {
        question: 'Which best describes modern applied AI?',
        type: 'multipleChoice',
        options: ['Only logical rule systems', 'Learning patterns from data', 'Copying human neurons exactly', 'Random guessing at scale'],
        correctAnswer: 'Learning patterns from data',
        explanation: 'Most production AI today learns statistical patterns from data, though hybrid systems still use rules.',
      },
      externalSearchSuggestions: ['history of artificial intelligence explained', 'what is AI vs machine learning'],
      narrationText: 'Artificial intelligence is about building systems that solve perception, reasoning, and decision tasks. Today, most applied AI learns from data instead of relying only on hand-written rules.',
      transitionText: 'Next we trace how the field began at Dartmouth and why expectations swung between hype and disappointment.',
    },
    {
      sectionId: 'ai-symbolic',
      title: 'The Symbolic AI Era',
      explanation: 'From the 1956 Dartmouth workshop through the 1980s, AI focused on symbolic reasoning: representing knowledge as facts and rules, then searching or inferring answers. Programs like ELIZA and expert systems MYCIN showed promise in narrow domains. Progress stalled when real-world knowledge proved too vast to encode manually — contributing to the first AI winters.',
      workedExamples: [{
        scenario: 'Expert system for medical diagnosis',
        steps: [
          'Interview domain experts to extract IF–THEN rules',
          'Encode rules and facts in a knowledge base',
          'Run inference engine to chain rules forward or backward',
          'Present conclusion with explanation trace',
        ],
        answer: 'Rule-based diagnosis with explainable reasoning',
        reasoning: 'Symbolic systems excelled where knowledge was stable and experts could articulate rules — but scaling to open-world problems was expensive.',
      }],
      checkInQuestion: {
        question: 'What limitation drove AI winters in the symbolic era?',
        type: 'multipleChoice',
        options: ['Computers were too fast', 'Knowledge was hard to encode at scale', 'Neural nets were illegal', 'Data was too abundant'],
        correctAnswer: 'Knowledge was hard to encode at scale',
        explanation: 'Hand-crafting rules for complex, changing environments could not keep pace with real-world complexity.',
      },
      externalSearchSuggestions: ['Dartmouth conference 1956 AI', 'expert systems MYCIN history'],
      narrationText: 'Early AI used symbols, rules, and search. Expert systems succeeded in narrow fields, but encoding all world knowledge by hand proved impractical, leading to reduced funding during AI winters.',
      transitionText: 'The field then pivoted toward learning from data — the statistical machine learning revolution.',
    },
    {
      sectionId: 'ai-ml-revolution',
      title: 'The Machine Learning Revolution',
      explanation: 'Instead of programming every rule, researchers trained models on examples. Support vector machines, random forests, and eventually neural networks won benchmarks by discovering patterns in high-dimensional data. Key ingredients: labeled datasets, loss functions measuring error, and optimization (especially gradient descent) to improve parameters iteratively.',
      workedExamples: [{
        scenario: 'Training a model to recognize handwritten digits',
        steps: [
          'Use MNIST: 60,000 labeled 28×28 pixel images',
          'Flatten pixels into input vector; initialize weights randomly',
          'Forward pass: compute predicted digit; calculate cross-entropy loss',
          'Backward pass: backpropagate gradients; update weights with gradient descent',
          'Repeat until validation accuracy plateaus',
        ],
        answer: 'Neural network achieving ~98%+ on MNIST with proper training',
        reasoning: 'Backpropagation made deep networks trainable; data and compute turned theory into practical vision systems.',
      }],
      checkInQuestion: {
        question: 'What does a loss function measure?',
        type: 'multipleChoice',
        options: ['Hardware speed', 'How wrong predictions are', 'Dataset size', 'Number of layers'],
        correctAnswer: 'How wrong predictions are',
        explanation: 'Optimization minimizes loss — lower loss generally means better fit to training objectives.',
      },
      externalSearchSuggestions: ['gradient descent explained simply', 'MNIST neural network tutorial'],
      narrationText: 'Machine learning trains models on examples. Loss functions score errors; gradient descent and backpropagation adjust parameters until predictions improve.',
      transitionText: 'Deep learning and transformers then scaled these ideas to language, vision, and multimodal AI.',
    },
    {
      sectionId: 'ai-deep',
      title: 'Deep Learning & Transformers',
      explanation: 'Deep neural networks stack many layers to learn hierarchical features — edges, then shapes, then objects in vision; morphemes, syntax, semantics in language. The 2017 Transformer replaced recurrence with self-attention, enabling parallel training on massive text corpora. Large language models (LLMs) emerge from scaling transformers — billions of parameters, emergent capabilities, and new risks like hallucination.',
      workedExamples: [{
        scenario: 'Why attention helps translation',
        steps: [
          'Encode source sentence into contextual vectors',
          'Decoder generates each target word one step at a time',
          'Attention weights connect each output word to relevant source words',
          'Model learns alignments without explicit linguistic rules',
        ],
        answer: 'Flexible soft alignments between languages',
        reasoning: 'Attention lets the model focus on the right context per token — critical for long sentences and ambiguous words.',
      }],
      checkInQuestion: {
        question: 'What architectural innovation defines modern LLMs?',
        type: 'multipleChoice',
        options: ['Recurrent LSTM only', 'Self-attention Transformers', 'Decision trees', 'Genetic algorithms'],
        correctAnswer: 'Self-attention Transformers',
        explanation: 'Transformers with self-attention are the dominant architecture behind GPT-class models.',
      },
      externalSearchSuggestions: ['attention is all you need explained', 'how transformers work 3blue1brown'],
      narrationText: 'Deep networks learn layers of abstraction. Transformers use self-attention to model relationships across sequences, powering today\'s large language models.',
      transitionText: 'With great capability comes responsibility — ethics and alignment close our overview.',
    },
    {
      sectionId: 'ai-ethics',
      title: 'AI in Society & Ethics',
      explanation: 'Modern AI affects hiring, healthcare, education, and public discourse. Risks include biased training data, privacy erosion, environmental cost of training, and misuse for misinformation. Alignment research seeks to ensure systems follow human intent; regulation and transparency (model cards, audits) are active policy debates. Responsible AI pairs technical skill with critical evaluation of deployment context.',
      workedExamples: [{
        scenario: 'Detecting bias in a résumé screening model',
        steps: [
          'Audit training data demographics vs. applicant pool',
          'Measure false positive/negative rates across groups',
          'Check whether proxy features encode protected attributes',
          'Mitigate via rebalancing, fairness constraints, or human review',
        ],
        answer: 'Documented disparity with mitigation plan before deployment',
        reasoning: 'Bias often enters through historical data reflecting past discrimination — measurement must precede blind deployment.',
      }],
      checkInQuestion: {
        question: 'What is an LLM hallucination?',
        type: 'multipleChoice',
        options: ['Hardware overheating', 'Confident false output', 'Training on too little data', 'Using too many parameters'],
        correctAnswer: 'Confident false output',
        explanation: 'Hallucinations are plausible-sounding but incorrect generations — a key reliability challenge.',
      },
      externalSearchSuggestions: ['AI alignment explained', 'algorithmic bias examples'],
      narrationText: 'Powerful AI raises questions of bias, privacy, alignment, and misuse. Building AI responsibly requires technical rigor and ethical scrutiny of real-world impact.',
      transitionText: 'You have the historical arc — next, practice core ML mechanics in Stage B.',
    },
  ],
  totalSections: 5,
  estimatedMinutes: 25,
  progress: { completedSectionIds: [] },
};

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
