import { JOURNAL_ENTRIES_KEY } from '../lib/constants-storage';
import { S } from '../lib/state';
import { addDays, toLocalDateKey, parseLocalDateKey, getTodayKey } from '../lib/utils-date';
import { stripJournalHtml, journalPreviewForQuery, escapeHtml } from '../lib/utils-text';

export function loadJournalData() {
  try {
    const raw = localStorage.getItem(JOURNAL_ENTRIES_KEY);
    S.journalEntries = raw ? JSON.parse(raw) : {};
    if (!S.journalEntries || typeof S.journalEntries !== 'object' || Array.isArray(S.journalEntries)) S.journalEntries = {};
  } catch (e) { S.journalEntries = {}; }
}

export function saveJournalData() {
  localStorage.setItem(JOURNAL_ENTRIES_KEY, JSON.stringify(S.journalEntries));
}

export function journalApplyEntryContent(dayKey, html) {
  const plain = stripJournalHtml(html || '');
  if (!plain.length) delete S.journalEntries[dayKey];
  else S.journalEntries[dayKey] = { content: html || '', updatedAt: Date.now() };
}

export function openJournalEntryModal(dateKey) {
  const entry = S.journalEntries[dateKey] || { content: '' };
  const plain = stripJournalHtml(entry.content || '');
  document.getElementById('journalEntryModalTitle').textContent = parseLocalDateKey(dateKey).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const body = document.getElementById('journalEntryModalBody');
  if (!plain.length) { body.innerHTML = '<p class="journal-modal-empty">No entry for this day.</p>'; }
  else { body.innerHTML = entry.content || ''; }
  const hint = document.getElementById('journalEntryModalHint');
  if (hint) { hint.textContent = dateKey === getTodayKey() ? 'Read-only preview. To change today\'s note, close this and edit the main journal area above.' : 'Read-only. Past days can\'t be edited here.'; }
  document.getElementById('journalEntryModal').classList.remove('hidden');
}

export function closeJournalEntryModal() { document.getElementById('journalEntryModal').classList.add('hidden'); }

export function renderJournalMonthGrid() {
  const grid = document.getElementById('journalMonthGrid'); const monthSel = document.getElementById('journalMonthSelect');
  const yearSel = document.getElementById('journalYearSelect'); const label = document.getElementById('journalMonthLabel');
  if (!grid || !monthSel || !yearSel || !label) return;
  const y = S.journalMonthCursor.getFullYear(); const m = S.journalMonthCursor.getMonth();
  label.textContent = S.journalMonthCursor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  monthSel.value = String(m); yearSel.value = String(y); grid.innerHTML = '';
  const first = new Date(y, m, 1); const startShift = first.getDay(); const startDate = new Date(y, m, 1 - startShift);
  for (let i = 0; i < 42; i++) {
    const d = addDays(startDate, i); const key = toLocalDateKey(d);
    const hasEntry = !!(stripJournalHtml(S.journalEntries[key]?.content || '') || '').length;
    const cell = document.createElement('button'); cell.type = 'button';
    cell.className = `calendar-month-cell${d.getMonth() !== m ? ' muted' : ''}`;
    cell.style.borderColor = hasEntry ? '#dadceb' : '';
    cell.innerHTML = `<div style="font-weight:700;">${d.getDate()}</div>`;
    cell.onclick = () => { closeJournalMonthModal(); openJournalEntryModal(key); };
    grid.appendChild(cell);
  }
}

export function openJournalMonthModal() {
  const monthSel = document.getElementById('journalMonthSelect'); const yearSel = document.getElementById('journalYearSelect');
  if (monthSel && !monthSel.dataset.init) { monthSel.dataset.init = '1'; monthSel.innerHTML = Array.from({ length: 12 }, (_, i) => `<option value="${i}">${new Date(2026, i, 1).toLocaleDateString('en-US', { month: 'long' })}</option>`).join(''); }
  if (yearSel && !yearSel.dataset.init) { yearSel.dataset.init = '1'; const nowY = new Date().getFullYear(); let html = ''; for (let y = nowY - 10; y <= nowY + 10; y++) html += `<option value="${y}">${y}</option>`; yearSel.innerHTML = html; }
  S.journalMonthCursor = parseLocalDateKey(getTodayKey());
  renderJournalMonthGrid();
  document.getElementById('journalMonthModal').classList.remove('hidden');
}

