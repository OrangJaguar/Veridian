import { S } from '../lib/state';
import { escapeHtml } from '../lib/utils-text';
import { getTodayKey, toLocalDateKey } from '../lib/utils-date';
import { applyTelemetryDelta } from './axiom-init';

// --- Audio & Haptic ---
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

export function initAudio() {
  if (!S.prefs.audio) return;
  if (!audioCtx) audioCtx = new AudioContext();
  if (audioCtx.state === 'suspended') audioCtx.resume();
}

export function playSoundEffect(type) {
  if (!S.prefs.audio || !audioCtx) return;
  const osc = audioCtx.createOscillator(); const gainNode = audioCtx.createGain();
  osc.connect(gainNode); gainNode.connect(audioCtx.destination);
  const now = audioCtx.currentTime;
  if (type === 'flip') { osc.type = 'triangle'; osc.frequency.setValueAtTime(300, now); osc.frequency.exponentialRampToValueAtTime(100, now + 0.05); gainNode.gain.setValueAtTime(0.05, now); gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.05); osc.start(now); osc.stop(now + 0.05); }
  else if (type === 'correct') { osc.type = 'sine'; osc.frequency.setValueAtTime(600, now); osc.frequency.setValueAtTime(800, now + 0.1); gainNode.gain.setValueAtTime(0.1, now); gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2); osc.start(now); osc.stop(now + 0.2); }
  else if (type === 'wrong') { osc.type = 'sawtooth'; osc.frequency.setValueAtTime(150, now); osc.frequency.linearRampToValueAtTime(100, now + 0.3); gainNode.gain.setValueAtTime(0.1, now); gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3); osc.start(now); osc.stop(now + 0.3); }
  else if (type === 'neutral') { osc.type = 'triangle'; osc.frequency.setValueAtTime(350, now); osc.frequency.linearRampToValueAtTime(350, now + 0.12); gainNode.gain.setValueAtTime(0.08, now); gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.12); osc.start(now); osc.stop(now + 0.12); }
}

export function triggerHaptic(type) {
  if (!S.prefs.haptics || !navigator.vibrate) return;
  if (type === 'flip') navigator.vibrate(20);
  else if (type === 'correct') navigator.vibrate([30, 50, 30]);
  else if (type === 'wrong') navigator.vibrate([150]);
}

export function triggerVisualGlow(isCorrect) {
  document.body.classList.remove('trigger-correct', 'trigger-wrong');
  void document.body.offsetWidth;
  document.body.classList.add(isCorrect ? 'trigger-correct' : 'trigger-wrong');
  setTimeout(() => document.body.classList.remove('trigger-correct', 'trigger-wrong'), 600);
}

export function triggerNeutralGlow() {
  document.body.classList.remove('trigger-correct', 'trigger-wrong', 'trigger-neutral');
  void document.body.offsetWidth;
  document.body.classList.add('trigger-neutral');
  setTimeout(() => document.body.classList.remove('trigger-neutral'), 600);
}

// --- Formatters ---
export function formatTimeFriendly(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600); const m = Math.floor((totalSeconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`; return `${m}m`;
}

export function formatTime(seconds) {
  if (S.state.isHidden) return "--:--";
  return `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
}

export function toMmSs(t) { return `${Math.floor(t/60).toString().padStart(2,'0')}:${Math.floor(t%60).toString().padStart(2,'0')}`; }

// --- Parser helpers ---
export function shuffle(array) {
  let arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; }
  return arr;
}

export function generateQuizData(parsedData) {
  const allAnswers = parsedData.map(item => item.answer);
  return parsedData.map(item => {
    if (item.type === 'multichoice') {
      const shuffledOptions = shuffle(item.options);
      const newCorrectIndex = shuffledOptions.findIndex(o => o.isCorrect && o.text === item.answer);
      return { ...item, options: shuffledOptions, correctIndex: newCorrectIndex };
    } else {
      let wrongAnswers = allAnswers.filter(a => a !== item.answer);
      wrongAnswers = shuffle(wrongAnswers).slice(0, 3);
      while(wrongAnswers.length < 3) wrongAnswers.push(`Distractor ${wrongAnswers.length + 1}`);
      const synthesizedOptions = [{ text: item.answer, isCorrect: true }, ...wrongAnswers.map(ans => ({ text: ans, isCorrect: false }))];
      const shuffledOptions = shuffle(synthesizedOptions);
      return { ...item, type: 'multichoice', options: shuffledOptions, correctIndex: shuffledOptions.findIndex(o => o.isCorrect) };
    }
  });
}

export function generateFlashcardData(parsedData) {
  return parsedData.map(item => ({ id: item.id, front: item.question, back: item.answer }));
}

