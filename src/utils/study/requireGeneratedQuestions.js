/**
 * Ensure AI quiz output has the expected count before entering the runner.
 */
export function requireGeneratedQuestions(questions, expectedCount, label = 'questions') {
  const count = questions?.length ?? 0;
  if (count >= expectedCount) return questions;
  throw new Error(
    count === 0
      ? `AI returned no ${label}. Try again in a moment.`
      : `Expected ${expectedCount} ${label} but got ${count}. Try again.`,
  );
}
