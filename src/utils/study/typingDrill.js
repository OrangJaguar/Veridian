export function normalizeForMatch(str) {
  return (str || '').toLowerCase().replace(/[^a-z0-9\s']/g, '').replace(/\s+/g, ' ').trim();
}

export function levenshtein(a, b) {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
}

export function chooseBestBlank(answerText) {
  const text = answerText || '';
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'to', 'of', 'in', 'on', 'for',
    'is', 'are', 'was', 'were', 'that', 'this', 'with', 'as', 'by', 'from',
  ]);
  const matches = [...text.matchAll(/[A-Za-z0-9'-]+/g)];
  if (!matches.length) return { masked: '______', expected: text.trim() };

  const best = matches
    .map((m) => {
      const token = m[0];
      const lower = token.toLowerCase();
      let score = token.length;
      if (stopWords.has(lower)) score -= 4;
      if (token.length >= 7) score += 3;
      return { token, index: m.index, score };
    })
    .sort((a, b) => b.score - a.score)[0];

  const blank = '_'.repeat(Math.max(4, Math.min(12, best.token.length)));
  return {
    masked: `${text.slice(0, best.index)}${blank}${text.slice(best.index + best.token.length)}`,
    expected: best.token,
  };
}

export function buildTypingQueue(cards) {
  return cards.map((card) => {
    const blank = chooseBestBlank(card.back);
    return {
      id: card.cardId ?? card.id,
      front: card.front,
      fullAnswer: card.back,
      expected: blank.expected,
      masked: blank.masked,
    };
  });
}

export function evaluateTypingGuess(guess, expected) {
  const normalizedGuess = normalizeForMatch(guess);
  const normalizedExpected = normalizeForMatch(expected);
  if (!normalizedGuess) return { accepted: false, distance: Infinity };

  const distance = levenshtein(normalizedGuess, normalizedExpected);
  const threshold = normalizedExpected.length >= 7 ? 2 : 1;
  const accepted = normalizedGuess === normalizedExpected || distance <= threshold;

  return { accepted, distance };
}

export function splitAnswerForReveal(fullAnswer, expected) {
  const target = expected || '';
  const idx = fullAnswer.indexOf(target);
  if (idx === -1) {
    return { before: '', after: '', hasBlank: false };
  }
  return {
    before: fullAnswer.slice(0, idx),
    after: fullAnswer.slice(idx + target.length),
    hasBlank: true,
  };
}