function normalizeForMatch(str) { return (str || '').toLowerCase().replace(/[^a-z0-9\s']/g, '').replace(/\s+/g, ' ').trim(); }

function levenshtein(a, b) {
  const m = a.length; const n = b.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) { for (let j = 1; j <= n; j++) { const cost = a[i - 1] === b[j - 1] ? 0 : 1; dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost); } }
  return dp[m][n];
}

function chooseBestBlank(answerText) {
  const text = answerText || '';
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'to', 'of', 'in', 'on', 'for', 'is', 'are', 'was', 'were', 'that', 'this', 'with', 'as', 'by', 'from']);
  const matches = [...text.matchAll(/[A-Za-z0-9'-]+/g)];
  if (!matches.length) return { masked: '______', expected: text.trim() };
  const best = matches.map(m => { const token = m[0]; const lower = token.toLowerCase(); let score = token.length; if (stopWords.has(lower)) score -= 4; if (token.length >= 7) score += 3; return { token, index: m.index, score }; }).sort((a, b) => b.score - a.score)[0];
  const blank = '_'.repeat(Math.max(4, Math.min(12, best.token.length)));
  return { masked: `${text.slice(0, best.index)}${blank}${text.slice(best.index + best.token.length)}`, expected: best.token };
}

export function buildTypingQueue(cards) {
  return cards.map(card => { const blank = chooseBestBlank(card.back); return { id: card.id, front: card.front, fullAnswer: card.back, expected: blank.expected, masked: blank.masked }; });
}

export function renderMaskedAnswerWithReveal(els, item, revealText, isSkipped) {
  const target = item.expected || ''; const idx = item.fullAnswer.indexOf(target);
  if (idx === -1) { els.typingMaskedAnswer.textContent = item.masked; return; }
  const before = escapeHtml(item.fullAnswer.slice(0, idx)); const after = escapeHtml(item.fullAnswer.slice(idx + target.length));
  els.typingMaskedAnswer.innerHTML = `${before}<span class="typing-blank-wrap"><span class="typing-reveal${isSkipped ? ' skipped' : ''}">${escapeHtml(revealText || '')}</span><span class="typing-blank-line"></span></span>${after}`;
}

export function ensureMasteryCardStats(cardId, frontText) {
  if (!S.state.masteryTimingByCard[cardId]) {
    S.state.masteryTimingByCard[cardId] = { front: frontText, recallSec: 0, typingSec: 0, recallAgainCount: 0, typingAttempts: 0, typingWrongAttempts: 0, typingSkippedCount: 0, typingCorrectCount: 0, initiallySkipped: false };
  }
  return S.state.masteryTimingByCard[cardId];
}

export function showMasterySummary(els) {
  const switchView = (v) => { Object.values(els.views).forEach(x => x.classList.add('hidden')); els.views[v].classList.remove('hidden'); };
  switchView('masterySummary');
  const rows = S.state.fcBaseCards.map(card => {
    const t = ensureMasteryCardStats(card.id, card.front);
    const totalAttempts = t.typingAttempts + t.recallAgainCount;
    const struggled = t.typingWrongAttempts > 0 || t.recallAgainCount > 0;
    return { front: card.front, recallSec: t.recallSec || 0, typingSec: t.typingSec || 0, totalSec: (t.recallSec || 0) + (t.typingSec || 0), recallAgainCount: t.recallAgainCount || 0, typingAttempts: t.typingAttempts || 0, typingWrongAttempts: t.typingWrongAttempts || 0, typingSkippedCount: t.typingSkippedCount || 0, initiallySkipped: !!t.initiallySkipped, struggled, totalAttempts };
  });
  els.masteryCount.textContent = `${rows.length}/${rows.length}`;
  els.masteryTime.textContent = toMmSs(S.state.masterySessionSeconds);
  els.masteryReviewContainer.innerHTML = '';
  rows.forEach((r, idx) => {
    const div = document.createElement('div');
    const quality = r.initiallySkipped ? 'Recovered from skip' : (r.struggled ? 'Mastered with retries' : 'Clean mastery');
    const cls = r.initiallySkipped ? 'review-skip' : (r.struggled ? 'review-struggle' : 'review-correct');
    div.className = `review-item ${cls}`;
    div.innerHTML = `<div class="review-meta-bar"><div class="review-q">${idx + 1}. ${r.front}</div><div class="review-tta">${r.totalSec.toFixed(1)}s</div></div><div class="review-a">${quality}<br>Recall: ${r.recallSec.toFixed(1)}s · Typing: ${r.typingSec.toFixed(1)}s · Total: ${r.totalSec.toFixed(1)}s<br>Attempts: ${r.totalAttempts} · Typing mistakes: ${r.typingWrongAttempts} · Skips: ${r.typingSkippedCount} · Recall retries: ${r.recallAgainCount}</div>`;
    els.masteryReviewContainer.appendChild(div);
  });
  S.state.masteryCopyText = `Veridian Mastery Results\nMastered: ${rows.length}/${rows.length}\nTotal Time: ${toMmSs(S.state.masterySessionSeconds)}\n\n${rows.map(r => `${r.front} | ${r.initiallySkipped ? 'Recovered from skip' : (r.struggled ? 'Mastered with retries' : 'Clean mastery')} | Recall ${r.recallSec.toFixed(1)}s | Typing ${r.typingSec.toFixed(1)}s | Total ${r.totalSec.toFixed(1)}s | Attempts ${r.totalAttempts} | Typing mistakes ${r.typingWrongAttempts} | Skips ${r.typingSkippedCount} | Recall retries ${r.recallAgainCount}`).join('\n')}`;
}

export function enumerateDates(start, end) {
  const out = []; const cur = new Date(start);
  while (cur <= end) { out.push(toLocalDateKey(cur)); cur.setDate(cur.getDate() + 1); }
  return out;
}