export function closeJournalMonthModal() { document.getElementById('journalMonthModal').classList.add('hidden'); }

function sortJournalDateKeysDesc(keys) {
  return [...keys].sort((a, b) => parseLocalDateKey(b) - parseLocalDateKey(a));
}

export function computeJournalStreakDays() {
  let streak = 0; let cursor = parseLocalDateKey(getTodayKey());
  for (let i = 0; i < 3650; i++) {
    const key = toLocalDateKey(cursor);
    const has = (stripJournalHtml(S.journalEntries[key]?.content || '') || '').length > 0;
    if (!has) break;
    streak += 1; cursor = addDays(cursor, -1);
  }
  return streak;
}

export function setJournalSaveIndicator(state) {
  const statusEl = document.getElementById('journalSaveStatus');
  if (!statusEl) return;
  if (state === 'saving') statusEl.innerHTML = '<span class="journal-cloud">☁</span><span>Saving...</span>';
  else statusEl.innerHTML = '<span class="journal-cloud">☁</span><span>Saved ✓</span>';
}

function getJournalWordCount() {
  const textEl = document.getElementById('journalText');
  if (!textEl) return 0;
  return (stripJournalHtml(textEl.innerHTML || '').match(/\S+/g) || []).length;
}

export function updateJournalWordCount() {
  const wc = document.getElementById('journalWordCount');
  if (!wc) return;
  const count = getJournalWordCount();
  wc.textContent = `${count} word${count === 1 ? '' : 's'}`;
}

export function journalLoadTodayIntoEditor(opts) {
  const forceReload = opts && opts.forceReload;
  if (S.journalAutosaveTimer) { clearTimeout(S.journalAutosaveTimer); S.journalAutosaveTimer = null; }
  const todayKey = getTodayKey();
  const textEl = document.getElementById('journalText');
  const oldKey = textEl && textEl.dataset.journalDay;
  if (textEl && oldKey && oldKey !== todayKey) { journalApplyEntryContent(oldKey, textEl.innerHTML || ''); saveJournalData(); }
  if (!textEl) return;
  textEl.dataset.journalDay = todayKey;
  if (oldKey !== todayKey || forceReload) { const entry = S.journalEntries[todayKey] || { content: '', updatedAt: 0 }; textEl.innerHTML = entry.content || ''; }
  const heading = document.getElementById('journalDateHeading');
  if (heading) heading.textContent = parseLocalDateKey(todayKey).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const streakEl = document.getElementById('journalStreakPill');
  if (streakEl) streakEl.innerHTML = `🔥 ${computeJournalStreakDays()}`;
  setJournalSaveIndicator('saved');
  updateJournalWordCount();
}

export function renderJournalList() {
  if (S.appMode !== 'cmd' || S.cmdActiveView !== 'journal') return;
  const list = document.getElementById('journalEntryList');
  if (!list) return;
  list.innerHTML = '';
  const todayKey = getTodayKey();
  const keys = sortJournalDateKeysDesc(Object.keys(S.journalEntries));
  const withContent = keys.filter(k => k !== todayKey && (stripJournalHtml(S.journalEntries[k]?.content || '') || '').length > 0);
  const q = (S.journalSearchQuery || '').trim();
  const filtered = q ? withContent.filter(k => stripJournalHtml(S.journalEntries[k]?.content || '').toLowerCase().includes(q.toLowerCase())) : withContent;
  filtered.forEach(k => {
    const entry = S.journalEntries[k] || { content: '', updatedAt: 0 };
    const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'journal-entry-btn';
    const previewHtml = journalPreviewForQuery(entry.content || '', q);
    btn.innerHTML = `<div class="journal-entry-row"><div class="journal-entry-date">${escapeHtml(parseLocalDateKey(k).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }))}</div><div class="journal-entry-preview">${previewHtml}</div></div>`;
    btn.onclick = () => openJournalEntryModal(k);
    list.appendChild(btn);
  });
  if (!filtered.length) { list.innerHTML = `<div class="agenda-empty-hint">${q ? 'No entries match this search' : 'No other days with saved notes yet.'}</div>`; }
}

