/**
 * Starter AI journey — Stage A learning guide (v2).
 * Layout: title → zigzag explanation → worked example → check-in → YouTube → transition.
 */
export const LEARNING_GUIDE_CONTENT = {
  contentVersion: 2,
  sections: [
    {
      sectionId: 'ai-what',
      title: 'What Is Artificial Intelligence?',
      explanation:
        'Artificial intelligence (AI) is the field of building computer systems that perform tasks we usually associate with human intelligence — recognizing images, understanding language, making decisions, or playing strategy games. You do not need to simulate a brain to build useful AI; you need a clear problem, data or rules, and a way to measure success.\n\n'
        + 'Early researchers asked whether machines could "think." Today the practical question is different: should we hand-write explicit rules for every situation, or let a system learn patterns from examples? Most modern products use learning, but rule-based systems still appear in safety-critical software where behavior must be auditable.\n\n'
        + 'AI is not one technique. It includes search (finding paths in a maze), logic (proving statements), probability (handling uncertainty), and neural networks (learning layered representations). Think of AI as a toolbox — spam filters, voice assistants, and self-driving perception stacks all use different combinations.\n\n'
        + 'As a beginner, focus on two habits: define what "correct" means for your task, and test on examples the system has never seen. Those habits transfer whether you are studying symbolic AI, machine learning, or large language models.',
      workedExamples: [{
        scenario: 'Your email app needs to flag spam without you writing thousands of rules by hand.',
        steps: [
          'Start by collecting emails people already labeled as spam or not spam — these labels are your ground truth.',
          'Turn each email into features the computer can use: word counts, links, sender reputation, and so on.',
          'Train a classifier whose job is to minimize mistakes on those labeled examples.',
          'Hold back a separate test set the model never trained on, and check accuracy there before shipping.',
        ],
        answer: 'You built a supervised learning spam filter — a classic applied AI pipeline.',
        reasoning: 'Learning the decision boundary from data scales better than maintaining endless hand-written rules as spammers change tactics.',
      }],
      checkInQuestion: {
        question: 'Which best describes most modern applied AI?',
        type: 'multipleChoice',
        options: ['Only logical rule systems', 'Learning patterns from data', 'Copying human neurons exactly', 'Random guessing at scale'],
        correctAnswer: 'Learning patterns from data',
        explanation: 'Production AI usually learns statistical patterns from data, often combined with rules for safety.',
      },
      externalSearchSuggestions: ['what is artificial intelligence for beginners', 'AI vs machine learning explained simply'],
      transitionText: 'Next we trace how the field began at Dartmouth — and why excitement sometimes turned into "AI winters."',
    },
    {
      sectionId: 'ai-symbolic',
      title: 'The Symbolic AI Era',
      explanation:
        'From the 1956 Dartmouth workshop through much of the 1980s, AI research focused on symbolic reasoning: represent knowledge as facts and rules, then search or infer answers. If you have written "if fever and cough, consider flu," you already understand the spirit of symbolic AI.\n\n'
        + 'Programs like ELIZA mimicked conversation using pattern rules. Expert systems such as MYCIN diagnosed blood infections by chaining medical IF–THEN rules. In narrow domains they were impressive and explainable — you could trace exactly which rules fired to reach a conclusion.\n\n'
        + 'The hard part was scale. Real-world knowledge is messy, ambiguous, and constantly changing. Encoding millions of rules by interviewing experts became slow and expensive. When headline promises outpaced delivery, funding dropped — those downturns are called AI winters.\n\n'
        + 'Symbolic AI never vanished. Tax software, configuration engines, and formal verification still rely on explicit logic. But the field opened to statistical learning when hand-crafted knowledge alone could not keep up with open-ended problems like vision and speech.',
      workedExamples: [{
        scenario: 'A hospital wants a rule-based assistant to suggest antibiotics for certain blood infections.',
        steps: [
          'Interview infectious-disease experts and extract their diagnostic IF–THEN rules.',
          'Encode facts (lab results, symptoms) and rules in a knowledge base the engine can query.',
          'Run forward or backward chaining: start from symptoms or from a suspected diagnosis.',
          'Return the suggested treatment plus a trace showing which rules contributed.',
        ],
        answer: 'An explainable rule-based recommendation with an audit trail clinicians can review.',
        reasoning: 'Symbolic systems shine when experts can articulate stable rules — but maintaining rules for every edge case in the open world is costly.',
      }],
      checkInQuestion: {
        question: 'What limitation most contributed to AI winters in the symbolic era?',
        type: 'multipleChoice',
        options: ['Computers were too fast', 'Knowledge was hard to encode at scale', 'Neural networks were illegal', 'Training data was too abundant'],
        correctAnswer: 'Knowledge was hard to encode at scale',
        explanation: 'Hand-crafting rules for complex, changing environments could not match real-world breadth.',
      },
      externalSearchSuggestions: ['Dartmouth conference 1956 AI explained', 'expert systems MYCIN history'],
      transitionText: 'The field then pivoted toward learning from data — the statistical machine learning revolution.',
    },
    {
      sectionId: 'ai-ml-revolution',
      title: 'The Machine Learning Revolution',
      explanation:
        'Instead of programming every rule, researchers trained models on examples. Given inputs and correct outputs, the system adjusts internal parameters to reduce prediction error. This shift unlocked problems where rules were too hard to write but examples were plentiful.\n\n'
        + 'Classic tools included support vector machines and random forests. Neural networks returned to prominence when more data, better algorithms (backpropagation), and GPUs made deep learning practical. The pattern is consistent: represent data as numbers, define a loss function, optimize with gradient descent.\n\n'
        + 'A loss function scores how wrong predictions are — lower is better. Gradient descent nudges parameters in the direction that reduces loss. Backpropagation efficiently computes how each weight contributed to the error in layered networks.\n\n'
        + 'Crucially, machine learning models can overfit: they memorize training examples and fail on new data. That is why we always reserve validation and test sets the model never trains on. Generalization — performance on unseen cases — is the real goal.',
      workedExamples: [{
        scenario: 'You want a model to read handwritten digits (0–9) from images.',
        steps: [
          'Use a labeled dataset like MNIST: thousands of 28×28 images with digit labels.',
          'Flatten each image into a vector and initialize model weights randomly.',
          'Run a forward pass: predict a digit, compare to the label, compute cross-entropy loss.',
          'Backpropagate gradients and update weights with gradient descent; repeat for many epochs.',
          'Stop when accuracy on a validation set stops improving — then evaluate on a final test set.',
        ],
        answer: 'A trained classifier that generalizes to new handwriting it has never seen.',
        reasoning: 'Separating train, validation, and test data prevents fooling yourself with memorization.',
      }],
      checkInQuestion: {
        question: 'What does a loss function measure?',
        type: 'multipleChoice',
        options: ['Hardware speed', 'How wrong predictions are', 'Dataset size', 'Number of layers'],
        correctAnswer: 'How wrong predictions are',
        explanation: 'Optimization minimizes loss — lower loss generally means better fit to the training objective.',
      },
      externalSearchSuggestions: ['gradient descent explained simply', 'MNIST neural network tutorial'],
      transitionText: 'Deep learning and transformers then scaled these ideas to language, vision, and multimodal AI.',
    },
    {
      sectionId: 'ai-deep',
      title: 'Deep Learning & Transformers',
      explanation:
        'Deep neural networks stack many layers so each level learns increasingly abstract features — edges, then shapes, then objects in vision; characters, words, syntax, and meaning in language. Depth enables hierarchical representations without hand-designing every feature.\n\n'
        + 'Recurrent models processed sequences one step at a time, which was slow to train at scale. The 2017 Transformer architecture replaced recurrence with self-attention: every token can attend to every other token in parallel, enabling training on massive text corpora.\n\n'
        + 'Large language models (LLMs) scale transformers to billions of parameters on internet-scale text. They excel at generation, summarization, and coding assistance, but they can hallucinate — producing confident, plausible, and wrong answers.\n\n'
        + 'Modern AI systems are therefore probabilistic engines, not oracles. Prompt design, retrieval of trusted sources, and human review remain essential when stakes are high.',
      workedExamples: [{
        scenario: 'Translate the English sentence "The bank by the river closed" into another language without confusing "bank" (riverbank vs. financial institution).',
        steps: [
          'Encode the full English sentence into contextual vectors — each word influenced by its neighbors.',
          'The decoder generates the target language one token at a time using prior outputs.',
          'Attention weights let each generated word focus on the most relevant source words.',
          'The model learns soft alignments from data instead of hand-written bilingual grammar rules.',
        ],
        answer: 'Context-aware translation where "bank" disambiguates via surrounding words.',
        reasoning: 'Attention focuses generation on the right context — critical for ambiguous words and long sentences.',
      }],
      checkInQuestion: {
        question: 'What architectural innovation defines modern LLMs?',
        type: 'multipleChoice',
        options: ['Recurrent LSTM only', 'Self-attention Transformers', 'Decision trees', 'Genetic algorithms'],
        correctAnswer: 'Self-attention Transformers',
        explanation: 'Transformers with self-attention underpin GPT-class and most contemporary language models.',
      },
      externalSearchSuggestions: ['attention is all you need explained', 'how transformers work 3blue1brown'],
      transitionText: 'With great capability comes responsibility — ethics and alignment close our historical overview.',
    },
    {
      sectionId: 'ai-ethics',
      title: 'AI in Society & Ethics',
      explanation:
        'Modern AI shapes hiring screens, medical triage, education tools, and public discourse. Benefits are real — faster diagnostics, personalized learning, accessibility tools — but harms appear when systems are deployed without measuring impact on real people.\n\n'
        + 'Biased training data can reproduce historical discrimination. Privacy risks grow when models memorize sensitive information. Training large models also carries environmental cost from energy use. Misuse for misinformation or automated harassment is an active policy concern.\n\n'
        + 'Alignment research asks how to ensure systems pursue human intent rather than unintended shortcuts. Transparency tools — model cards, audits, documentation — help teams and regulators understand limitations before deployment.\n\n'
        + 'Responsible AI pairs technical skill with context: Who is affected? What happens when the model is wrong? Building cool models is not enough; you must evaluate fit for the deployment environment.',
      workedExamples: [{
        scenario: 'A company deploys a résumé-screening model and later learns it disadvantages certain groups.',
        steps: [
          'Compare training data demographics to the actual applicant pool — look for representation gaps.',
          'Measure false positive and false negative rates separately across groups, not just overall accuracy.',
          'Check whether proxy features (school name, zip code) encode protected attributes indirectly.',
          'Mitigate with rebalancing, fairness constraints, or human review gates before final decisions.',
        ],
        answer: 'Documented disparities with a concrete mitigation plan before continued deployment.',
        reasoning: 'Bias often enters through historical data reflecting past discrimination — measure before you automate high-stakes decisions.',
      }],
      checkInQuestion: {
        question: 'What is an LLM hallucination?',
        type: 'multipleChoice',
        options: ['Hardware overheating', 'Confident false output', 'Training on too little data', 'Using too many parameters'],
        correctAnswer: 'Confident false output',
        explanation: 'Hallucinations are plausible-sounding but incorrect generations — a key reliability challenge.',
      },
      externalSearchSuggestions: ['AI alignment explained simply', 'algorithmic bias examples'],
      transitionText: 'You have the historical arc — next, practice core ML mechanics in Stage B.',
    },
  ],
  totalSections: 5,
  estimatedMinutes: 35,
  progress: { completedSectionIds: [] },
};
