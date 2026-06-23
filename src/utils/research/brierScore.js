/**
 * Brier score for calibration research: (predicted - actual)^2
 * actual = 1 if score >= 70 else 0; predicted = confidenceSlider / 100
 */
export function computeSessionBrierScore(confidenceSliderValue, score) {
  if (confidenceSliderValue == null || score == null) return null;
  const predicted = Number(confidenceSliderValue) / 100;
  const actual = Number(score) >= 70 ? 1 : 0;
  return (predicted - actual) ** 2;
}

export function meanBrierScore(sessions) {
  const scores = sessions
    .map((s) => {
      const slider = s.sessionData?.confidenceSlider?.value;
      return computeSessionBrierScore(slider, s.score);
    })
    .filter((v) => v != null);
  if (!scores.length) return null;
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}