export function saveActiveJournalEntryImmediate() {
  const textEl = document.getElementById('journalText');
  if (!textEl) return;
  const dayKey = getTodayKey(); textEl.dataset.journalDay = dayKey;
  journalApplyEntryContent(dayKey, textEl.innerHTML || '');
  saveJournalData(); setJournalSaveIndicator('saved'); updateJournalWordCount();
  const streakEl = document.getElementById('journalStreakPill');
  if (streakEl) streakEl.innerHTML = `🔥 ${computeJournalStreakDays()}`;
  renderJournalList();
}

export function queueJournalAutosave() {
  setJournalSaveIndicator('saving'); updateJournalWordCount();
  if (S.journalAutosaveTimer) clearTimeout(S.journalAutosaveTimer);
  S.journalAutosaveTimer = setTimeout(() => saveActiveJournalEntryImmediate(), 260);
}

export function flushActiveJournalToStorage() {
  if (S.appMode !== 'cmd' || S.cmdActiveView !== 'journal') return;
  if (S.journalAutosaveTimer) { clearTimeout(S.journalAutosaveTimer); S.journalAutosaveTimer = null; }
  saveActiveJournalEntryImmediate();
}

function applyJournalInlineStyle(cmd) {
  document.execCommand(cmd, false, null);
  const textEl = document.getElementById('journalText');
  if (textEl) textEl.focus();
}

function normalizeJournalAutoList(e) {
  if (e.key !== ' ') return;
  const sel = window.getSelection(); if (!sel || !sel.rangeCount) return;
  const range = sel.getRangeAt(0); if (!range.collapsed) return;
  const container = range.startContainer; if (!container || container.nodeType !== 3) return;
  const prefix = container.textContent.slice(0, range.startOffset);
  if (prefix === '-') {
    e.preventDefault(); container.textContent = container.textContent.slice(1);
    const r = document.createRange(); r.setStart(container, 0); r.collapse(true);
    sel.removeAllRanges(); sel.addRange(r); document.execCommand('insertUnorderedList', false, null); return;
  }
  if (prefix === '[]') {
    e.preventDefault(); container.textContent = `☐ ${container.textContent.slice(range.startOffset)}`;
    const r = document.createRange(); r.setStart(container, 2); r.collapse(true);
    sel.removeAllRanges(); sel.addRange(r); return;
  }
  if (prefix === '#') {
    e.preventDefault(); container.textContent = container.textContent.slice(1);
    const r = document.createRange(); r.setStart(container, 0); r.collapse(true);
    sel.removeAllRanges(); sel.addRange(r); document.execCommand('formatBlock', false, 'h3');
  }
}

export function renderJournalView() {
  if (S.appMode !== 'cmd' || S.cmdActiveView !== 'journal') return;
  const textEl = document.getElementById('journalText'); const heading = document.getElementById('journalDateHeading');
  const status = document.getElementById('journalSaveStatus'); const streakEl = document.getElementById('journalStreakPill');
  const shell = document.getElementById('journalShell'); const storageToggle = document.getElementById('journalStorageToggle');
  const searchInput = document.getElementById('journalSearchInput'); const monthBtn = document.getElementById('journalMonthBtn');
  const boldBtn = document.getElementById('journalBoldBtn'); const italicBtn = document.getElementById('journalItalicBtn');
  const underlineBtn = document.getElementById('journalUnderlineBtn');
  if (!textEl || !heading || !status || !streakEl) return;
  journalLoadTodayIntoEditor();
  textEl.oninput = () => queueJournalAutosave();
  textEl.onblur = () => saveActiveJournalEntryImmediate();
  textEl.onkeydown = (e) => normalizeJournalAutoList(e);
  if (boldBtn) boldBtn.onclick = () => applyJournalInlineStyle('bold');
  if (italicBtn) italicBtn.onclick = () => applyJournalInlineStyle('italic');
  if (underlineBtn) underlineBtn.onclick = () => applyJournalInlineStyle('underline');
  if (shell) shell.classList.toggle('storage-expanded', S.journalStorageExpanded);
  if (storageToggle) {
    storageToggle.textContent = S.journalStorageExpanded ? '▾' : '▴';
    storageToggle.onclick = () => { S.journalStorageExpanded = !S.journalStorageExpanded; renderJournalView(); };
  }
  if (searchInput) {
    searchInput.value = S.journalSearchQuery;
    searchInput.oninput = () => { S.journalSearchQuery = searchInput.value || ''; renderJournalList(); };
  }
  if (monthBtn) monthBtn.onclick = () => openJournalMonthModal();
  renderJournalList();
  textEl.focus();
}