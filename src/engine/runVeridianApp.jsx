import { S } from '../lib/state';
import { toLocalDateKey, parseLocalDateKey, getTodayKey } from '../lib/utils-date';
import { applyTheme } from '../lib/modals/settings-ui';
import { PREFS_KEY } from '../lib/constants-storage';

import { bootSystem, saveDeck, deleteDeck, applyTelemetryDelta, heuristicParse, onUserSignedIn } from './veridian-init';
import { initAudio, playSoundEffect, triggerHaptic, triggerVisualGlow, triggerNeutralGlow, formatTimeFriendly, formatTime, generateQuizData, generateFlashcardData, buildTypingQueue, renderMaskedAnswerWithReveal, ensureMasteryCardStats, showMasterySummary, enumerateDates } from './veridian-ops';

export function runVeridianApp() {
  "use strict";

  const els = {
    logoText: document.getElementById('logoText'),
    profileBtn: document.getElementById('profileBtn'),
    profileMenu: document.getElementById('profileMenu'),
    openSettingsBtn: document.getElementById('openSettingsBtn'),
    settingsCenterModal: document.getElementById('settingsCenterModal'),
    themeToggle: document.getElementById('themeToggle'),
    hapticToggle: document.getElementById('hapticToggle'),
    audioToggle: document.getElementById('audioToggle'),
    strictModeToggle: document.getElementById('strictModeToggle'),
    views: {
      dashboard: document.getElementById('dashboardView'),
      editor: document.getElementById('editorView'),
      flashcard: document.getElementById('flashcardView'),
      typing: document.getElementById('typingView'),
      quiz: document.getElementById('quizView'),
      summary: document.getElementById('summaryView'),
      masterySummary: document.getElementById('masterySummaryView')
    },
    telTotalTime: document.getElementById('telTotalTime'),
    telAccuracy: document.getElementById('telAccuracy'),
    telQuizzes: document.getElementById('telQuizzes'),
    telCards: document.getElementById('telCards'),
    telemetryRangePreset: document.getElementById('telemetryRangePreset'),
    telemetryCustomRange: document.getElementById('telemetryCustomRange'),
    telemetryStartDate: document.getElementById('telemetryStartDate'),
    telemetryEndDate: document.getElementById('telemetryEndDate'),
    deckGrid: document.getElementById('deckGrid'),
    createNewDeckBtn: document.getElementById('createNewDeckBtn'),
    backToDashBtn: document.getElementById('backToDashBtn'),
    deckTitleInput: document.getElementById('deckTitleInput'),
    dataInput: document.getElementById('dataInput'),
    saveDeckBtn: document.getElementById('saveDeckBtn'),
    viewDeckBtn: document.getElementById('viewDeckBtn'),
    csvFileInput: document.getElementById('csvFileInput'),
    exitToMenuBtns: document.querySelectorAll('.exitToMenuBtn'),
    fcProgressText: document.getElementById('fcProgressText'),
    fcProgressFill: document.getElementById('fcProgressFill'),
    flashcardObject: document.getElementById('flashcardObject'),
    fcFrontContent: document.getElementById('fcFrontContent'),
    fcBackContent: document.getElementById('fcBackContent'),
    fcFrontActions: document.getElementById('fcFrontActions'),
    fcBackActions: document.getElementById('fcBackActions'),
    fcShowAnswerBtn: document.getElementById('fcShowAnswerBtn'),
    srsBtns: document.querySelectorAll('.srs-btn'),
    typingProgressText: document.getElementById('typingProgressText'),
    typingProgressFill: document.getElementById('typingProgressFill'),
    typingFrontPrompt: document.getElementById('typingFrontPrompt'),
    typingMaskedAnswer: document.getElementById('typingMaskedAnswer'),
    typingAnswerInput: document.getElementById('typingAnswerInput'),
    typingSubmitBtn: document.getElementById('typingSubmitBtn'),
    typingGiveUpBtn: document.getElementById('typingGiveUpBtn'),
    typingNextBtn: document.getElementById('typingNextBtn'),
    typingSpaceHint: document.getElementById('typingSpaceHint'),
    typingFeedback: document.getElementById('typingFeedback'),
    quizProgressText: document.getElementById('quizProgressText'),
    quizProgressFill: document.getElementById('quizProgressFill'),
    timerDisplay: document.getElementById('timerDisplay'),
    pauseBtn: document.getElementById('pauseBtn'),
    hideTimerBtn: document.getElementById('hideTimerBtn'),
    questionContainer: document.getElementById('questionContainer'),
    pausedContainer: document.getElementById('pausedContainer'),
    resumeBtn: document.getElementById('resumeBtn'),
    questionText: document.getElementById('questionText'),
    optionsGrid: document.getElementById('optionsGrid'),
    feedbackText: document.getElementById('feedbackText'),
    skipContainer: document.getElementById('skipContainer'),
    skipBtn: document.getElementById('skipBtn'),
    nextBtn: document.getElementById('nextBtn'),
    finalScore: document.getElementById('finalScore'),
    finalTime: document.getElementById('finalTime'),
    reviewContainer: document.getElementById('reviewContainer'),
    exportBtn: document.getElementById('exportBtn'),
    exportFeedback: document.getElementById('exportFeedback'),
    retryBtn: document.getElementById('retryBtn'),
    masteryCount: document.getElementById('masteryCount'),
    masteryTime: document.getElementById('masteryTime'),
    masteryReviewContainer: document.getElementById('masteryReviewContainer'),
    masteryExportBtn: document.getElementById('masteryExportBtn'),
    masteryExportFeedback: document.getElementById('masteryExportFeedback'),
    masteryRetryBtn: document.getElementById('masteryRetryBtn')
  };

  function switchView(viewName) {
    Object.values(els.views).forEach(v => v.classList.add('hidden'));
    els.views[viewName].classList.remove('hidden');
  }

  function savePrefsFromUI() {
    S.prefs.themeDark = els.themeToggle.checked;
    S.prefs.haptics = els.hapticToggle.checked;
    S.prefs.audio = els.audioToggle.checked;
    S.prefs.strictMode = els.strictModeToggle.checked;
    localStorage.setItem(PREFS_KEY, JSON.stringify(S.prefs));
    applyTheme();
  }

  els.themeToggle.addEventListener('change', savePrefsFromUI);
  els.hapticToggle.addEventListener('change', savePrefsFromUI);
  els.audioToggle.addEventListener('change', savePrefsFromUI);
  els.strictModeToggle.addEventListener('change', savePrefsFromUI);

  els.profileBtn.addEventListener('click', (e) => { e.stopPropagation(); els.profileMenu.classList.toggle('hidden'); });
  els.openSettingsBtn.addEventListener('click', () => { els.profileMenu.classList.add('hidden'); els.settingsCenterModal.classList.remove('hidden'); });
  document.addEventListener('click', (e) => {
    if (!els.profileMenu.contains(e.target) && !(e.target === els.profileBtn || els.profileBtn.contains(e.target))) {
      els.profileMenu.classList.add('hidden');
    }
  });

  function getTelemetryRangeBounds() {
    const preset = els.telemetryRangePreset.value;
    let start;
    let end;
    const today = new Date();
    if (preset === 'custom') {
      start = parseLocalDateKey(els.telemetryStartDate.value || toLocalDateKey(today));
      end = parseLocalDateKey(els.telemetryEndDate.value || toLocalDateKey(today));
    } else if (preset === 'day') {
      start = new Date(today);
      end = new Date(today);
    } else if (preset === 'week') {
      start = new Date(today);
      start.setDate(today.getDate() - 6);
      end = new Date(today);
    } else {
      start = new Date(today);
      start.setDate(today.getDate() - 364);
      end = new Date(today);
    }
    if (start > end) { const tmp = start; start = end; end = tmp; }
    return { start, end };
  }

  function getTelemetryAggregateForRange() {
    const { start, end } = getTelemetryRangeBounds();
    const keys = enumerateDates(start, end);
    if (keys.length === 0) return { timeEngagedSec: 0, correctAnswered: 0, questionsAnswered: 0, cardsFlipped: 0 };
    const agg = { timeEngagedSec: 0, correctAnswered: 0, questionsAnswered: 0, cardsFlipped: 0 };
    keys.forEach(k => {
      const day = S.telemetry.daily[k];
      if (!day) return;
      agg.timeEngagedSec += day.timeEngagedSec || 0;
      agg.correctAnswered += (day.correctAnswered || day.globalCorrect || 0);
      agg.questionsAnswered += (day.questionsAnswered || day.globalAnswered || 0);
      agg.cardsFlipped += day.cardsFlipped || 0;
    });
    const todayKey = getTodayKey();
    if (keys.includes(todayKey)) {
      agg.timeEngagedSec = Math.max(0, agg.timeEngagedSec - (S.telemetryTodayBaseline.timeEngagedSec || 0));
      agg.correctAnswered = Math.max(0, agg.correctAnswered - (S.telemetryTodayBaseline.correctAnswered || 0));
      agg.questionsAnswered = Math.max(0, agg.questionsAnswered - (S.telemetryTodayBaseline.questionsAnswered || 0));
      agg.cardsFlipped = Math.max(0, agg.cardsFlipped - (S.telemetryTodayBaseline.cardsFlipped || 0));
    }
    return agg;
  }

  els.csvFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(ev) {
      const text = ev.target.result;
      const lines = text.split('\n');
      let rawFormat = "";
      lines.forEach(line => {
        const cols = line.split(',');
        if (cols.length >= 2) {
          const front = cols[0].replace(/^"|"$/g, '').trim();
          const back = cols[1].replace(/^"|"$/g, '').trim();
          if (front && back) rawFormat += `${front}\n${back}\n\n`;
        }
      });
      if (rawFormat) {
        els.dataInput.value = (els.dataInput.value + "\n\n" + rawFormat).trim();
        alert("CSV imported successfully.");
      } else {
        alert("Could not parse CSV. Ensure it has at least two columns (Front, Back).");
      }
    };
    reader.readAsText(file);
  });

  document.getElementById('copyPromptBtn').addEventListener('click', () => {
    const txt = document.getElementById('promptText').innerText;
    navigator.clipboard.writeText(txt).then(() => {
      const feedback = document.getElementById('promptCopyFeedback');
      feedback.classList.remove('hidden');
      setTimeout(() => feedback.classList.add('hidden'), 2000);
    });
  });

  els.viewDeckBtn.addEventListener('click', () => {
    const raw = els.dataInput.value;
    const parsed = heuristicParse(raw);
    if (parsed.length === 0) return alert("Nothing to preview. Check your formatting.");
    const container = document.getElementById('previewContainer');
    container.innerHTML = '';
    parsed.forEach((item, idx) => {
      const div = document.createElement('div');
      div.className = 'preview-item';
      let content = `<div class="preview-q">${idx + 1}. ${item.question}</div>`;
      if (item.type === 'qa') {
        content += `<div class="preview-opt correct">${item.answer}</div>`;
      } else {
        item.options.forEach(opt => { content += `<div class="preview-opt ${opt.isCorrect ? 'correct' : ''}">${opt.text}</div>`; });
      }
      div.innerHTML = content;
      container.appendChild(div);
    });
    document.getElementById('previewModal').classList.remove('hidden');
  });

  function renderDashboard() {
    switchView('dashboard');
    const telemetryAgg = getTelemetryAggregateForRange();
    els.telTotalTime.textContent = formatTimeFriendly(telemetryAgg.timeEngagedSec);
    const acc = telemetryAgg.questionsAnswered > 0 ? Math.round((telemetryAgg.correctAnswered / telemetryAgg.questionsAnswered) * 100) : 0;
    els.telAccuracy.textContent = `${acc}%`;
    els.telQuizzes.textContent = telemetryAgg.questionsAnswered;
    els.telCards.textContent = telemetryAgg.cardsFlipped;
    els.deckGrid.innerHTML = '';
    S.decks.forEach(deck => {
      const card = document.createElement('div');
      card.className = 'deck-card';
      card.innerHTML = `<div><div class="deck-title">${deck.title}</div><div class="deck-meta">${deck.parsedItems.length} items · Last edited ${new Date(deck.lastEdited).toLocaleDateString()}</div></div><div class="deck-actions"><button class="btn btn-primary start-quiz-from-dash" data-id="${deck.id}" style="padding: 0.4rem 0.8rem; font-size: 0.75rem;">Quiz</button><button class="btn start-fc-from-dash" data-id="${deck.id}" style="padding: 0.4rem 0.8rem; font-size: 0.75rem;">Learn</button><button class="btn edit-deck-btn" data-id="${deck.id}" style="padding: 0.4rem 0.8rem; font-size: 0.75rem; border-color:transparent; color: var(--text-muted);">Edit</button><button class="btn btn-danger delete-deck-btn" data-id="${deck.id}" style="padding: 0.4rem 0.8rem; font-size: 0.75rem; margin-left:auto;">Delete</button></div>`;
      els.deckGrid.appendChild(card);
    });
    document.querySelectorAll('.start-quiz-from-dash').forEach(b => b.addEventListener('click', (e) => launchSession(e.target.dataset.id, 'quiz')));
    document.querySelectorAll('.start-fc-from-dash').forEach(b => b.addEventListener('click', (e) => launchSession(e.target.dataset.id, 'flashcard')));
    document.querySelectorAll('.edit-deck-btn').forEach(b => b.addEventListener('click', (e) => openEditor(e.target.dataset.id)));
    document.querySelectorAll('.delete-deck-btn').forEach(b => b.addEventListener('click', (e) => { if (confirm("Permanently delete this deck?")) deleteDeck(e.target.dataset.id, renderDashboard); }));
  }

  els.logoText.addEventListener('click', () => { stopTimer(); renderDashboard(); });
  els.exitToMenuBtns.forEach(btn => btn.addEventListener('click', () => { stopTimer(); renderDashboard(); }));
  els.createNewDeckBtn.addEventListener('click', () => openEditor(null));
  els.backToDashBtn.addEventListener('click', renderDashboard);

  function openEditor(deckId) {
    S.activeDeckId = deckId;
    if (deckId) {
      const d = S.decks.find(d => d.id === deckId);
      els.deckTitleInput.value = d.title;
      els.dataInput.value = d.rawText;
    } else {
      els.deckTitleInput.value = '';
      els.dataInput.value = '';
    }
    switchView('editor');
  }

  els.saveDeckBtn.addEventListener('click', () => {
    const raw = els.dataInput.value;
    const title = els.deckTitleInput.value;
    if (!raw.trim()) return alert("Deck cannot be empty.");
    if (heuristicParse(raw).length === 0) return alert("Failed to parse any valid questions. Check formatting.");
    saveDeck(S.activeDeckId || Date.now().toString(), title, raw);
    renderDashboard();
  });

  function launchSession(deckId, mode) {
    initAudio();
    const deck = S.decks.find(d => d.id === deckId);
    if (!deck || deck.parsedItems.length === 0) return alert("Deck is empty or invalid.");
    S.activeDeckId = deckId;
    S.state.mode = mode;
    S.state.totalTimeSeconds = 0;
    if (mode === 'flashcard') {
      const baseCards = generateFlashcardData(deck.parsedItems);
      S.state.fcBaseCards = [...baseCards];
      S.state.masteryTimingByCard = {};
      S.state.masterySessionSeconds = 0;
      S.state.masteryCopyText = '';
      S.state.fcQueue = [...baseCards];
      S.state.fcTotalInitial = baseCards.length;
      S.state.fcIsFlipped = false;
      els.flashcardObject.classList.remove('is-flipped');
      switchView('flashcard');
      renderFlashcard();
    } else if (mode === 'quiz') {
      S.state.activeQuestions = generateQuizData(deck.parsedItems);
      S.state.answersData = new Array(S.state.activeQuestions.length).fill(null);
      S.state.quizSkippedIndices = [];
      if (S.prefs.strictMode) els.skipContainer.classList.add('hidden');
      else els.skipContainer.classList.remove('hidden');
      S.state.currentIndex = 0;
      resumeAssessment();
      switchView('quiz');
      renderQuestion();
    }
  }

  function renderFlashcard() {
    if (S.state.fcQueue.length === 0) {
      applyTelemetryDelta({ timeEngagedSec: S.state.totalTimeSeconds });
      return startTypingDrill();
    }
    const fc = S.state.fcQueue[0];
    const remaining = S.state.fcQueue.length;
    const completed = S.state.fcTotalInitial - remaining;
    els.fcProgressText.textContent = `${remaining} remaining`;
    els.fcProgressFill.style.width = `${Math.min((completed / S.state.fcTotalInitial) * 100, 95)}%`;
    S.state.fcIsFlipped = false;
    els.flashcardObject.classList.remove('is-flipped');
    els.fcFrontActions.classList.remove('hidden');
    els.fcBackActions.classList.add('hidden');
    setTimeout(() => {
      els.fcFrontContent.textContent = fc.front;
      els.fcBackContent.textContent = fc.back;
      S.state.fcCardStartTs = Date.now();
    }, 150);
  }

  function flipFlashcard() {
    if (S.state.fcIsFlipped) return;
    S.state.fcIsFlipped = true;
    applyTelemetryDelta({ cardsFlipped: 1 });
    els.flashcardObject.classList.add('is-flipped');
    els.fcFrontActions.classList.add('hidden');
    els.fcBackActions.classList.remove('hidden');
    playSoundEffect('flip');
    triggerHaptic('flip');
  }

  function handleSRSRating(rating) {
    const currentCard = S.state.fcQueue.shift();
    const recallElapsed = S.state.fcCardStartTs ? (Date.now() - S.state.fcCardStartTs) / 1000 : 0;
    const stats = ensureMasteryCardStats(currentCard.id, currentCard.front);
    stats.recallSec += recallElapsed;
    S.state.masterySessionSeconds += recallElapsed;
    if (rating === 'again') {
      stats.recallAgainCount++;
      playSoundEffect('wrong');
      triggerHaptic('wrong');
      triggerVisualGlow(false);
      S.state.fcQueue.push(currentCard);
    } else if (rating === 'hard') {
      playSoundEffect('correct');
      triggerHaptic('correct');
      S.state.fcQueue.splice(Math.floor(S.state.fcQueue.length / 2), 0, currentCard);
    } else {
      playSoundEffect('correct');
      triggerHaptic('correct');
      if (rating === 'easy') triggerVisualGlow(true);
    }
    renderFlashcard();
  }

  els.fcShowAnswerBtn.addEventListener('click', flipFlashcard);
  els.flashcardObject.addEventListener('click', () => { if (!S.state.fcIsFlipped) flipFlashcard(); });
  els.srsBtns.forEach(btn => btn.addEventListener('click', (e) => { e.stopPropagation(); handleSRSRating(btn.dataset.rate); }));

  function renderQuestion() {
    els.questionContainer.scrollTop = 0;
    const q = S.state.activeQuestions[S.state.currentIndex];
    S.state.isAnswered = false;
    S.state.questionStartTime = Date.now();
    els.quizProgressText.textContent = `Q ${S.state.currentIndex + 1}/${S.state.activeQuestions.length}`;
    els.quizProgressFill.style.width = `${((S.state.currentIndex) / S.state.activeQuestions.length) * 100}%`;
    els.questionText.textContent = q.question;
    els.feedbackText.textContent = "";
    els.nextBtn.disabled = true;
    els.skipBtn.disabled = false;
    els.optionsGrid.innerHTML = '';
    q.options.forEach((opt, idx) => {
      const btn = document.createElement('button');
      btn.className = 'option-btn';
      btn.innerHTML = `<span class="option-key">${idx + 1}</span> <span>${opt.text}</span>`;
      btn.addEventListener('click', () => handleSelection(idx));
      els.optionsGrid.appendChild(btn);
    });
    resetTimer();
    startTimer();
  }

  function handleSelection(selectedIndex) {
    if (S.state.isAnswered || S.state.isPaused) return;
    S.state.isAnswered = true;
    const tta = (Date.now() - S.state.questionStartTime) / 1000;
    stopTimer();
    const q = S.state.activeQuestions[S.state.currentIndex];
    const buttons = els.optionsGrid.querySelectorAll('.option-btn');
    const isCorrect = q.options[selectedIndex].isCorrect;
    S.state.answersData[S.state.currentIndex] = { index: selectedIndex, isCorrect, tta };
    playSoundEffect(isCorrect ? 'correct' : 'wrong');
    triggerHaptic(isCorrect ? 'correct' : 'wrong');
    triggerVisualGlow(isCorrect);
    buttons.forEach((btn, idx) => {
      btn.disabled = true;
      if (idx === q.correctIndex) btn.classList.add('option-correct');
      else if (idx === selectedIndex && !isCorrect) btn.classList.add('option-wrong');
    });
    els.feedbackText.textContent = isCorrect ? "Correct." : "Incorrect.";
    els.feedbackText.style.color = isCorrect ? "var(--correct-text)" : "var(--wrong-text)";
    els.quizProgressFill.style.width = `${((S.state.currentIndex + 1) / S.state.activeQuestions.length) * 100}%`;
    els.nextBtn.disabled = false;
    els.skipBtn.disabled = true;
  }

  function handleSkip() {
    if (S.state.isAnswered || S.state.isPaused || S.prefs.strictMode) return;
    S.state.isAnswered = true;
    const tta = (Date.now() - S.state.questionStartTime) / 1000;
    if (!S.state.quizSkippedIndices.includes(S.state.currentIndex)) S.state.quizSkippedIndices.push(S.state.currentIndex);
    S.state.answersData[S.state.currentIndex] = { index: -1, isCorrect: false, tta };
    stopTimer();
    playSoundEffect('neutral');
    triggerHaptic('wrong');
    triggerNeutralGlow();
    const q = S.state.activeQuestions[S.state.currentIndex];
    const buttons = els.optionsGrid.querySelectorAll('.option-btn');
    buttons.forEach((btn, idx) => { btn.disabled = true; if (idx === q.correctIndex) btn.classList.add('option-correct'); });
    els.feedbackText.textContent = "Skipped.";
    els.feedbackText.style.color = "var(--skip-text)";
    els.quizProgressFill.style.width = `${((S.state.currentIndex + 1) / S.state.activeQuestions.length) * 100}%`;
    els.nextBtn.disabled = false;
    els.skipBtn.disabled = true;
  }

  function advance() {
    if (S.state.currentIndex < S.state.activeQuestions.length - 1) {
      S.state.currentIndex++;
      renderQuestion();
    } else if (S.state.quizSkippedIndices.length > 0) {
      S.state.currentIndex = S.state.quizSkippedIndices.shift();
      renderQuestion();
    } else {
      showSummary();
    }
  }

  function startTimer() {
    clearInterval(S.state.timerInterval);
    els.timerDisplay.textContent = formatTime(S.state.timeSeconds);
    S.state.timerInterval = setInterval(() => {
      if (!S.state.isAnswered && !S.state.isPaused) {
        S.state.timeSeconds++;
        S.state.totalTimeSeconds++;
        els.timerDisplay.textContent = formatTime(S.state.timeSeconds);
      }
    }, 1000);
  }

  function resetTimer() { S.state.timeSeconds = 0; els.timerDisplay.textContent = formatTime(S.state.timeSeconds); }
  function stopTimer() { clearInterval(S.state.timerInterval); }

  els.pauseBtn.addEventListener('click', () => {
    S.state.isPaused = !S.state.isPaused;
    if (S.state.isPaused) {
      els.questionContainer.classList.add('hidden');
      els.pausedContainer.classList.remove('hidden');
      els.pauseBtn.style.background = 'var(--surface-hover)';
    } else resumeAssessment();
  });
  els.resumeBtn.addEventListener('click', resumeAssessment);
  function resumeAssessment() {
    S.state.isPaused = false;
    els.questionContainer.classList.remove('hidden');
    els.pausedContainer.classList.add('hidden');
    els.pauseBtn.style.background = '';
  }
  els.hideTimerBtn.addEventListener('click', () => {
    S.state.isHidden = !S.state.isHidden;
    els.hideTimerBtn.textContent = S.state.isHidden ? "Show" : "Hide";
    els.timerDisplay.textContent = formatTime(S.state.timeSeconds);
  });

  function showSummary() {
    switchView('summary');
    stopTimer();
    let correctCount = 0;
    els.reviewContainer.innerHTML = '';
    S.state.activeQuestions.forEach((q, idx) => {
      const ansMeta = S.state.answersData[idx];
      const isSkipped = ansMeta.index === -1;
      const isCorrect = ansMeta.isCorrect;
      if (isCorrect) correctCount++;
      const div = document.createElement('div');
      div.className = `review-item ${isCorrect ? 'review-correct' : 'review-wrong'}`;
      const userAnsText = isSkipped ? 'Skipped' : q.options[ansMeta.index].text;
      const correctAnsText = q.options[q.correctIndex].text;
      div.innerHTML = `<div class="review-meta-bar"><div class="review-q">${idx + 1}. ${q.question}</div><div class="review-tta">${ansMeta.tta.toFixed(1)}s</div></div><div class="review-a">Selected: ${userAnsText} <br>${!isCorrect ? `Correct: ${correctAnsText}` : ''}</div>`;
      els.reviewContainer.appendChild(div);
    });
    els.finalScore.textContent = `${Math.round((correctCount / S.state.activeQuestions.length) * 100) || 0}%`;
    const tempHide = S.state.isHidden;
    S.state.isHidden = false;
    els.finalTime.textContent = formatTime(S.state.totalTimeSeconds);
    S.state.isHidden = tempHide;
    applyTelemetryDelta({ timeEngagedSec: S.state.totalTimeSeconds, globalAnswered: S.state.activeQuestions.length, globalCorrect: correctCount });
  }

  els.skipBtn.addEventListener('click', handleSkip);
  els.nextBtn.addEventListener('click', advance);
  els.exportBtn.addEventListener('click', () => {
    const score = els.finalScore.textContent;
    const time = els.finalTime.textContent;
    const detailLines = S.state.activeQuestions.map((q, idx) => {
      const meta = S.state.answersData[idx] || { index: -1, tta: 0 };
      const selected = meta.index === -1 ? 'Skipped' : (q.options[meta.index] ? q.options[meta.index].text : 'N/A');
      const correct = q.options[q.correctIndex] ? q.options[q.correctIndex].text : 'N/A';
      return `${idx + 1}. ${q.question}\nSelected: ${selected}\nCorrect: ${correct}\nTime: ${typeof meta.tta === 'number' ? meta.tta.toFixed(1) : '0.0'}s`;
    }).join('\n\n');
    navigator.clipboard.writeText(`Veridian Results\nScore: ${score}\nTime: ${time}\n\n${detailLines}`).then(() => {
      els.exportFeedback.classList.remove('hidden');
      setTimeout(() => els.exportFeedback.classList.add('hidden'), 2000);
    });
  });
  els.retryBtn.addEventListener('click', () => launchSession(S.activeDeckId, 'quiz'));
  els.masteryRetryBtn.addEventListener('click', () => launchSession(S.activeDeckId, 'flashcard'));
  els.masteryExportBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(S.state.masteryCopyText || '').then(() => {
      els.masteryExportFeedback.classList.remove('hidden');
      setTimeout(() => els.masteryExportFeedback.classList.add('hidden'), 2000);
    });
  });

  function startTypingDrill() {
    S.state.mode = 'typing';
    S.state.typingQueue = buildTypingQueue(S.state.fcBaseCards);
    S.state.typingDeferredQueue = [];
    S.state.typingIndex = 0;
    S.state.typingAnswered = false;
    S.state.typingStartTs = Date.now();
    switchView('typing');
    renderTypingPrompt();
  }

  function renderTypingPrompt() {
    const item = S.state.typingQueue[S.state.typingIndex];
    if (!item) {
      if (S.state.typingDeferredQueue.length > 0) {
        S.state.typingQueue = S.state.typingQueue.concat(S.state.typingDeferredQueue);
        S.state.typingDeferredQueue = [];
        return renderTypingPrompt();
      }
      const elapsed = Math.round((Date.now() - S.state.typingStartTs) / 1000);
      applyTelemetryDelta({ timeEngagedSec: elapsed });
      S.state.masterySessionSeconds += elapsed;
      return showMasterySummary(els);
    }
    S.state.typingAnswered = false;
    S.state.typingPromptStartTs = Date.now();
    els.typingAnswerInput.value = '';
    els.typingAnswerInput.disabled = false;
    els.typingSubmitBtn.classList.remove('hidden');
    els.typingGiveUpBtn.classList.remove('hidden');
    els.typingNextBtn.classList.add('hidden');
    els.typingSpaceHint.classList.add('hidden');
    els.typingFeedback.textContent = '';
    els.typingFrontPrompt.textContent = item.front;
    renderMaskedAnswerWithReveal(els, item, '', false);
    els.typingProgressText.textContent = `Prompt ${S.state.typingIndex + 1}/${S.state.typingQueue.length}`;
    els.typingProgressFill.style.width = `${(S.state.typingIndex / S.state.typingQueue.length) * 100}%`;
    els.typingAnswerInput.focus();
  }

  function evaluateTyping() {
    if (S.state.typingAnswered) return;
    const item = S.state.typingQueue[S.state.typingIndex];
    const stats = ensureMasteryCardStats(item.id, item.front);
    stats.typingAttempts++;
    const guess = (els.typingAnswerInput.value || '').toLowerCase().replace(/[^a-z0-9\s']/g, '').replace(/\s+/g, ' ').trim();
    const target = (item.expected || '').toLowerCase().replace(/[^a-z0-9\s']/g, '').replace(/\s+/g, ' ').trim();
    if (!guess) return;
    const a = guess;
    const b = target;
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
    const dist = dp[m][n];
    const threshold = target.length >= 7 ? 2 : 1;
    const accepted = guess === target || dist <= threshold;
    if (accepted) {
      S.state.typingAnswered = true;
      const elapsed = (Date.now() - S.state.typingPromptStartTs) / 1000;
      stats.typingSec += elapsed;
      stats.typingCorrectCount++;
      els.typingAnswerInput.disabled = true;
      els.typingSubmitBtn.classList.add('hidden');
      els.typingGiveUpBtn.classList.add('hidden');
      els.typingNextBtn.classList.remove('hidden');
      els.typingSpaceHint.classList.remove('hidden');
      renderMaskedAnswerWithReveal(els, item, item.expected, false);
      els.typingFeedback.textContent = dist === 0 ? "Correct." : `Accepted (minor typo). Expected: ${item.expected}`;
      els.typingFeedback.style.color = "var(--correct-text)";
      triggerVisualGlow(true);
      playSoundEffect('correct');
      triggerHaptic('correct');
    } else {
      stats.typingWrongAttempts++;
      renderMaskedAnswerWithReveal(els, item, '', false);
      els.typingFeedback.textContent = "Not quite. Try again.";
      els.typingFeedback.style.color = "var(--wrong-text)";
      triggerVisualGlow(false);
      playSoundEffect('wrong');
      triggerHaptic('wrong');
    }
  }

  function giveUpTyping() {
    if (S.state.typingAnswered) return;
    const item = S.state.typingQueue[S.state.typingIndex];
    const stats = ensureMasteryCardStats(item.id, item.front);
    const elapsed = (Date.now() - S.state.typingPromptStartTs) / 1000;
    stats.typingAttempts++;
    stats.typingSkippedCount++;
    if (stats.typingCorrectCount === 0) stats.initiallySkipped = true;
    stats.typingSec += elapsed;
    S.state.typingAnswered = true;
    if (!S.state.typingDeferredQueue.some(q => q.id === item.id)) S.state.typingDeferredQueue.push({ ...item });
    els.typingAnswerInput.disabled = true;
    els.typingSubmitBtn.classList.add('hidden');
    els.typingGiveUpBtn.classList.add('hidden');
    els.typingNextBtn.classList.remove('hidden');
    els.typingSpaceHint.classList.remove('hidden');
    renderMaskedAnswerWithReveal(els, item, item.expected, true);
    els.typingFeedback.textContent = "Skipped.";
    els.typingFeedback.style.color = "var(--skip-text)";
    triggerNeutralGlow();
    playSoundEffect('neutral');
  }

  els.typingSubmitBtn.addEventListener('click', evaluateTyping);
  els.typingGiveUpBtn.addEventListener('click', giveUpTyping);
  els.typingNextBtn.addEventListener('click', () => { if (!S.state.typingAnswered) return; S.state.typingIndex++; renderTypingPrompt(); });
  els.typingAnswerInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (S.state.typingAnswered) { S.state.typingIndex++; renderTypingPrompt(); }
      else evaluateTyping();
    }
  });

  els.telemetryRangePreset.addEventListener('change', () => {
    const isCustom = els.telemetryRangePreset.value === 'custom';
    els.telemetryCustomRange.classList.toggle('hidden', !isCustom);
    if (isCustom) {
      const today = toLocalDateKey(new Date());
      if (!els.telemetryStartDate.value) els.telemetryStartDate.value = today;
      if (!els.telemetryEndDate.value) els.telemetryEndDate.value = today;
    }
    renderDashboard();
  });
  els.telemetryStartDate.addEventListener('change', () => renderDashboard());
  els.telemetryEndDate.addEventListener('change', () => renderDashboard());

  document.addEventListener('keydown', (e) => {
    if (S.state.mode === 'quiz' && !els.views.quiz.classList.contains('hidden') && !S.state.isPaused) {
      const keyInt = parseInt(e.key);
      if (!isNaN(keyInt) && keyInt > 0) {
        const q = S.state.activeQuestions[S.state.currentIndex];
        if (q && keyInt - 1 < q.options.length) handleSelection(keyInt - 1);
      }
      if (e.key.toLowerCase() === 's' && !S.prefs.strictMode && !S.state.isAnswered) handleSkip();
      if (e.code === 'Space') { e.preventDefault(); if (S.state.isAnswered) advance(); }
    }
    if (S.state.mode === 'flashcard' && !els.views.flashcard.classList.contains('hidden')) {
      if (e.code === 'Space') { e.preventDefault(); if (!S.state.fcIsFlipped) flipFlashcard(); }
      if (S.state.fcIsFlipped) {
        if (e.key === '1') handleSRSRating('again');
        if (e.key === '2') handleSRSRating('hard');
        if (e.key === '3') handleSRSRating('good');
        if (e.key === '4') handleSRSRating('easy');
      }
    }
    if (S.state.mode === 'typing' && !els.views.typing.classList.contains('hidden')) {
      if (e.code === 'Space' && S.state.typingAnswered) { e.preventDefault(); S.state.typingIndex++; renderTypingPrompt(); }
    }
  });

  window.__veridianOnSignedIn = async (user) => {
    await onUserSignedIn(user, S, els, { renderDashboard });
  };

  bootSystem(els, {
    renderDashboard,
    onUserLoaded: (user) => { if (window.__veridianAuthCallbacks?.onUserLoaded) window.__veridianAuthCallbacks.onUserLoaded(user); }
  });
}
