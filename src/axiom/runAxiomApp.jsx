// @ts-nocheck
import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import {
  PREFS_KEY,
  DECKS_KEY,
  TELEMETRY_KEY,
  CMD_SCHEDULE_KEY,
  CMD_SCHEDULE_DEFAULT,
  AGENDA_TASKS_KEY,
  AGENDA_TASK_ORDER_KEY,
  CALENDAR_EVENTS_KEY,
  JOURNAL_ENTRIES_KEY,
  DEFAULT_AGENDA_TASKS,
} from '../lib/constants-storage';
import { S } from '../lib/state';
import { addDays, toLocalDateKey, parseLocalDateKey, getTodayKey } from '../lib/utils-date';
import { escapeHtml, stripJournalHtml, escapeRegExp, firstSentencePreview, journalPreviewForQuery } from '../lib/utils-text';
import { ensureCmdSchedule } from '../lib/cmd/schedule';
import { parseCmdTimeString, formatCmdLocaleTime } from '../lib/cmd/time-format';
import { applyTheme, applySettingsToUI } from '../lib/modals/settings-ui';
import { saveDecks } from '../lib/ops/deck-storage';
import { saveTelemetry } from '../lib/ops/telemetry-storage';
import { CmdPanel } from '../views/cmd/CmdPanel';

export function runAxiomApp() {
  "use strict";



    // --- Initialization & Boot ---
    function bootSystem() {
      if (localStorage.getItem(PREFS_KEY)) S.prefs = JSON.parse(localStorage.getItem(PREFS_KEY));
      if (localStorage.getItem(DECKS_KEY)) S.decks = JSON.parse(localStorage.getItem(DECKS_KEY));
      if (localStorage.getItem(TELEMETRY_KEY)) S.telemetry = JSON.parse(localStorage.getItem(TELEMETRY_KEY));
      if (!S.telemetry.daily || typeof S.telemetry.daily !== 'object') S.telemetry.daily = {};
      if (typeof S.telemetry.timeEngagedSec !== 'number') S.telemetry.timeEngagedSec = 0;
      if (typeof S.telemetry.globalCorrect !== 'number') S.telemetry.globalCorrect = 0;
      if (typeof S.telemetry.globalAnswered !== 'number') S.telemetry.globalAnswered = 0;
      if (typeof S.telemetry.cardsFlipped !== 'number') S.telemetry.cardsFlipped = 0;
      S.telemetry.daily = normalizeTelemetryDailyMap(S.telemetry.daily);
      const todayBucket = S.telemetry.daily[getTodayKey()] || {};
      S.telemetryTodayBaseline = {
        timeEngagedSec: Number(todayBucket.timeEngagedSec || 0),
        correctAnswered: Number(todayBucket.correctAnswered || 0),
        questionsAnswered: Number(todayBucket.questionsAnswered || 0),
        cardsFlipped: Number(todayBucket.cardsFlipped || 0)
      };
      saveTelemetry();
      
      if (S.decks.length === 0) {
        const defaultRaw = "Action Potential\nThe change in electrical potential associated with the passage of an impulse along the membrane of a muscle cell or nerve cell.\n\nWhat is the powerhouse of the cell?\n- Nucleus\n- Ribosome\n* Mitochondria\n\nCognitive Dissonance\nThe state of having inconsistent thoughts, beliefs, or attitudes.";
        saveDeck(Date.now().toString(), "Sample: Biology & Psych", defaultRaw);
      }

      ensureCmdSchedule();
      loadAgendaData();
      loadCalendarData();
      loadJournalData();
      ensureAgendaDnDDelegates();
      bindCalendarDragGlobal();
      if (!window.__axiomFocusPomoTick) {
        window.__axiomFocusPomoTick = true;
        window.setInterval(tickFocusPomodoro, 1000);
      }

      applySettingsToUI(els);
      applyTheme();
      updateHeaderModeUI();
      renderDashboard();
    }


    /** CMD dashboard: migrated from Solstice `updateDashboard` (schedule / mod / countdown logic). */
    function updateCmdDashboard() {
      if (S.appMode !== 'cmd' || S.cmdActiveView !== 'dashboard') return;
      if (!S.cmdScheduleAppData || !S.cmdScheduleAppData.schedule) return;
      const currentClassEl = document.getElementById('cmdDashCurrentClass');
      if (!currentClassEl) return;

      const ui = {
        currentClass: currentClassEl,
        currentMod: document.getElementById('cmdDashCurrentMod'),
        timeRange: document.getElementById('cmdDashTimeRange'),
        classCountdown: document.getElementById('cmdDashCountdown'),
        nextClass: document.getElementById('cmdDashNextClass'),
        modalMod: document.getElementById('cmdModDetailMod'),
        modalClass: document.getElementById('cmdModDetailClass'),
        modalTimeRange: document.getElementById('cmdModDetailTimeRange'),
        modalCountdown: document.getElementById('cmdModDetailCountdown'),
        modalNextMod: document.getElementById('cmdModDetailNextMod'),
        classCountdownDisplay: document.getElementById('cmdClassCountdownDisplay'),
        modalNextClass: document.getElementById('cmdClassCountdownNextClass')
      };

      const now = new Date();
      const dayOfWeek = now.getDay();
      const currentDayType = (dayOfWeek === 3) ? 'wednesday' : 'weekday';
      const currentSchedule = S.cmdScheduleAppData.schedule[currentDayType];

      const todaySchedule = currentSchedule.map(mod => {
        const startTime = parseCmdTimeString(mod.start);
        const endTime = parseCmdTimeString(mod.end);
        return {
          ...mod,
          startTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), startTime.hours, startTime.minutes),
          endTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), endTime.hours, endTime.minutes)
        };
      });

      function contiguousRange(index) {
        const cls = todaySchedule[index].cls;
        let startIndex = index;
        while (startIndex > 0 && todaySchedule[startIndex - 1].cls === cls) startIndex--;
        let endIndex = index;
        while (endIndex < todaySchedule.length - 1 && todaySchedule[endIndex + 1].cls === cls) endIndex++;
        return { startIndex, endIndex };
      }

      let currentIndex = -1;
      for (let i = 0; i < todaySchedule.length; i++) {
        const mod = todaySchedule[i];
        if (now >= mod.startTime && now < mod.endTime) {
          currentIndex = i;
          break;
        }
      }

      let gapIndex = -1;
      for (let i = 0; i < todaySchedule.length - 1; i++) {
        const endOfThis = todaySchedule[i].endTime;
        const startOfNext = todaySchedule[i + 1].startTime;
        if (now >= endOfThis && now < startOfNext) {
          gapIndex = i;
          break;
        }
      }

      function setNoScheduleUI() {
        ui.currentClass.textContent = 'No schedule available';
        ui.currentMod.textContent = '--';
        ui.timeRange.textContent = '--';
        ui.classCountdown.textContent = '--:--';
        ui.classCountdownDisplay.textContent = '--:--';
        ui.nextClass.textContent = 'No schedule available';
        ui.modalMod.textContent = '--';
        ui.modalClass.textContent = 'No schedule available';
        ui.modalTimeRange.textContent = '--';
        ui.modalCountdown.textContent = '--:--';
        ui.modalNextClass.textContent = 'No schedule available';
        ui.modalNextMod.textContent = 'No schedule available';
      }

      if (currentIndex >= 0) {
        const currentMod = todaySchedule[currentIndex];
        const clsName = currentMod.cls;
        ui.currentClass.textContent = clsName;
        ui.currentMod.textContent = currentMod.mod;

        if (clsName !== 'School is over') {
          const { startIndex, endIndex } = contiguousRange(currentIndex);
          const classStartTime = todaySchedule[startIndex].startTime;
          const classEndTime = todaySchedule[endIndex].endTime;

          ui.timeRange.textContent = `${formatCmdLocaleTime(classStartTime)} - ${formatCmdLocaleTime(classEndTime)}`;

          const timeRemaining = Math.max(0, Math.floor((classEndTime - now) / 1000));
          const minutes = Math.floor(timeRemaining / 60);
          const seconds = timeRemaining % 60;
          ui.classCountdown.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
          ui.classCountdownDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

          ui.modalMod.textContent = currentMod.mod;
          ui.modalClass.textContent = clsName;
          ui.modalTimeRange.textContent = `${formatCmdLocaleTime(currentMod.startTime)} - ${formatCmdLocaleTime(currentMod.endTime)}`;

          const modTimeRemaining = Math.max(0, Math.floor((currentMod.endTime - now) / 1000));
          const modMinutes = Math.floor(modTimeRemaining / 60);
          const modSeconds = modTimeRemaining % 60;
          ui.modalCountdown.textContent = `${modMinutes.toString().padStart(2, '0')}:${modSeconds.toString().padStart(2, '0')}`;

          if (currentIndex < todaySchedule.length - 1) {
            const nextMod = todaySchedule[currentIndex + 1];
            ui.modalNextMod.textContent = `${nextMod.mod} • ${formatCmdLocaleTime(nextMod.startTime)} - ${formatCmdLocaleTime(nextMod.endTime)}`;
          } else {
            ui.modalNextMod.textContent = 'No more mods today';
          }
        } else {
          ui.timeRange.textContent = '--';
          ui.classCountdown.textContent = '--:--';
          ui.classCountdownDisplay.textContent = '--:--';
          ui.modalMod.textContent = '--';
          ui.modalClass.textContent = 'School is over';
          ui.modalTimeRange.textContent = '--';
          ui.modalCountdown.textContent = '--:--';
          ui.modalNextMod.textContent = 'No more mods today';
        }

        const { startIndex, endIndex } = contiguousRange(currentIndex);
        let nextClassItem = null;
        for (let j = endIndex + 1; j < todaySchedule.length; j++) {
          if (todaySchedule[j].cls !== todaySchedule[j - 1].cls) {
            nextClassItem = todaySchedule[j];
            break;
          } else {
            nextClassItem = todaySchedule[j];
          }
        }
        if (nextClassItem) {
          const nextRange = contiguousRange(todaySchedule.indexOf(nextClassItem));
          const nextStart = todaySchedule[nextRange.startIndex].startTime;
          const nextEnd = todaySchedule[nextRange.endIndex].endTime;
          ui.nextClass.textContent = `${nextClassItem.cls} • ${formatCmdLocaleTime(nextStart)} - ${formatCmdLocaleTime(nextEnd)}`;
          ui.modalNextClass.textContent = `${nextClassItem.cls} • ${formatCmdLocaleTime(nextStart)} - ${formatCmdLocaleTime(nextEnd)}`;
        } else {
          ui.nextClass.textContent = 'No more classes today';
          ui.modalNextClass.textContent = 'No more classes today';
        }

        return;
      }

      if (gapIndex >= 0) {
        const before = todaySchedule[gapIndex];
        const after = todaySchedule[gapIndex + 1];

        if (before.cls === after.cls) {
          const clsName = before.cls;
          ui.currentClass.textContent = clsName;
          ui.currentMod.textContent = before.mod;

          const { startIndex, endIndex } = contiguousRange(gapIndex);
          const classStartTime = todaySchedule[startIndex].startTime;
          const classEndTime = todaySchedule[endIndex].endTime;
          ui.timeRange.textContent = `${formatCmdLocaleTime(classStartTime)} - ${formatCmdLocaleTime(classEndTime)}`;

          const timeRemaining = Math.max(0, Math.floor((classEndTime - now) / 1000));
          const minutes = Math.floor(timeRemaining / 60);
          const seconds = timeRemaining % 60;
          ui.classCountdown.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
          ui.classCountdownDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

          ui.modalMod.textContent = `Between ${before.mod} and ${after.mod}`;
          ui.modalClass.textContent = clsName;
          ui.modalTimeRange.textContent = 'Between Mods';
          ui.modalCountdown.textContent = '--:--';
          ui.modalNextMod.textContent = `${after.mod} • ${formatCmdLocaleTime(after.startTime)} - ${formatCmdLocaleTime(after.endTime)}`;

          let nextClassItem = null;
          for (let j = endIndex + 1; j < todaySchedule.length; j++) {
            if (todaySchedule[j].cls !== todaySchedule[j - 1].cls) {
              nextClassItem = todaySchedule[j];
              break;
            }
          }
          if (nextClassItem) {
            const nextRange = contiguousRange(todaySchedule.indexOf(nextClassItem));
            const nextStart = todaySchedule[nextRange.startIndex].startTime;
            const nextEnd = todaySchedule[nextRange.endIndex].endTime;
            ui.nextClass.textContent = `${nextClassItem.cls} • ${formatCmdLocaleTime(nextStart)} - ${formatCmdLocaleTime(nextEnd)}`;
            ui.modalNextClass.textContent = `${nextClassItem.cls} • ${formatCmdLocaleTime(nextStart)} - ${formatCmdLocaleTime(nextEnd)}`;
          } else {
            ui.nextClass.textContent = 'No more classes today';
            ui.modalNextClass.textContent = 'No more classes today';
          }

          return;
        }

        ui.currentClass.textContent = 'No current class';
        ui.currentMod.textContent = `Between ${before.mod} and ${after.mod}`;
        ui.timeRange.textContent = '--';
        ui.classCountdown.textContent = '--:--';
        ui.classCountdownDisplay.textContent = '--:--';

        const nextRange = contiguousRange(gapIndex + 1);
        const nextStart = todaySchedule[nextRange.startIndex].startTime;
        const nextEnd = todaySchedule[nextRange.endIndex].endTime;
        ui.nextClass.textContent = `${after.cls} • ${formatCmdLocaleTime(nextStart)} - ${formatCmdLocaleTime(nextEnd)}`;
        ui.modalNextClass.textContent = `${after.cls} • ${formatCmdLocaleTime(nextStart)} - ${formatCmdLocaleTime(nextEnd)}`;

        ui.modalMod.textContent = `Between ${before.mod} and ${after.mod}`;
        ui.modalClass.textContent = 'No current class';
        ui.modalTimeRange.textContent = '--';
        ui.modalCountdown.textContent = '--:--';
        ui.modalNextMod.textContent = `${after.mod} • ${formatCmdLocaleTime(after.startTime)} - ${formatCmdLocaleTime(after.endTime)}`;

        return;
      }

      if (todaySchedule.length === 0) {
        setNoScheduleUI();
        return;
      }

      const firstMod = todaySchedule[0];
      if (now < firstMod.startTime) {
        ui.currentClass.textContent = 'No current class';
        ui.currentMod.textContent = '--';
        ui.timeRange.textContent = '--';
        ui.classCountdown.textContent = '--:--';
        ui.classCountdownDisplay.textContent = '--:--';
        const nextRange = contiguousRange(0);
        const nextStart = todaySchedule[nextRange.startIndex].startTime;
        const nextEnd = todaySchedule[nextRange.endIndex].endTime;
        ui.nextClass.textContent = `${firstMod.cls} • ${formatCmdLocaleTime(nextStart)} - ${formatCmdLocaleTime(nextEnd)}`;

        ui.modalMod.textContent = '--';
        ui.modalClass.textContent = 'No current class';
        ui.modalTimeRange.textContent = '--';
        ui.modalCountdown.textContent = '--:--';
        ui.modalNextClass.textContent = `${firstMod.cls} • ${formatCmdLocaleTime(nextStart)} - ${formatCmdLocaleTime(nextEnd)}`;
        ui.modalNextMod.textContent = `${firstMod.mod} • ${formatCmdLocaleTime(firstMod.startTime)} - ${formatCmdLocaleTime(firstMod.endTime)}`;

        return;
      }

      const lastMod = todaySchedule[todaySchedule.length - 1];
      if (now >= lastMod.endTime) {
        ui.currentClass.textContent = 'School is over';
        ui.currentMod.textContent = '--';
        ui.timeRange.textContent = '--';
        ui.classCountdown.textContent = '--:--';
        ui.classCountdownDisplay.textContent = '--:--';

        ui.modalMod.textContent = '--';
        ui.modalClass.textContent = 'School is over';
        ui.modalTimeRange.textContent = '--';
        ui.modalCountdown.textContent = '--:--';
        ui.modalNextMod.textContent = 'No more mods today';
        ui.nextClass.textContent = 'No more classes today';
        ui.modalNextClass.textContent = 'No more classes today';

        return;
      }

      setNoScheduleUI();
    }

    function loadAgendaData() {
      try {
        const rawT = localStorage.getItem(AGENDA_TASKS_KEY);
        const rawO = localStorage.getItem(AGENDA_TASK_ORDER_KEY);
        S.agendaTasks = rawT ? JSON.parse(rawT) : JSON.parse(JSON.stringify(DEFAULT_AGENDA_TASKS));
        S.agendaTaskOrder = rawO ? JSON.parse(rawO) : [];
        if (!rawT) saveAgendaData();
      } catch (e) {
        S.agendaTasks = JSON.parse(JSON.stringify(DEFAULT_AGENDA_TASKS));
        S.agendaTaskOrder = [];
        saveAgendaData();
      }
    }

    function saveAgendaData() {
      localStorage.setItem(AGENDA_TASKS_KEY, JSON.stringify(S.agendaTasks));
      localStorage.setItem(AGENDA_TASK_ORDER_KEY, JSON.stringify(S.agendaTaskOrder));
    }

    function loadCalendarData() {
      try {
        const raw = localStorage.getItem(CALENDAR_EVENTS_KEY);
        S.calendarEvents = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(S.calendarEvents)) S.calendarEvents = [];
      } catch (e) {
        S.calendarEvents = [];
      }
    }

    function saveCalendarData() {
      localStorage.setItem(CALENDAR_EVENTS_KEY, JSON.stringify(S.calendarEvents));
    }

    function loadJournalData() {
      try {
        const raw = localStorage.getItem(JOURNAL_ENTRIES_KEY);
        S.journalEntries = raw ? JSON.parse(raw) : {};
        if (!S.journalEntries || typeof S.journalEntries !== 'object' || Array.isArray(S.journalEntries)) S.journalEntries = {};
      } catch (e) {
        S.journalEntries = {};
      }
    }

    function saveJournalData() {
      localStorage.setItem(JOURNAL_ENTRIES_KEY, JSON.stringify(S.journalEntries));
    }

    function toDatetimeLocalValue(d) {
      const pad = n => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }

    function formatAgendaDateTime(date) {
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    }

    function groupAgendaItemsByDate(items) {
      const itemsByDate = {};
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      items.forEach(item => {
        const dueDate = item.due ? new Date(item.due) : null;
        let groupKey = 'No Due Date';

        if (dueDate) {
          const d = new Date(dueDate);
          d.setHours(0, 0, 0, 0);
          if (d.getTime() === today.getTime()) groupKey = 'Today';
          else if (d.getTime() === tomorrow.getTime()) groupKey = 'Tomorrow';
          else groupKey = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        }

        if (!itemsByDate[groupKey]) itemsByDate[groupKey] = [];
        itemsByDate[groupKey].push(item);
      });

      const sortedGroups = {};
      ['Today', 'Tomorrow'].forEach(group => {
        if (itemsByDate[group]) {
          sortedGroups[group] = itemsByDate[group];
          delete itemsByDate[group];
        }
      });

      Object.keys(itemsByDate)
        .sort((a, b) => {
          if (a === 'No Due Date') return 1;
          if (b === 'No Due Date') return -1;
          return new Date(a) - new Date(b);
        })
        .forEach(key => { sortedGroups[key] = itemsByDate[key]; });

      return sortedGroups;
    }

    function getAgendaDragAfterElement(container, y) {
      const draggableElements = [...container.querySelectorAll('.agenda-item:not(.dragging)')];
      return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) return { offset, element: child };
        return closest;
      }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    function updateAgendaTaskOrderFromDom() {
      const list = document.getElementById('agendaPanelTasks');
      if (!list) return;
      const newOrder = [];
      list.querySelectorAll('.agenda-item[data-agenda-id]').forEach(el => {
        const id = Number(el.dataset.agendaId);
        if (!Number.isNaN(id)) newOrder.push(id);
      });
      S.agendaTaskOrder = newOrder;
    }

    function onAgendaPanelDragOver(e) {
      const list = e.target.closest('#agendaPanelTasks');
      if (!list || !document.querySelector('.agenda-item.dragging')) return;
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
      const afterElement = getAgendaDragAfterElement(list, e.clientY);
      const drag = document.querySelector('.agenda-item.dragging');
      if (!drag) return;
      if (afterElement == null) {
        if (list.lastElementChild !== drag) list.appendChild(drag);
      } else if (afterElement !== drag && afterElement.previousElementSibling !== drag) {
        list.insertBefore(drag, afterElement);
      }
      list.querySelectorAll('.agenda-item.drag-hover').forEach(el => el.classList.remove('drag-hover'));
      if (afterElement) afterElement.classList.add('drag-hover');
    }

    function onAgendaPanelDrop(e) {
      const list = e.target.closest('#agendaPanelTasks');
      if (!list) return;
      e.preventDefault();
      list.querySelectorAll('.agenda-item.drag-hover').forEach(el => el.classList.remove('drag-hover'));
      updateAgendaTaskOrderFromDom();
      saveAgendaData();
      renderAgendaLists();
    }

    function ensureAgendaDnDDelegates() {
      if (window.__axiomAgendaDnDBound) return;
      window.__axiomAgendaDnDBound = true;
      els.cmdContent.addEventListener('dragover', onAgendaPanelDragOver);
      els.cmdContent.addEventListener('drop', onAgendaPanelDrop);
    }

    function createAgendaItemElement(item) {
      const row = document.createElement('div');
      row.className = `agenda-item${item.completed ? ' completed' : ''}`;
      row.dataset.agendaId = String(item.id);

      const dueDate = item.due ? new Date(item.due) : null;
      const dueString = dueDate ? formatAgendaDateTime(dueDate) : 'No due date';
      const classString = item.class ? ` • ${item.class}` : '';
      const notesHint = item.notes ? `<span style="opacity:0.85"> · ${escapeHtml(item.notes.slice(0, 80))}${item.notes.length > 80 ? '…' : ''}</span>` : '';

      const canDrag = item.type === 'task' && !item.completed && S.agendaUiFilter === 'tasks';
      if (canDrag) row.draggable = true;

      row.innerHTML = `
        <input type="checkbox" class="agenda-check-input" ${item.completed ? 'checked' : ''}>
        <div class="agenda-main">
          <div class="agenda-title-row">
            <span class="agenda-title">${escapeHtml(item.title)}</span>
          </div>
          <div class="agenda-meta">${escapeHtml(dueString)}${escapeHtml(classString)}${notesHint}</div>
        </div>
        ${item.type === 'task' ? `<span class="agenda-dot ${item.priority === 'high' ? 'red' : item.priority === 'low' ? 'green' : 'yellow'}" aria-hidden="true"></span>` : '<span class="agenda-dot-spacer" aria-hidden="true"></span>'}
        <div class="agenda-right">
          <button type="button" class="agenda-icon-btn agenda-edit-btn" title="Edit" aria-label="Edit"><i class="fas fa-edit"></i></button>
          <button type="button" class="agenda-icon-btn agenda-delete-btn" title="Delete" aria-label="Delete"><i class="fas fa-trash"></i></button>
        </div>
      `;

      row.querySelector('.agenda-check-input').addEventListener('change', () => toggleAgendaItemComplete(item.id));

      row.querySelector('.agenda-edit-btn').addEventListener('click', (ev) => {
        ev.stopPropagation();
        openAgendaModalEdit(item.id);
      });
      row.querySelector('.agenda-delete-btn').addEventListener('click', (ev) => {
        ev.stopPropagation();
        deleteAgendaItem(item.id);
      });

      if (canDrag) {
        row.addEventListener('dragstart', (ev) => {
          S.agendaDragSource = row;
          ev.dataTransfer.setData('text/plain', String(item.id));
          ev.dataTransfer.effectAllowed = 'move';
          if (ev.dataTransfer && ev.dataTransfer.setDragImage) ev.dataTransfer.setDragImage(row, 16, 16);
          row.classList.add('dragging');
        });
        row.addEventListener('dragend', () => {
          row.classList.remove('dragging');
          document.querySelectorAll('.agenda-item.drag-hover').forEach(el => el.classList.remove('drag-hover'));
          updateAgendaTaskOrderFromDom();
          saveAgendaData();
          renderAgendaLists();
          S.agendaDragSource = null;
        });
      }

      return row;
    }

    function toggleAgendaItemComplete(id) {
      const taskIndex = S.agendaTasks.findIndex(t => t.id === id);
      if (taskIndex === -1) return;
      const item = S.agendaTasks[taskIndex];
      const becomingComplete = !item.completed;

      if (becomingComplete && S.agendaUiFilter !== 'completed') {
        const row = document.querySelector(`.agenda-item[data-agenda-id="${id}"]`);
        if (row) {
          const cb = row.querySelector('.agenda-check-input');
          if (cb) cb.disabled = true;
          row.classList.add('agenda-complete-flash');
          window.setTimeout(() => {
            item.completed = true;
            item.completedAt = new Date().toISOString();
            S.agendaTaskOrder = S.agendaTaskOrder.filter(oid => oid !== id);
            saveAgendaData();
            renderAgendaLists();
          }, 520);
          return;
        }
      }

      item.completed = !item.completed;
      if (item.completed) {
        item.completedAt = new Date().toISOString();
        S.agendaTaskOrder = S.agendaTaskOrder.filter(oid => oid !== id);
      } else {
        delete item.completedAt;
        if (!S.agendaTaskOrder.includes(id)) S.agendaTaskOrder.push(id);
      }
      saveAgendaData();
      renderAgendaLists();
      renderCalendarWeek();
    }

    function deleteAgendaItem(id) {
      S.agendaTasks = S.agendaTasks.filter(t => t.id !== id);
      S.agendaTaskOrder = S.agendaTaskOrder.filter(oid => oid !== id);
      saveAgendaData();
      renderAgendaLists();
      renderCalendarWeek();
    }

    function addAgendaItem(itemData, type) {
      const newItem = {
        id: Date.now(),
        title: itemData.title,
        due: itemData.due,
        priority: itemData.priority || '',
        class: itemData.class || '',
        notes: itemData.notes || '',
        type,
        completed: false,
        createdAt: new Date().toISOString()
      };
      S.agendaTasks.push(newItem);
      S.agendaTaskOrder.push(newItem.id);
      saveAgendaData();
      renderAgendaLists();
      renderCalendarWeek();
    }

    function updateAgendaItem(id, itemData) {
      const taskIndex = S.agendaTasks.findIndex(t => t.id === id);
      if (taskIndex === -1) return;
      S.agendaTasks[taskIndex] = { ...S.agendaTasks[taskIndex], ...itemData };
      saveAgendaData();
      renderAgendaLists();
      renderCalendarWeek();
    }

    function openAgendaModalEdit(id) {
      const task = S.agendaTasks.find(t => t.id === id);
      if (!task) return;
      const modal = document.getElementById('agendaItemModal');
      document.getElementById('agendaModalTitle').textContent = `Edit ${task.type === 'task' ? 'Task' : 'Event'}`;
      document.getElementById('agendaItemId').value = String(task.id);
      document.getElementById('agendaItemType').value = task.type;
      document.getElementById('agendaFieldTitle').value = task.title;
      document.getElementById('agendaFieldDue').value = task.due ? task.due.substring(0, 16) : '';
      document.getElementById('agendaFieldPriority').value = task.priority || 'medium';
      document.getElementById('agendaFieldClass').value = task.class || '';
      document.getElementById('agendaFieldNotes').value = task.notes || '';
      document.querySelectorAll('.agenda-priority-field, .agenda-class-field').forEach(el => {
        el.style.display = task.type === 'event' ? 'none' : 'block';
      });
      modal.classList.remove('hidden');
    }

    function openAgendaModalNewTask() {
      const modal = document.getElementById('agendaItemModal');
      document.getElementById('agendaModalTitle').textContent = 'Add Task';
      document.getElementById('agendaItemForm').reset();
      document.getElementById('agendaItemId').value = '';
      document.getElementById('agendaItemType').value = 'task';
      document.querySelectorAll('.agenda-priority-field, .agenda-class-field').forEach(el => { el.style.display = 'block'; });
      const now = new Date();
      now.setHours(23, 59, 0, 0);
      document.getElementById('agendaFieldDue').value = toDatetimeLocalValue(now);
      modal.classList.remove('hidden');
    }

    function openAgendaModalNewEvent() {
      const modal = document.getElementById('agendaItemModal');
      document.getElementById('agendaModalTitle').textContent = 'Add Event';
      document.getElementById('agendaItemForm').reset();
      document.getElementById('agendaItemId').value = '';
      document.getElementById('agendaItemType').value = 'event';
      document.querySelectorAll('.agenda-priority-field, .agenda-class-field').forEach(el => { el.style.display = 'none'; });
      modal.classList.remove('hidden');
    }

    function closeAgendaModal() {
      document.getElementById('agendaItemModal').classList.add('hidden');
    }

    function startOfWeek(dateObj) {
      const d = new Date(dateObj);
      d.setHours(0, 0, 0, 0);
      const dow = d.getDay();
      const diff = (dow + 6) % 7;
      d.setDate(d.getDate() - diff);
      return d;
    }


    function toDateTimeLocalKey(dateObj) {
      const d = dateObj instanceof Date ? dateObj : new Date(dateObj);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      return `${y}-${m}-${day}T${hh}:${mm}`;
    }

    function parseDateTimeLocalKey(value) {
      if (!value) return new Date();
      return new Date(value);
    }

    function normalizeCalendarEvent(raw) {
      const fallbackColor = '#7f8aa5';
      return {
        id: raw.id || Date.now(),
        title: raw.title || 'Untitled',
        start: raw.start || toDateTimeLocalKey(new Date()),
        end: raw.end || toDateTimeLocalKey(addDays(new Date(), 0)),
        allDay: !!raw.allDay,
        color: raw.color || fallbackColor,
        repeatRule: raw.repeatRule || 'none',
        repeatDays: Array.isArray(raw.repeatDays) ? raw.repeatDays.map(Number).filter(v => v >= 0 && v <= 6) : [],
        notes: raw.notes || ''
      };
    }

    function getWeekDays(anchor) {
      const start = startOfWeek(anchor);
      return Array.from({ length: 7 }, (_, idx) => addDays(start, idx));
    }

    function doesEventOccurOnDay(evt, dayDate) {
      const start = new Date(evt.start);
      const end = new Date(evt.end);
      const dayStart = new Date(dayDate); dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayDate); dayEnd.setHours(23, 59, 59, 999);
      if (evt.repeatRule === 'none') {
        return start <= dayEnd && end >= dayStart;
      }
      if (evt.repeatRule === 'daily') return dayStart >= new Date(start.getFullYear(), start.getMonth(), start.getDate());
      if (evt.repeatRule === 'weekly') return dayDate.getDay() === start.getDay() && dayStart >= new Date(start.getFullYear(), start.getMonth(), start.getDate());
      if (evt.repeatRule === 'weekdays') {
        const dow = dayDate.getDay();
        return dow >= 1 && dow <= 5 && dayStart >= new Date(start.getFullYear(), start.getMonth(), start.getDate());
      }
      if (evt.repeatRule === 'custom') {
        const allowed = Array.isArray(evt.repeatDays) && evt.repeatDays.length ? evt.repeatDays : [start.getDay()];
        return allowed.includes(dayDate.getDay()) && dayStart >= new Date(start.getFullYear(), start.getMonth(), start.getDate());
      }
      return false;
    }

    function materializeEventForDay(evt, dayDate) {
      const srcStart = new Date(evt.start);
      const srcEnd = new Date(evt.end);
      const durMs = Math.max(15 * 60 * 1000, srcEnd.getTime() - srcStart.getTime());
      const dayStart = new Date(dayDate);
      dayStart.setHours(srcStart.getHours(), srcStart.getMinutes(), 0, 0);
      const dayEnd = new Date(dayStart.getTime() + durMs);
      return {
        ...evt,
        displayStart: dayStart,
        displayEnd: dayEnd
      };
    }

    function getAgendaEventsAsCalendarReadonly() { return []; }

    function getCalendarEventsForWeek(anchor) {
      const days = getWeekDays(anchor);
      const result = {};
      days.forEach(d => { result[toLocalDateKey(d)] = []; });
      const merged = S.calendarEvents.concat(getAgendaEventsAsCalendarReadonly());
      merged.forEach(rawEvt => {
        const evt = normalizeCalendarEvent(rawEvt);
        days.forEach(day => {
          if (!doesEventOccurOnDay(evt, day)) return;
          const key = toLocalDateKey(day);
          result[key].push(materializeEventForDay(evt, day));
        });
      });
      Object.keys(result).forEach(k => {
        result[k].sort((a, b) => a.displayStart - b.displayStart);
      });
      return result;
    }

    function getMinutesSinceCalendarStart(dateObj) {
      const d = new Date(dateObj);
      return (d.getHours() * 60 + d.getMinutes()) - 60;
    }

    function getTopFromMinutes(min) {
      const pxPerMin = 56 / 60;
      return min * pxPerMin;
    }

    function clampCalendarMinutes(min) {
      return Math.max(0, Math.min(23 * 60, min));
    }

    function minutesToLabel(minuteOffset) {
      const total = minuteOffset + 60;
      const hour = Math.floor(total / 60);
      const mins = total % 60;
      const base = new Date();
      base.setHours(hour % 24, mins, 0, 0);
      return base.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    }

    function formatCalendarEventTime(evt) {
      return `${evt.displayStart.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} - ${evt.displayEnd.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    }

    function softSnapCalendarMinute(minute) {
      const rounded5 = Math.round(minute / 5) * 5;
      const nearest15 = Math.round(minute / 15) * 15;
      const delta = Math.abs(rounded5 - nearest15);
      return delta <= 4 ? nearest15 : rounded5;
    }

    function getCalendarMinuteFromPointer(laneEl, clientY) {
      const rect = laneEl.getBoundingClientRect();
      return clampCalendarMinutes(Math.round((clientY - rect.top) / (56 / 60)));
    }

    function getCalendarLaneFromPointerX(clientX) {
      const lanes = [...document.querySelectorAll('#calendarWeekGrid .calendar-day-lane')];
      for (const lane of lanes) {
        const r = lane.getBoundingClientRect();
        if (clientX >= r.left && clientX <= r.right) return lane;
      }
      return null;
    }

    function openCalendarModalForNew(dayDate) {
      const modal = document.getElementById('calendarEventModal');
      const start = new Date(dayDate);
      start.setHours(8, 0, 0, 0);
      const end = new Date(start.getTime() + (60 * 60 * 1000));
      document.getElementById('calendarModalTitle').textContent = 'Add Calendar Event';
      document.getElementById('calendarEventForm').reset();
      document.getElementById('calendarEventId').value = '';
      document.getElementById('calendarFieldStart').value = toDateTimeLocalKey(start);
      document.getElementById('calendarFieldEnd').value = toDateTimeLocalKey(end);
      document.getElementById('calendarFieldColor').value = '#7f8aa5';
      syncCalendarColorSwatches('#7f8aa5');
      setCalendarRepeatDays([start.getDay()]);
      document.getElementById('calendarDeleteBtn').classList.add('hidden');
      modal.classList.remove('hidden');
    }

    function openCalendarModalFromDrag(dayKey, startMin, endMin) {
      const day = parseLocalDateKey(dayKey);
      const start = new Date(day);
      const end = new Date(day);
      const s = softSnapCalendarMinute(Math.floor(Math.min(startMin, endMin)));
      const e = softSnapCalendarMinute(Math.ceil(Math.max(startMin, endMin)));
      start.setHours(1, 0, 0, 0);
      start.setMinutes(start.getMinutes() + s);
      end.setHours(1, 0, 0, 0);
      end.setMinutes(end.getMinutes() + Math.max(e, s + 30));
      const modal = document.getElementById('calendarEventModal');
      document.getElementById('calendarModalTitle').textContent = 'Add Calendar Event';
      document.getElementById('calendarEventForm').reset();
      document.getElementById('calendarEventId').value = '';
      document.getElementById('calendarFieldStart').value = toDateTimeLocalKey(start);
      document.getElementById('calendarFieldEnd').value = toDateTimeLocalKey(end);
      document.getElementById('calendarFieldColor').value = '#7f8aa5';
      syncCalendarColorSwatches('#7f8aa5');
      setCalendarRepeatDays([start.getDay()]);
      document.getElementById('calendarDeleteBtn').classList.add('hidden');
      modal.classList.remove('hidden');
    }

    function openCalendarModalForEdit(evtId) {
      const event = S.calendarEvents.find(e => String(e.id) === String(evtId));
      if (!event) return;
      const modal = document.getElementById('calendarEventModal');
      document.getElementById('calendarModalTitle').textContent = 'Edit Calendar Event';
      document.getElementById('calendarEventId').value = String(event.id);
      document.getElementById('calendarFieldTitle').value = event.title || '';
      document.getElementById('calendarFieldStart').value = event.start || '';
      document.getElementById('calendarFieldEnd').value = event.end || '';
      document.getElementById('calendarFieldColor').value = event.color || '#7f8aa5';
      syncCalendarColorSwatches(event.color || '#7f8aa5');
      document.getElementById('calendarFieldRepeat').value = event.repeatRule || 'none';
      setCalendarRepeatDays((event.repeatDays && event.repeatDays.length) ? event.repeatDays : [new Date(event.start).getDay()]);
      updateCalendarRepeatDaysVisibility();
      document.getElementById('calendarFieldNotes').value = event.notes || '';
      document.getElementById('calendarDeleteBtn').classList.remove('hidden');
      modal.classList.remove('hidden');
    }

    function closeCalendarModal() {
      document.getElementById('calendarEventModal').classList.add('hidden');
    }

    function openCalendarDayModal(dayDate) {
      const body = document.getElementById('calendarDayModalBody');
      const title = document.getElementById('calendarDayModalTitle');
      if (!body || !title) return;
      title.textContent = dayDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
      body.innerHTML = `
        <div class="calendar-week-grid-wrap" style="height: 68vh;">
          <div class="calendar-week-grid" style="grid-template-columns: 70px minmax(0, 1fr); min-width: 0;">
            <div class="calendar-time-corner"></div>
            <div class="calendar-day-head"><span>${dayDate.toLocaleDateString('en-US', { weekday: 'short' })}</span><span class="calendar-day-num">${dayDate.getDate()}</span></div>
            <div class="calendar-time-col" id="calendarDayModalTimeCol"></div>
            <div class="calendar-day-lane" id="calendarDayModalLane"></div>
          </div>
        </div>
      `;
      const lane = document.getElementById('calendarDayModalLane');
      const timeCol = document.getElementById('calendarDayModalTimeCol');
      for (let h = 1; h <= 24; h++) {
        const label = document.createElement('div');
        label.className = 'calendar-time-label';
        const hour = h === 24 ? 0 : h;
        const dt = new Date(dayDate);
        dt.setHours(hour, 0, 0, 0);
        label.textContent = dt.toLocaleTimeString('en-US', { hour: 'numeric' });
        timeCol.appendChild(label);
      }
      const key = toLocalDateKey(dayDate);
      const weekEvents = getCalendarEventsForWeek(dayDate)[key] || [];
      weekEvents.forEach(evt => {
        const top = getTopFromMinutes(clampCalendarMinutes(getMinutesSinceCalendarStart(evt.displayStart)));
        const end = getTopFromMinutes(clampCalendarMinutes(getMinutesSinceCalendarStart(evt.displayEnd)));
        const item = document.createElement('button');
        item.type = 'button';
        item.className = `calendar-event${evt.__readonly ? ' readonly' : ''}`;
        item.style.top = `${top}px`;
        item.style.height = `${Math.max(22, end - top)}px`;
        item.innerHTML = `
          <div class="calendar-event-title">${escapeHtml(evt.title)}</div>
          <div class="calendar-event-time">${escapeHtml(formatCalendarEventTime(evt))}</div>
        `;
        if (!evt.__readonly) item.onclick = () => openCalendarModalForEdit(evt.id);
        lane.appendChild(item);
      });
      document.getElementById('calendarDayModal').classList.remove('hidden');
    }

    function closeCalendarDayModal() {
      document.getElementById('calendarDayModal').classList.add('hidden');
    }

    function setCalendarRepeatDays(daysArr) {
      const chips = document.querySelectorAll('.calendar-repeat-day-chip');
      const set = new Set((daysArr || []).map(Number));
      chips.forEach(ch => ch.classList.toggle('active', set.has(Number(ch.dataset.dow))));
    }

    function getCalendarRepeatDaysFromUI() {
      return [...document.querySelectorAll('.calendar-repeat-day-chip.active')].map(ch => Number(ch.dataset.dow));
    }

    function updateCalendarRepeatDaysVisibility() {
      const wrap = document.getElementById('calendarRepeatDaysWrap');
      const repeat = document.getElementById('calendarFieldRepeat');
      if (!wrap || !repeat) return;
      wrap.classList.toggle('hidden', repeat.value !== 'custom');
    }

    function syncCalendarColorSwatches(hex) {
      document.querySelectorAll('.calendar-color-swatch').forEach(sw => {
        sw.classList.toggle('active', sw.dataset.color === hex);
      });
    }

    function renderCalendarMonthGrid() {
      const grid = document.getElementById('calendarMonthGrid');
      const monthSel = document.getElementById('calendarMonthSelect');
      const yearSel = document.getElementById('calendarYearSelect');
      const label = document.getElementById('calendarMonthLabel');
      if (!grid || !monthSel || !yearSel || !label) return;
      const y = S.calendarMonthCursor.getFullYear();
      const m = S.calendarMonthCursor.getMonth();
      label.textContent = S.calendarMonthCursor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      monthSel.value = String(m);
      yearSel.value = String(y);
      grid.innerHTML = '';
      const first = new Date(y, m, 1);
      const startShift = first.getDay();
      const startDate = new Date(y, m, 1 - startShift);
      for (let i = 0; i < 42; i++) {
        const d = addDays(startDate, i);
        const cell = document.createElement('button');
        cell.type = 'button';
        cell.className = `calendar-month-cell${d.getMonth() !== m ? ' muted' : ''}`;
        cell.innerHTML = `<div style="font-weight:700;">${d.getDate()}</div>`;
        cell.onclick = () => {
          S.calendarAnchorDate = new Date(d);
          closeCalendarMonthModal();
          renderCalendarWeek();
        };
        grid.appendChild(cell);
      }
    }

    function openCalendarMonthModal() {
      const monthSel = document.getElementById('calendarMonthSelect');
      const yearSel = document.getElementById('calendarYearSelect');
      if (monthSel && !monthSel.dataset.init) {
        monthSel.dataset.init = '1';
        monthSel.innerHTML = Array.from({ length: 12 }, (_, i) => `<option value="${i}">${new Date(2026, i, 1).toLocaleDateString('en-US', { month: 'long' })}</option>`).join('');
      }
      if (yearSel && !yearSel.dataset.init) {
        yearSel.dataset.init = '1';
        const nowY = new Date().getFullYear();
        let html = '';
        for (let y = nowY - 10; y <= nowY + 10; y++) html += `<option value="${y}">${y}</option>`;
        yearSel.innerHTML = html;
      }
      S.calendarMonthCursor = new Date(S.calendarAnchorDate);
      renderCalendarMonthGrid();
      document.getElementById('calendarMonthModal').classList.remove('hidden');
    }

    function closeCalendarMonthModal() {
      document.getElementById('calendarMonthModal').classList.add('hidden');
    }


    function journalApplyEntryContent(dayKey, html) {
      const plain = stripJournalHtml(html || '');
      if (!plain.length) delete S.journalEntries[dayKey];
      else S.journalEntries[dayKey] = { content: html || '', updatedAt: Date.now() };
    }

    function openJournalEntryModal(dateKey) {
      const entry = S.journalEntries[dateKey] || { content: '' };
      const plain = stripJournalHtml(entry.content || '');
      document.getElementById('journalEntryModalTitle').textContent = parseLocalDateKey(dateKey).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
      const body = document.getElementById('journalEntryModalBody');
      if (!plain.length) {
        body.innerHTML = '<p class="journal-modal-empty">No entry for this day.</p>';
      } else {
        body.innerHTML = entry.content || '';
      }
      const hint = document.getElementById('journalEntryModalHint');
      if (hint) {
        hint.textContent = dateKey === getTodayKey()
          ? 'Read-only preview. To change today\'s note, close this and edit the main journal area above.'
          : 'Read-only. Past days can\'t be edited here.';
      }
      document.getElementById('journalEntryModal').classList.remove('hidden');
    }

    function closeJournalEntryModal() {
      document.getElementById('journalEntryModal').classList.add('hidden');
    }

    function renderJournalMonthGrid() {
      const grid = document.getElementById('journalMonthGrid');
      const monthSel = document.getElementById('journalMonthSelect');
      const yearSel = document.getElementById('journalYearSelect');
      const label = document.getElementById('journalMonthLabel');
      if (!grid || !monthSel || !yearSel || !label) return;
      const y = S.journalMonthCursor.getFullYear();
      const m = S.journalMonthCursor.getMonth();
      label.textContent = S.journalMonthCursor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      monthSel.value = String(m);
      yearSel.value = String(y);
      grid.innerHTML = '';
      const first = new Date(y, m, 1);
      const startShift = first.getDay();
      const startDate = new Date(y, m, 1 - startShift);
      for (let i = 0; i < 42; i++) {
        const d = addDays(startDate, i);
        const key = toLocalDateKey(d);
        const hasEntry = !!(stripJournalHtml(S.journalEntries[key]?.content || '') || '').length;
        const cell = document.createElement('button');
        cell.type = 'button';
        cell.className = `calendar-month-cell${d.getMonth() !== m ? ' muted' : ''}`;
        cell.style.borderColor = hasEntry ? '#dadceb' : '';
        cell.innerHTML = `<div style="font-weight:700;">${d.getDate()}</div>`;
        cell.onclick = () => {
          closeJournalMonthModal();
          openJournalEntryModal(key);
        };
        grid.appendChild(cell);
      }
    }

    function openJournalMonthModal() {
      const monthSel = document.getElementById('journalMonthSelect');
      const yearSel = document.getElementById('journalYearSelect');
      if (monthSel && !monthSel.dataset.init) {
        monthSel.dataset.init = '1';
        monthSel.innerHTML = Array.from({ length: 12 }, (_, i) => `<option value="${i}">${new Date(2026, i, 1).toLocaleDateString('en-US', { month: 'long' })}</option>`).join('');
      }
      if (yearSel && !yearSel.dataset.init) {
        yearSel.dataset.init = '1';
        const nowY = new Date().getFullYear();
        let html = '';
        for (let y = nowY - 10; y <= nowY + 10; y++) html += `<option value="${y}">${y}</option>`;
        yearSel.innerHTML = html;
      }
      S.journalMonthCursor = parseLocalDateKey(getTodayKey());
      renderJournalMonthGrid();
      document.getElementById('journalMonthModal').classList.remove('hidden');
    }

    function closeJournalMonthModal() {
      document.getElementById('journalMonthModal').classList.add('hidden');
    }

    function getDebriefItemsForToday() {
      const now = new Date();
      const todayKey = toLocalDateKey(now);
      const dayStart = parseLocalDateKey(todayKey);
      const dayEnd = addDays(dayStart, 1);
      const items = [];

      const weekEvents = getCalendarEventsForWeek(now)[todayKey] || [];
      weekEvents.forEach(evt => {
        items.push({
          kind: evt.__readonly ? 'linked' : 'event',
          title: evt.title || 'Untitled event',
          start: evt.displayStart,
          end: evt.displayEnd
        });
      });

      S.agendaTasks.forEach(t => {
        if (t.completed) return;
        if (!t.due) return;
        const due = new Date(t.due);
        if (due >= dayStart && due < dayEnd) {
          items.push({
            kind: 'task',
            title: t.title || 'Untitled task',
            start: due,
            end: due
          });
        }
      });

      items.sort((a, b) => (a.start?.getTime?.() || 0) - (b.start?.getTime?.() || 0));
      return items;
    }

    function computeDailyDebriefStats(items) {
      let blockedMin = 0;
      let sleepMin = 0;
      let mealMin = 0;
      items.forEach(it => {
        if (it.kind !== 'event' && it.kind !== 'linked') return;
        const dur = Math.max(0, Math.round(((it.end || it.start) - it.start) / 60000));
        blockedMin += dur;
        const t = (it.title || '').toLowerCase();
        if (/(sleep|bed|night)/.test(t)) sleepMin += dur;
        if (/(lunch|breakfast|dinner|meal|eat)/.test(t)) mealMin += dur;
      });
      const assumedSleep = Math.max(0, 8 * 60 - sleepMin);
      const assumedMeals = Math.max(0, 90 - mealMin);
      const roughFree = Math.max(0, 24 * 60 - blockedMin - assumedSleep - assumedMeals);
      return { blockedMin, assumedSleep, assumedMeals, roughFree };
    }

    function renderDailyDebriefModal() {
      const metrics = document.getElementById('cmdDebriefMetrics');
      const list = document.getElementById('cmdDebriefList');
      if (!metrics || !list) return;
      const items = getDebriefItemsForToday();
      const stats = computeDailyDebriefStats(items);
      metrics.innerHTML = `
        <div class="cmd-debrief-metric"><div class="val">${items.length}</div><div class="lbl">Today Items</div></div>
        <div class="cmd-debrief-metric"><div class="val">${Math.round(stats.blockedMin / 60 * 10) / 10}h</div><div class="lbl">Calendar Blocked</div></div>
        <div class="cmd-debrief-metric"><div class="val">${Math.round(stats.roughFree / 60 * 10) / 10}h</div><div class="lbl">Est. Free Time</div></div>
      `;
      list.innerHTML = '';
      if (!items.length) {
        list.innerHTML = '<div class="agenda-empty-hint">No tasks/events scheduled for today.</div>';
      } else {
        items.forEach(it => {
          const row = document.createElement('div');
          row.className = 'cmd-debrief-item';
          const timeTxt = it.start
            ? `${it.start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}${it.end && it.end > it.start ? ` - ${it.end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}` : ''}`
            : 'No time';
          row.innerHTML = `<div>${escapeHtml(it.title)}</div><div class="meta">${escapeHtml(it.kind.toUpperCase())} • ${escapeHtml(timeTxt)}</div>`;
          list.appendChild(row);
        });
      }
      const copyBtn = document.getElementById('cmdDebriefCopyBtn');
      if (copyBtn) {
        copyBtn.onclick = async () => {
          const lines = [
            `Daily Debrief (${new Date().toLocaleDateString()})`,
            `Items: ${items.length}`,
            `Calendar Blocked: ${Math.round(stats.blockedMin / 60 * 10) / 10}h`,
            `Estimated Free Time: ${Math.round(stats.roughFree / 60 * 10) / 10}h`,
            '',
            ...items.map(it => `${it.kind.toUpperCase()} | ${it.title} | ${it.start ? it.start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : 'No time'}`)
          ];
          try { await navigator.clipboard.writeText(lines.join('\n')); copyBtn.textContent = 'Copied!'; setTimeout(() => copyBtn.textContent = 'Copy Debrief', 1400); } catch (e) { /* ignore */ }
        };
      }
    }

    function renderFocusPomodoroContext() {
      const list = document.getElementById('focusZoneList');
      if (!list) return;
      const items = getDebriefItemsForToday();
      list.innerHTML = '';
      if (!items.length) {
        list.innerHTML = '<div class="focus-zone-item">No tasks/events scheduled today. Pick one clear target and stay in flow.</div>';
        return;
      }
      items.slice(0, 18).forEach(it => {
        const row = document.createElement('div');
        row.className = 'focus-zone-item';
        const t = it.start ? it.start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : 'No time';
        row.innerHTML = `<div>${escapeHtml(it.title)}</div><div class="meta">${escapeHtml(it.kind.toUpperCase())} • ${escapeHtml(t)}</div>`;
        list.appendChild(row);
      });
    }

    function renderCalendarWeek() {
      if (S.appMode !== 'cmd' || S.cmdActiveView !== 'calendar') return;
      const weekDays = getWeekDays(S.calendarAnchorDate);
      const start = weekDays[0];
      const end = weekDays[6];
      const label = `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
      const labelEl = document.getElementById('calendarRangeLabel');
      if (labelEl) labelEl.textContent = label;
      const grid = document.getElementById('calendarWeekGrid');
      if (!grid) return;
      const wrap = document.getElementById('calendarWeekGridWrap');

      const eventsByDay = getCalendarEventsForWeek(S.calendarAnchorDate);
      grid.innerHTML = '';
      const corner = document.createElement('div');
      corner.className = 'calendar-time-corner';
      grid.appendChild(corner);
      weekDays.forEach((day, idx) => {
        const head = document.createElement('button');
        head.type = 'button';
        head.className = 'calendar-day-head';
        head.style.gridColumn = String(idx + 2);
        head.style.gridRow = '1';
        head.innerHTML = `<span>${day.toLocaleDateString('en-US', { weekday: 'short' })}</span><span class="calendar-day-num">${day.getDate()}</span>`;
        head.onclick = () => openCalendarDayModal(day);
        grid.appendChild(head);
      });
      const timeCol = document.createElement('div');
      timeCol.className = 'calendar-time-col';
      timeCol.style.gridColumn = '1';
      timeCol.style.gridRow = '2';
      for (let h = 1; h <= 24; h++) {
        const label = document.createElement('div');
        label.className = 'calendar-time-label';
        const hour = h === 24 ? 0 : h;
        const dt = new Date();
        dt.setHours(hour, 0, 0, 0);
        label.textContent = dt.toLocaleTimeString('en-US', { hour: 'numeric' });
        timeCol.appendChild(label);
      }
      grid.appendChild(timeCol);
      weekDays.forEach((day, idx) => {
        const key = toLocalDateKey(day);
        const lane = document.createElement('div');
        lane.className = 'calendar-day-lane';
        lane.style.gridColumn = String(idx + 2);
        lane.style.gridRow = '2';
        lane.dataset.dayKey = key;
        const list = eventsByDay[key] || [];
        list.forEach(evt => {
          const top = getTopFromMinutes(clampCalendarMinutes(getMinutesSinceCalendarStart(evt.displayStart)));
          const end = getTopFromMinutes(clampCalendarMinutes(getMinutesSinceCalendarStart(evt.displayEnd)));
          const item = document.createElement('button');
          item.type = 'button';
          item.className = `calendar-event${evt.__readonly ? ' readonly' : ''}`;
          item.style.background = evt.color ? `${evt.color}cc` : '';
          item.style.top = `${top}px`;
          item.style.height = `${Math.max(22, end - top)}px`;
          item.dataset.eventId = String(evt.id);
          item.dataset.dayIndex = String(idx);
          item.dataset.startMin = String(clampCalendarMinutes(getMinutesSinceCalendarStart(evt.displayStart)));
          item.dataset.endMin = String(clampCalendarMinutes(getMinutesSinceCalendarStart(evt.displayEnd)));
          item.innerHTML = `
            <div class="calendar-event-title">${escapeHtml(evt.title)}</div>
            <div class="calendar-event-time">${escapeHtml(formatCalendarEventTime(evt))}</div>
          `;
          if (evt.__readonly) item.title = 'Linked from Agenda';
          else {
            item.onclick = (ev) => {
              if (item.dataset.dragging === '1') return;
              const rect = item.getBoundingClientRect();
              const y = ev.clientY - rect.top;
              if (y <= rect.height / 3) return;
              ev.stopPropagation();
              openCalendarModalForEdit(evt.id);
            };
            item.onmousemove = (ev) => {
              if (S.calendarEventDragState) return;
              const rect = item.getBoundingClientRect();
              const y = ev.clientY - rect.top;
              if (y <= 7 || y >= rect.height - 7) item.style.cursor = 'ns-resize';
              else if (y <= rect.height / 3) item.style.cursor = 'grab';
              else item.style.cursor = 'pointer';
            };
            item.onmouseleave = () => { if (!S.calendarEventDragState) item.style.cursor = 'pointer'; };
            item.onmousedown = (ev) => {
              if (ev.button !== 0) return;
              const rect = item.getBoundingClientRect();
              const y = ev.clientY - rect.top;
              if (y > rect.height / 3 && y > 7 && y < rect.height - 7) return;
              ev.stopPropagation();
              ev.preventDefault();
              const startMin = Number(item.dataset.startMin);
              const endMin = Number(item.dataset.endMin);
              const mode = y <= 7 ? 'resize-start' : (y >= rect.height - 7 ? 'resize-end' : 'move');
              const dayIndex = Number(item.dataset.dayIndex);
              const eventId = item.dataset.eventId;
              const originalEvt = S.calendarEvents.find(ei => String(ei.id) === String(eventId));
              if (!originalEvt) return;
              const st = {
                mode,
                eventId,
                item,
                lane,
                dayIndex,
                origDayIndex: dayIndex,
                startMin,
                endMin,
                origStartMin: startMin,
                origEndMin: endMin,
                duration: Math.max(15, endMin - startMin),
                grabOffset: startMin - getCalendarMinuteFromPointer(lane, ev.clientY),
                timeEl: item.querySelector('.calendar-event-time')
              };
              S.calendarEventDragState = st;
              item.classList.add(mode === 'move' ? 'is-moving' : 'is-resizing');
              item.dataset.dragging = '1';
            };
          }
          lane.appendChild(item);
        });
        lane.onmousedown = (ev) => {
          if (ev.button !== 0 || ev.target.closest('.calendar-event')) return;
          const rect = lane.getBoundingClientRect();
          const startMin = clampCalendarMinutes(Math.round((ev.clientY - rect.top) / (56 / 60)));
          const ghost = document.createElement('div');
          ghost.className = 'calendar-drag-preview';
          ghost.style.top = `${getTopFromMinutes(startMin)}px`;
          ghost.style.height = '2px';
          ghost.textContent = `${minutesToLabel(startMin)} - ${minutesToLabel(startMin + 30)}`;
          lane.appendChild(ghost);
          S.calendarDragState = { lane, dayKey: key, startMin, endMin: startMin, ghost };
          ev.preventDefault();
        };
        grid.appendChild(lane);
      });

      const now = new Date();
      const nowKey = toLocalDateKey(now);
      const laneNow = grid.querySelector(`.calendar-day-lane[data-day-key="${nowKey}"]`);
      if (laneNow) {
        const nowMin = clampCalendarMinutes(getMinutesSinceCalendarStart(now));
        const y = getTopFromMinutes(nowMin);
        const line = document.createElement('div');
        line.className = 'calendar-now-line';
        line.style.top = `${y}px`;
        line.innerHTML = '<span class="calendar-now-dot"></span>';
        laneNow.appendChild(line);
      }
      if (wrap && !wrap.dataset.scrolledInit) {
        wrap.dataset.scrolledInit = '1';
        wrap.scrollTop = getTopFromMinutes(8 * 60);
      }
    }

    function bindCalendarChrome() {
      const prev = document.getElementById('calendarPrevWeekBtn');
      const next = document.getElementById('calendarNextWeekBtn');
      const today = document.getElementById('calendarTodayBtn');
      const monthBtn = document.getElementById('calendarMonthViewBtn');
      if (prev) prev.onclick = () => { S.calendarAnchorDate = addDays(S.calendarAnchorDate, -7); renderCalendarWeek(); };
      if (next) next.onclick = () => { S.calendarAnchorDate = addDays(S.calendarAnchorDate, 7); renderCalendarWeek(); };
      if (today) today.onclick = () => { S.calendarAnchorDate = new Date(); renderCalendarWeek(); };
      if (monthBtn) monthBtn.onclick = () => openCalendarMonthModal();
    }

    function bindCalendarDragGlobal() {
      if (window.__axiomCalendarDragBound) return;
      window.__axiomCalendarDragBound = true;
      document.addEventListener('mousemove', (ev) => {
        if (S.calendarEventDragState) {
          const st = S.calendarEventDragState;
          let lane = st.lane;
          if (st.mode === 'move') {
            const laneByX = getCalendarLaneFromPointerX(ev.clientX);
            if (laneByX) lane = laneByX;
          }
          if (!lane) return;
          const laneRect = lane.getBoundingClientRect();
          const pointerMin = getCalendarMinuteFromPointer(lane, ev.clientY);
          let nextStart = st.startMin;
          let nextEnd = st.endMin;
          if (st.mode === 'move') {
            nextStart = softSnapCalendarMinute(pointerMin + st.grabOffset);
            nextEnd = nextStart + st.duration;
            if (nextEnd > clampCalendarMinutes(23 * 60)) {
              nextEnd = clampCalendarMinutes(23 * 60);
              nextStart = nextEnd - st.duration;
            }
          } else if (st.mode === 'resize-start') {
            nextStart = softSnapCalendarMinute(pointerMin);
            nextStart = Math.min(nextStart, st.endMin - 15);
          } else if (st.mode === 'resize-end') {
            nextEnd = softSnapCalendarMinute(pointerMin);
            nextEnd = Math.max(nextEnd, st.startMin + 15);
          }
          nextStart = clampCalendarMinutes(nextStart);
          nextEnd = clampCalendarMinutes(nextEnd);
          if (nextEnd <= nextStart) nextEnd = nextStart + 15;
          if (st.item.parentNode !== lane) lane.appendChild(st.item);
          st.lane = lane;
          st.dayIndex = Number(lane.style.gridColumn) - 2;
          st.startMin = nextStart;
          st.endMin = nextEnd;
          st.item.style.top = `${getTopFromMinutes(nextStart)}px`;
          st.item.style.height = `${Math.max(22, getTopFromMinutes(nextEnd) - getTopFromMinutes(nextStart))}px`;
          if (st.timeEl) st.timeEl.textContent = `${minutesToLabel(nextStart)} - ${minutesToLabel(nextEnd)}`;
          st.item.style.left = '6px';
          st.item.style.right = '6px';
          if (st.mode !== 'move' || (ev.clientX >= laneRect.left && ev.clientX <= laneRect.right)) {
            st.item.style.cursor = st.mode === 'move' ? 'grabbing' : 'ns-resize';
          }
          return;
        }
        if (!S.calendarDragState) return;
        const rect = S.calendarDragState.lane.getBoundingClientRect();
        S.calendarDragState.endMin = clampCalendarMinutes(Math.round((ev.clientY - rect.top) / (56 / 60)));
        const s = Math.min(S.calendarDragState.startMin, S.calendarDragState.endMin);
        const e = Math.max(S.calendarDragState.startMin, S.calendarDragState.endMin);
        S.calendarDragState.ghost.style.top = `${getTopFromMinutes(s)}px`;
        S.calendarDragState.ghost.style.height = `${Math.max(2, getTopFromMinutes(e) - getTopFromMinutes(s))}px`;
        const ss = softSnapCalendarMinute(s);
        const ee = softSnapCalendarMinute(e);
        S.calendarDragState.ghost.textContent = `${minutesToLabel(ss)} - ${minutesToLabel(Math.max(ss + 30, ee))}`;
      });
      document.addEventListener('mouseup', () => {
        if (S.calendarEventDragState) {
          const st = S.calendarEventDragState;
          S.calendarEventDragState = null;
          st.item.classList.remove('is-moving', 'is-resizing');
          setTimeout(() => { st.item.dataset.dragging = '0'; }, 0);
          const dayShift = st.dayIndex - st.origDayIndex;
          const idx = S.calendarEvents.findIndex(ei => String(ei.id) === String(st.eventId));
          if (idx >= 0) {
            const current = S.calendarEvents[idx];
            let baseStart = new Date(current.start);
            let baseEnd = new Date(current.end);
            if (st.mode === 'move') {
              const minuteShift = st.startMin - st.origStartMin;
              baseStart = new Date(baseStart.getTime() + dayShift * 86400000 + minuteShift * 60000);
              baseEnd = new Date(baseEnd.getTime() + dayShift * 86400000 + minuteShift * 60000);
            } else if (st.mode === 'resize-start') {
              const startDiff = st.startMin - st.origStartMin;
              baseStart = new Date(baseStart.getTime() + startDiff * 60000);
              if (Math.round((baseEnd - baseStart) / 60000) < 15) baseStart = new Date(baseEnd.getTime() - 15 * 60000);
            } else {
              const endDiff = st.endMin - st.origEndMin;
              baseEnd = new Date(baseEnd.getTime() + endDiff * 60000);
              if (Math.round((baseEnd - baseStart) / 60000) < 15) baseEnd = new Date(baseStart.getTime() + 15 * 60000);
            }
            S.calendarEvents[idx] = normalizeCalendarEvent({
              ...current,
              start: toDateTimeLocalKey(baseStart),
              end: toDateTimeLocalKey(baseEnd)
            });
            saveCalendarData();
          }
          renderCalendarWeek();
          return;
        }
        if (!S.calendarDragState) return;
        const st = S.calendarDragState;
        S.calendarDragState = null;
        if (st.ghost && st.ghost.parentNode) st.ghost.parentNode.removeChild(st.ghost);
        const span = Math.abs(st.endMin - st.startMin);
        if (span < 5) return;
        openCalendarModalFromDrag(st.dayKey, st.startMin, st.endMin);
      });
    }

    function sortJournalDateKeysDesc(keys) {
      return [...keys].sort((a, b) => parseLocalDateKey(b) - parseLocalDateKey(a));
    }

    /** Main journal editor is always “today”; flush previous calendar day if the tab stayed open past midnight. */
    function journalLoadTodayIntoEditor(opts) {
      const forceReload = opts && opts.forceReload;
      if (S.journalAutosaveTimer) {
        clearTimeout(S.journalAutosaveTimer);
        S.journalAutosaveTimer = null;
      }
      const todayKey = getTodayKey();
      const textEl = document.getElementById('journalText');
      const oldKey = textEl && textEl.dataset.journalDay;
      if (textEl && oldKey && oldKey !== todayKey) {
        journalApplyEntryContent(oldKey, textEl.innerHTML || '');
        saveJournalData();
      }
      if (!textEl) return;
      textEl.dataset.journalDay = todayKey;
      if (oldKey !== todayKey || forceReload) {
        const entry = S.journalEntries[todayKey] || { content: '', updatedAt: 0 };
        textEl.innerHTML = entry.content || '';
      }
      const heading = document.getElementById('journalDateHeading');
      if (heading) {
        heading.textContent = parseLocalDateKey(todayKey).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
      }
      const streakEl = document.getElementById('journalStreakPill');
      if (streakEl) streakEl.innerHTML = `🔥 ${computeJournalStreakDays()}`;
      setJournalSaveIndicator('saved');
      updateJournalWordCount();
    }

    function renderJournalList() {
      if (S.appMode !== 'cmd' || S.cmdActiveView !== 'journal') return;
      const list = document.getElementById('journalEntryList');
      if (!list) return;
      list.innerHTML = '';
      const todayKey = getTodayKey();
      const keys = sortJournalDateKeysDesc(Object.keys(S.journalEntries));
      const withContent = keys.filter(
        k => k !== todayKey && (stripJournalHtml(S.journalEntries[k]?.content || '') || '').length > 0
      );
      const q = (S.journalSearchQuery || '').trim();
      const filtered = q
        ? withContent.filter(k => stripJournalHtml(S.journalEntries[k]?.content || '').toLowerCase().includes(q.toLowerCase()))
        : withContent;
      filtered.forEach(k => {
        const entry = S.journalEntries[k] || { content: '', updatedAt: 0 };
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'journal-entry-btn';
        const previewHtml = journalPreviewForQuery(entry.content || '', q);
        btn.innerHTML = `
          <div class="journal-entry-row">
            <div class="journal-entry-date">${escapeHtml(parseLocalDateKey(k).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }))}</div>
            <div class="journal-entry-preview">${previewHtml}</div>
          </div>
        `;
        btn.onclick = () => { openJournalEntryModal(k); };
        list.appendChild(btn);
      });
      if (!filtered.length) {
        list.innerHTML = `<div class="agenda-empty-hint">${q ? 'No entries match this search' : 'No other days with saved notes yet.'}</div>`;
      }
    }

    function getJournalWordCount() {
      const textEl = document.getElementById('journalText');
      if (!textEl) return 0;
      const plain = stripJournalHtml(textEl.innerHTML || '');
      return (plain.match(/\S+/g) || []).length;
    }

    function updateJournalWordCount() {
      const wc = document.getElementById('journalWordCount');
      if (!wc) return;
      const count = getJournalWordCount();
      wc.textContent = `${count} word${count === 1 ? '' : 's'}`;
    }

    function computeJournalStreakDays() {
      let streak = 0;
      let cursor = parseLocalDateKey(getTodayKey());
      for (let i = 0; i < 3650; i++) {
        const key = toLocalDateKey(cursor);
        const has = (stripJournalHtml(S.journalEntries[key]?.content || '') || '').length > 0;
        if (!has) break;
        streak += 1;
        cursor = addDays(cursor, -1);
      }
      return streak;
    }

    function setJournalSaveIndicator(state) {
      const statusEl = document.getElementById('journalSaveStatus');
      if (!statusEl) return;
      if (state === 'saving') statusEl.innerHTML = '<span class="journal-cloud">☁</span><span>Saving...</span>';
      else statusEl.innerHTML = '<span class="journal-cloud">☁</span><span>Saved ✓</span>';
    }

    function applyJournalInlineStyle(cmd) {
      document.execCommand(cmd, false, null);
      const textEl = document.getElementById('journalText');
      if (textEl) textEl.focus();
    }

    function normalizeJournalAutoList(e) {
      if (e.key !== ' ') return;
      const sel = window.getSelection();
      if (!sel || !sel.rangeCount) return;
      const range = sel.getRangeAt(0);
      if (!range.collapsed) return;
      const container = range.startContainer;
      if (!container || container.nodeType !== 3) return;
      const prefix = container.textContent.slice(0, range.startOffset);
      if (prefix === '-') {
        e.preventDefault();
        container.textContent = container.textContent.slice(1);
        const r = document.createRange();
        r.setStart(container, 0);
        r.collapse(true);
        sel.removeAllRanges();
        sel.addRange(r);
        document.execCommand('insertUnorderedList', false, null);
        return;
      }
      if (prefix === '[]') {
        e.preventDefault();
        container.textContent = `☐ ${container.textContent.slice(range.startOffset)}`;
        const r = document.createRange();
        r.setStart(container, 2);
        r.collapse(true);
        sel.removeAllRanges();
        sel.addRange(r);
        return;
      }
      if (prefix === '#') {
        e.preventDefault();
        container.textContent = container.textContent.slice(1);
        const r = document.createRange();
        r.setStart(container, 0);
        r.collapse(true);
        sel.removeAllRanges();
        sel.addRange(r);
        document.execCommand('formatBlock', false, 'h3');
      }
    }

    function saveActiveJournalEntryImmediate() {
      const textEl = document.getElementById('journalText');
      if (!textEl) return;
      const dayKey = getTodayKey();
      textEl.dataset.journalDay = dayKey;
      const content = textEl.innerHTML || '';
      journalApplyEntryContent(dayKey, content);
      saveJournalData();
      setJournalSaveIndicator('saved');
      updateJournalWordCount();
      const streakEl = document.getElementById('journalStreakPill');
      if (streakEl) streakEl.innerHTML = `🔥 ${computeJournalStreakDays()}`;
      renderJournalList();
    }

    function queueJournalAutosave() {
      setJournalSaveIndicator('saving');
      updateJournalWordCount();
      if (S.journalAutosaveTimer) clearTimeout(S.journalAutosaveTimer);
      S.journalAutosaveTimer = setTimeout(() => {
        saveActiveJournalEntryImmediate();
      }, 260);
    }

    function flushActiveJournalToStorage() {
      if (S.appMode !== 'cmd' || S.cmdActiveView !== 'journal') return;
      if (S.journalAutosaveTimer) {
        clearTimeout(S.journalAutosaveTimer);
        S.journalAutosaveTimer = null;
      }
      saveActiveJournalEntryImmediate();
    }

    function renderJournalView() {
      if (S.appMode !== 'cmd' || S.cmdActiveView !== 'journal') return;
      const textEl = document.getElementById('journalText');
      const heading = document.getElementById('journalDateHeading');
      const status = document.getElementById('journalSaveStatus');
      const streakEl = document.getElementById('journalStreakPill');
      const shell = document.getElementById('journalShell');
      const storageToggle = document.getElementById('journalStorageToggle');
      const searchInput = document.getElementById('journalSearchInput');
      const monthBtn = document.getElementById('journalMonthBtn');
      const boldBtn = document.getElementById('journalBoldBtn');
      const italicBtn = document.getElementById('journalItalicBtn');
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
        storageToggle.onclick = () => {
          S.journalStorageExpanded = !S.journalStorageExpanded;
          renderJournalView();
        };
      }
      if (searchInput) {
        searchInput.value = S.journalSearchQuery;
        searchInput.oninput = () => {
          S.journalSearchQuery = searchInput.value || '';
          renderJournalList();
        };
      }
      if (monthBtn) monthBtn.onclick = () => openJournalMonthModal();
      renderJournalList();
      textEl.focus();
    }

    function renderAgendaLists() {
      if (S.appMode !== 'cmd' || S.cmdActiveView !== 'agenda') return;
      const panelTasks = document.getElementById('agendaPanelTasks');
      const panelDone = document.getElementById('agendaPanelCompleted');
      if (!panelTasks || !panelDone) return;

      panelTasks.innerHTML = '';
      panelDone.innerHTML = '';

      let filteredItems = [];
      if (S.agendaUiFilter === 'tasks') {
        filteredItems = S.agendaTasks.filter(item => item.type === 'task' && !item.completed);
        if (S.agendaTaskOrder.length > 0) {
          const taskMap = {};
          filteredItems.forEach(item => { taskMap[item.id] = item; });
          const orderedTasks = [];
          for (const oid of S.agendaTaskOrder) {
            if (taskMap[oid] && !taskMap[oid].completed) {
              orderedTasks.push(taskMap[oid]);
              delete taskMap[oid];
            }
          }
          for (const id in taskMap) {
            if (!taskMap[id].completed) orderedTasks.push(taskMap[id]);
          }
          filteredItems = orderedTasks;
        } else {
          filteredItems.sort((a, b) => {
            const priorityOrder = { high: 3, medium: 2, low: 1, '': 0 };
            if (priorityOrder[b.priority] !== priorityOrder[a.priority]) {
              return priorityOrder[b.priority] - priorityOrder[a.priority];
            }
            if (a.due && b.due) return new Date(a.due) - new Date(b.due);
            return a.due ? -1 : 1;
          });
        }
        if (filteredItems.length === 0) {
          panelTasks.innerHTML = '<div class="agenda-empty-hint">No tasks found</div>';
        } else {
          filteredItems.forEach(item => panelTasks.appendChild(createAgendaItemElement(item)));
        }
        return;
      }

      if (S.agendaUiFilter === 'completed') {
        filteredItems = S.agendaTasks.filter(item => item.completed);
        filteredItems.sort((a, b) => new Date(b.completedAt || 0) - new Date(a.completedAt || 0));
        if (filteredItems.length === 0) {
          panelDone.innerHTML = '<div class="agenda-empty-hint">No completed items</div>';
        } else {
          filteredItems.forEach(item => panelDone.appendChild(createAgendaItemElement(item)));
        }
      }
    }

    function bindAgendaTabs() {
      const tabs = els.cmdContent.querySelectorAll('.agenda-tab');
      const panels = els.cmdContent.querySelectorAll('[data-agenda-panel]');
      tabs.forEach(tab => {
        tab.onclick = () => {
          const key = tab.dataset.agendaTab;
          S.agendaUiFilter = key;
          tabs.forEach(t => t.classList.toggle('active', t === tab));
          panels.forEach(p => p.classList.toggle('hidden', p.dataset.agendaPanel !== key));
          renderAgendaLists();
        };
      });
    }

    function bindAgendaChrome() {
      const addTask = document.getElementById('agendaAddTaskBtn');
      if (addTask) addTask.onclick = () => openAgendaModalNewTask();
    }
    function sumTelemetryDay(dayObj) {
      if (!dayObj || typeof dayObj !== 'object') return 0;
      return Number(dayObj.timeEngagedSec || 0) + Number(dayObj.cardsFlipped || 0) + Number(dayObj.correctAnswered || dayObj.globalCorrect || 0) + Number(dayObj.questionsAnswered || dayObj.globalAnswered || 0);
    }
    function normalizeTelemetryDailyMap(inputDaily) {
      const source = (inputDaily && typeof inputDaily === 'object' && !Array.isArray(inputDaily)) ? inputDaily : {};
      const direct = {};
      Object.keys(source).forEach((key) => {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return;
        const src = source[key] || {};
        const cur = direct[key] || { timeEngagedSec: 0, correctAnswered: 0, questionsAnswered: 0, cardsFlipped: 0 };
        cur.timeEngagedSec += Number(src.timeEngagedSec || 0);
        cur.correctAnswered += Number(src.correctAnswered || src.globalCorrect || 0);
        cur.questionsAnswered += Number(src.questionsAnswered || src.globalAnswered || 0);
        cur.cardsFlipped += Number(src.cardsFlipped || 0);
        direct[key] = cur;
      });

      const shifted = {};
      Object.keys(source).forEach((key) => {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return;
        const [y, m, d] = key.split('-').map(Number);
        const localKey = toLocalDateKey(new Date(Date.UTC(y, m - 1, d)));
        const src = source[key] || {};
        const cur = shifted[localKey] || { timeEngagedSec: 0, correctAnswered: 0, questionsAnswered: 0, cardsFlipped: 0 };
        cur.timeEngagedSec += Number(src.timeEngagedSec || 0);
        cur.correctAnswered += Number(src.correctAnswered || src.globalCorrect || 0);
        cur.questionsAnswered += Number(src.questionsAnswered || src.globalAnswered || 0);
        cur.cardsFlipped += Number(src.cardsFlipped || 0);
        shifted[localKey] = cur;
      });

      const today = getTodayKey();
      const yesterday = toLocalDateKey(addDays(parseLocalDateKey(today), -1));
      const directToday = sumTelemetryDay(direct[today]);
      const shiftedToday = sumTelemetryDay(shifted[today]);
      const shiftedYesterday = sumTelemetryDay(shifted[yesterday]);
      // Heuristic: if UTC-keyed legacy data makes today look inflated, use shifted map.
      if (directToday > 0 && shiftedToday < directToday && shiftedYesterday >= directToday * 0.5) return shifted;
      return direct;
    }
    function applyTelemetryDelta(delta) {
      S.telemetry.timeEngagedSec += delta.timeEngagedSec || 0;
      S.telemetry.globalCorrect += delta.globalCorrect || 0;
      S.telemetry.globalAnswered += delta.globalAnswered || 0;
      S.telemetry.cardsFlipped += delta.cardsFlipped || 0;

      const dayKey = getTodayKey();
      if (!S.telemetry.daily[dayKey]) S.telemetry.daily[dayKey] = { timeEngagedSec: 0, correctAnswered: 0, questionsAnswered: 0, cardsFlipped: 0 };
      S.telemetry.daily[dayKey].timeEngagedSec += delta.timeEngagedSec || 0;
      S.telemetry.daily[dayKey].correctAnswered += delta.globalCorrect || 0;
      S.telemetry.daily[dayKey].questionsAnswered += delta.globalAnswered || 0;
      S.telemetry.daily[dayKey].cardsFlipped += delta.cardsFlipped || 0;
      saveTelemetry();
    }
    function saveDeck(id, title, rawText) {
      const parsed = heuristicParse(rawText);
      const existingIdx = S.decks.findIndex(d => d.id === id);
      const deckData = { id, title: title || 'Untitled Deck', rawText, parsedItems: parsed, lastEdited: Date.now() };
      if (existingIdx >= 0) S.decks[existingIdx] = deckData;
      else S.decks.push(deckData);
      saveDecks();
      return deckData;
    }
    
    function deleteDeck(id) {
      S.decks = S.decks.filter(d => d.id !== id);
      saveDecks();
      renderDashboard();
    }

    // --- UI Elements ---
    const els = {
      logoText: document.getElementById('logoText'),
      cmdMenuBtn: document.getElementById('cmdMenuBtn'),
      cmdSidebarOverlay: document.getElementById('cmdSidebarOverlay'),
      cmdSidebar: document.getElementById('cmdSidebar'),
      cmdContent: document.getElementById('cmdContent'),
      cmdSidebarItems: document.querySelectorAll('.cmd-sidebar-item'),
      modeCmdBtn: document.getElementById('modeCmdBtn'),
      modeOpsBtn: document.getElementById('modeOpsBtn'),
      profileBtn: document.getElementById('profileBtn'),
      profileMenu: document.getElementById('profileMenu'),
      openSettingsBtn: document.getElementById('openSettingsBtn'),
      logoutBtn: document.getElementById('logoutBtn'),
      settingsCenterModal: document.getElementById('settingsCenterModal'),
      themeToggle: document.getElementById('themeToggle'),
      hapticToggle: document.getElementById('hapticToggle'),
      audioToggle: document.getElementById('audioToggle'),
      strictModeToggle: document.getElementById('strictModeToggle'),
      
      views: {
        dashboard: document.getElementById('dashboardView'),
        cmd: document.getElementById('cmdView'),
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

    let cmdPanelRoot = null;

    function switchView(viewName) {
      Object.values(els.views).forEach(v => v.classList.add('hidden'));
      els.views[viewName].classList.remove('hidden');
    }

    function updateHeaderModeUI() {
      els.modeCmdBtn.classList.toggle('active', S.appMode === 'cmd');
      els.modeOpsBtn.classList.toggle('active', S.appMode === 'ops');
      els.cmdMenuBtn.classList.toggle('hidden', S.appMode !== 'cmd');
      if (S.appMode !== 'cmd') els.cmdSidebarOverlay.classList.add('hidden');
    }

    function renderCmdContent() {
      els.cmdSidebarItems.forEach(btn => btn.classList.toggle('active', btn.dataset.cmdView === S.cmdActiveView));
      if (!els.cmdContent) return;
      if (cmdPanelRoot) {
        try {
          cmdPanelRoot.unmount();
        } catch (e) {
          /* ignore */
        }
        cmdPanelRoot = null;
      }
      if (S.cmdActiveView === 'agenda') {
        S.agendaUiFilter = 'tasks';
      }
      if (S.cmdActiveView === 'focus') {
        if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
          try {
            Notification.requestPermission();
          } catch (e) {
            /* ignore */
          }
        }
      }
      cmdPanelRoot = createRoot(els.cmdContent);
      cmdPanelRoot.render(
        createElement(CmdPanel, {
          view: S.cmdActiveView,
          journalStorageExpanded: S.journalStorageExpanded,
        })
      );
      queueMicrotask(() => {
        if (S.cmdActiveView === 'dashboard') updateCmdDashboard();
        else if (S.cmdActiveView === 'agenda') {
          bindAgendaTabs();
          bindAgendaChrome();
          renderAgendaLists();
        } else if (S.cmdActiveView === 'focus') {
          bindFocusTabs();
          bindFocusChrome();
          startFocusCurrentClock();
          updateFocusPomodoroDisplay();
        } else if (S.cmdActiveView === 'calendar') {
          bindCalendarChrome();
          renderCalendarWeek();
        } else if (S.cmdActiveView === 'journal') {
          renderJournalView();
        }
      });
    }

    function bindFocusTabs() {
      const tabs = els.cmdContent.querySelectorAll('.focus-tab');
      const panels = els.cmdContent.querySelectorAll('[data-focus-panel]');
      tabs.forEach(tab => {
        tab.onclick = () => {
          const key = tab.dataset.focusTab;
          tabs.forEach(t => t.classList.toggle('active', t === tab));
          panels.forEach(p => p.classList.toggle('hidden', p.dataset.focusPanel !== key));
          if (key === 'pomodoro') updateFocusPomodoroDisplay();
        };
      });
    }

    function updateFocusPomodoroDisplay() {
      const el = document.getElementById('focusPomodoroClock');
      const phase = document.getElementById('S.focusPomodoroPhase');
      if (!el) return;
      const m = Math.floor(S.focusPomodoroTimeLeft / 60);
      const s = S.focusPomodoroTimeLeft % 60;
      const mp = m > 99 ? String(m) : String(m).padStart(2, '0');
      el.textContent = `${mp}:${String(s).padStart(2, '0')}`;
      if (phase) phase.textContent = S.focusPomodoroPhase === 'work' ? 'Work session' : 'Break session';
    }

    function getFocusDurationSeconds(inputEl, fallbackMinutes) {
      const raw = inputEl ? Number.parseFloat(inputEl.value) : Number.NaN;
      const minutes = Number.isFinite(raw) ? raw : fallbackMinutes;
      const clamped = Math.min(999, Math.max(0.1, minutes));
      return Math.max(1, Math.round(clamped * 60));
    }

    function tryFocusPomodoroNotify() {
      if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
      try {
        const phaseLabel = S.focusPomodoroPhase === 'work' ? 'Work' : 'Break';
        const body = S.focusPomodoroPhase === 'work' ? 'Time to focus!' : 'Time to take a break!';
        new Notification(`Pomodoro Timer — ${phaseLabel} time!`, { body });
      } catch (e) { /* ignore */ }
    }

    function bindFocusChrome() {
      const start = document.getElementById('focusPomoStartBtn');
      const pause = document.getElementById('focusPomoPauseBtn');
      const reset = document.getElementById('focusPomoResetBtn');
      const w = document.getElementById('focusWorkInput');
      const b = document.getElementById('focusBreakInput');
      const syncFromInputsIfIdle = () => {
        if (S.focusPomodoroRunning) return;
        const nextSec = S.focusPomodoroPhase === 'work'
          ? getFocusDurationSeconds(w, 25)
          : getFocusDurationSeconds(b, 5);
        S.focusPomodoroTimeLeft = nextSec;
        updateFocusPomodoroDisplay();
      };
      if (w) w.oninput = syncFromInputsIfIdle;
      if (b) b.oninput = syncFromInputsIfIdle;
      if (start) {
        start.onclick = () => {
          S.focusPomodoroTimeLeft = S.focusPomodoroPhase === 'work'
            ? getFocusDurationSeconds(w, 25)
            : getFocusDurationSeconds(b, 5);
          updateFocusPomodoroDisplay();
          S.focusPomodoroRunning = true;
          start.classList.add('hidden');
          if (pause) pause.classList.remove('hidden');
          const layout = document.getElementById('focusPomodoroLayout');
          const zone = document.getElementById('focusZoneContext');
          if (layout) layout.classList.add('in-zone');
          if (zone) zone.classList.remove('hidden');
          renderFocusPomodoroContext();
        };
      }
      if (pause) {
        pause.onclick = () => {
          S.focusPomodoroRunning = false;
          pause.classList.add('hidden');
          if (start) start.classList.remove('hidden');
        };
      }
      if (reset) {
        reset.onclick = () => {
          S.focusPomodoroRunning = false;
          S.focusPomodoroPhase = 'work';
          S.focusPomodoroTimeLeft = getFocusDurationSeconds(w, 25);
          if (pause) pause.classList.add('hidden');
          if (start) start.classList.remove('hidden');
          const layout = document.getElementById('focusPomodoroLayout');
          const zone = document.getElementById('focusZoneContext');
          if (layout) layout.classList.remove('in-zone');
          if (zone) zone.classList.add('hidden');
          updateFocusPomodoroDisplay();
        };
      }
    }

    function tickFocusPomodoro() {
      if (!S.focusPomodoroRunning) return;
      S.focusPomodoroTimeLeft -= 1;
      updateFocusPomodoroDisplay();
      if (S.focusPomodoroTimeLeft > 0) return;
      S.focusPomodoroRunning = false;
      S.focusPomodoroPhase = S.focusPomodoroPhase === 'work' ? 'break' : 'work';
      const w = document.getElementById('focusWorkInput');
      const b = document.getElementById('focusBreakInput');
      const workSec = getFocusDurationSeconds(w, 25);
      const breakSec = getFocusDurationSeconds(b, 5);
      S.focusPomodoroTimeLeft = S.focusPomodoroPhase === 'work' ? workSec : breakSec;
      updateFocusPomodoroDisplay();
      tryFocusPomodoroNotify();
      try { playSoundEffect('correct'); } catch (e) { /* ignore */ }
      alert(
        S.focusPomodoroPhase === 'break'
          ? `Work session complete. Break timer is ready for ${(breakSec / 60).toFixed(1)} min.`
          : `Break complete. Work timer is ready for ${(workSec / 60).toFixed(1)} min.`
      );
      const pause = document.getElementById('focusPomoPauseBtn');
      const start = document.getElementById('focusPomoStartBtn');
      if (pause) pause.classList.add('hidden');
      if (start) start.classList.remove('hidden');
    }
    function startFocusCurrentClock() {
      const clockEl = document.getElementById('focusCurrentClock');
      const amEl = document.getElementById('focusAmPill');
      const pmEl = document.getElementById('focusPmPill');
      if (!clockEl || !amEl || !pmEl) return;
      const update = () => {
        const now = new Date();
        let h = now.getHours();
        const isPm = h >= 12;
        h = h % 12;
        if (h === 0) h = 12;
        const mm = String(now.getMinutes()).padStart(2, '0');
        const ss = String(now.getSeconds()).padStart(2, '0');
        clockEl.textContent = `${String(h).padStart(2, '0')}:${mm}:${ss}`;
        amEl.classList.toggle('active', !isPm);
        pmEl.classList.toggle('active', isPm);
      };
      update();
      if (window.__axiomFocusClock) clearInterval(window.__axiomFocusClock);
      window.__axiomFocusClock = setInterval(() => {
        if (S.appMode === 'cmd' && S.cmdActiveView === 'focus') update();
      }, 1000);
    }

    // --- Settings Engine ---
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

    els.profileBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      els.profileMenu.classList.toggle('hidden');
    });
    els.openSettingsBtn.addEventListener('click', () => {
      els.profileMenu.classList.add('hidden');
      els.settingsCenterModal.classList.remove('hidden');
    });
    els.logoutBtn.addEventListener('click', () => {
      els.profileMenu.classList.add('hidden');
      alert("Logged out.");
    });
    els.modeCmdBtn.addEventListener('click', () => {
      S.appMode = 'cmd';
      updateHeaderModeUI();
      renderDashboard();
    });
    els.modeOpsBtn.addEventListener('click', () => {
      flushActiveJournalToStorage();
      S.appMode = 'ops';
      updateHeaderModeUI();
      renderDashboard();
    });
    els.cmdMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (S.appMode !== 'cmd') return;
      els.cmdSidebarOverlay.classList.toggle('hidden');
    });
    els.cmdSidebarOverlay.addEventListener('click', (e) => {
      if (e.target === els.cmdSidebarOverlay) els.cmdSidebarOverlay.classList.add('hidden');
    });
    els.cmdSidebarItems.forEach(btn => btn.addEventListener('click', () => {
      flushActiveJournalToStorage();
      S.cmdActiveView = btn.dataset.cmdView;
      renderCmdContent();
      els.cmdSidebarOverlay.classList.add('hidden');
    }));

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') flushActiveJournalToStorage();
    });
    window.addEventListener('pagehide', flushActiveJournalToStorage);

    els.cmdContent.addEventListener('click', (e) => {
      const openMod = e.target.closest('[data-cmd-open="mod"]');
      const openCd = e.target.closest('[data-cmd-open="countdown"]');
      const openDebrief = e.target.closest('[data-cmd-open="debrief"]');
      if (openMod) {
        e.stopPropagation();
        document.getElementById('cmdModModal').classList.remove('hidden');
      } else if (openCd) {
        e.stopPropagation();
        document.getElementById('cmdClassCountdownModal').classList.remove('hidden');
      } else if (openDebrief) {
        e.stopPropagation();
        renderDailyDebriefModal();
        document.getElementById('cmdDailyDebriefModal').classList.remove('hidden');
      }
    });
    document.querySelectorAll('[data-cmd-modal-close]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-cmd-modal-close');
        if (id) document.getElementById(id).classList.add('hidden');
      });
    });
    ['cmdModModal', 'cmdClassCountdownModal', 'cmdDailyDebriefModal'].forEach(mid => {
      const el = document.getElementById(mid);
      if (!el) return;
      el.addEventListener('click', (e) => {
        if (e.target === el) el.classList.add('hidden');
      });
    });

    document.getElementById('agendaItemForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const idVal = document.getElementById('agendaItemId').value;
      const itemData = {
        title: document.getElementById('agendaFieldTitle').value.trim(),
        due: document.getElementById('agendaFieldDue').value,
        priority: document.getElementById('agendaFieldPriority').value,
        class: document.getElementById('agendaFieldClass').value,
        notes: document.getElementById('agendaFieldNotes').value
      };
      const type = document.getElementById('agendaItemType').value;
      if (idVal) updateAgendaItem(Number(idVal), itemData);
      else addAgendaItem(itemData, type);
      closeAgendaModal();
    });
    document.getElementById('agendaModalCancel').addEventListener('click', closeAgendaModal);
    document.querySelectorAll('[data-agenda-modal-close]').forEach(btn => {
      btn.addEventListener('click', closeAgendaModal);
    });
    const agendaModalEl = document.getElementById('agendaItemModal');
    if (agendaModalEl) {
      agendaModalEl.addEventListener('click', (e) => {
        if (e.target === agendaModalEl) closeAgendaModal();
      });
    }

    document.getElementById('calendarEventForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const idVal = document.getElementById('calendarEventId').value;
      const nextEvent = normalizeCalendarEvent({
        id: idVal ? Number(idVal) : Date.now(),
        title: document.getElementById('calendarFieldTitle').value.trim(),
        start: document.getElementById('calendarFieldStart').value,
        end: document.getElementById('calendarFieldEnd').value,
        color: document.getElementById('calendarFieldColor').value || '#7f8aa5',
        repeatRule: document.getElementById('calendarFieldRepeat').value,
        repeatDays: getCalendarRepeatDaysFromUI(),
        notes: document.getElementById('calendarFieldNotes').value
      });

      if (new Date(nextEvent.end) <= new Date(nextEvent.start)) {
        alert('End time must be after start time.');
        return;
      }

      if (idVal) {
        const idx = S.calendarEvents.findIndex(ei => String(ei.id) === String(idVal));
        if (idx >= 0) S.calendarEvents[idx] = nextEvent;
      } else {
        S.calendarEvents.push(nextEvent);
      }
      saveCalendarData();
      closeCalendarModal();
      renderCalendarWeek();
    });
    document.getElementById('calendarModalCancel').addEventListener('click', closeCalendarModal);
    document.querySelectorAll('[data-calendar-modal-close]').forEach(btn => {
      btn.addEventListener('click', closeCalendarModal);
    });
    document.getElementById('calendarFieldRepeat').addEventListener('change', updateCalendarRepeatDaysVisibility);
    document.querySelectorAll('.calendar-repeat-day-chip').forEach(ch => {
      ch.addEventListener('click', () => {
        ch.classList.toggle('active');
      });
    });
    document.querySelectorAll('.calendar-color-swatch').forEach(sw => {
      sw.addEventListener('click', () => {
        const v = sw.dataset.color;
        document.getElementById('calendarFieldColor').value = v;
        syncCalendarColorSwatches(v);
      });
    });
    document.getElementById('calendarFieldColor').addEventListener('input', (e) => {
      syncCalendarColorSwatches(e.target.value);
    });
    document.getElementById('calendarDeleteBtn').addEventListener('click', () => {
      const idVal = document.getElementById('calendarEventId').value;
      if (!idVal) return;
      S.calendarEvents = S.calendarEvents.filter(ei => String(ei.id) !== String(idVal));
      saveCalendarData();
      closeCalendarModal();
      renderCalendarWeek();
    });
    const calendarModalEl = document.getElementById('calendarEventModal');
    if (calendarModalEl) {
      calendarModalEl.addEventListener('click', (e) => {
        if (e.target === calendarModalEl) closeCalendarModal();
      });
    }
    document.querySelectorAll('[data-calendar-day-close]').forEach(btn => {
      btn.addEventListener('click', closeCalendarDayModal);
    });
    const calendarDayModalEl = document.getElementById('calendarDayModal');
    if (calendarDayModalEl) {
      calendarDayModalEl.addEventListener('click', (e) => {
        if (e.target === calendarDayModalEl) closeCalendarDayModal();
      });
    }
    document.querySelectorAll('[data-journal-entry-close]').forEach(btn => {
      btn.addEventListener('click', closeJournalEntryModal);
    });
    const journalEntryModalEl = document.getElementById('journalEntryModal');
    if (journalEntryModalEl) {
      journalEntryModalEl.addEventListener('click', (e) => {
        if (e.target === journalEntryModalEl) closeJournalEntryModal();
      });
    }
    document.querySelectorAll('[data-journal-month-close]').forEach(btn => {
      btn.addEventListener('click', closeJournalMonthModal);
    });
    const journalMonthModalEl = document.getElementById('journalMonthModal');
    if (journalMonthModalEl) {
      journalMonthModalEl.addEventListener('click', (e) => {
        if (e.target === journalMonthModalEl) closeJournalMonthModal();
      });
    }
    document.getElementById('journalMonthPrevBtn').addEventListener('click', () => {
      S.journalMonthCursor = new Date(S.journalMonthCursor.getFullYear(), S.journalMonthCursor.getMonth() - 1, 1);
      renderJournalMonthGrid();
    });
    document.getElementById('journalMonthNextBtn').addEventListener('click', () => {
      S.journalMonthCursor = new Date(S.journalMonthCursor.getFullYear(), S.journalMonthCursor.getMonth() + 1, 1);
      renderJournalMonthGrid();
    });
    document.getElementById('journalMonthSelect').addEventListener('change', (e) => {
      S.journalMonthCursor = new Date(S.journalMonthCursor.getFullYear(), Number(e.target.value), 1);
      renderJournalMonthGrid();
    });
    document.getElementById('journalYearSelect').addEventListener('change', (e) => {
      S.journalMonthCursor = new Date(Number(e.target.value), S.journalMonthCursor.getMonth(), 1);
      renderJournalMonthGrid();
    });
    document.querySelectorAll('[data-calendar-month-close]').forEach(btn => {
      btn.addEventListener('click', closeCalendarMonthModal);
    });
    const monthModalEl = document.getElementById('calendarMonthModal');
    if (monthModalEl) {
      monthModalEl.addEventListener('click', (e) => {
        if (e.target === monthModalEl) closeCalendarMonthModal();
      });
    }
    document.getElementById('calendarMonthPrevBtn').addEventListener('click', () => {
      S.calendarMonthCursor = new Date(S.calendarMonthCursor.getFullYear(), S.calendarMonthCursor.getMonth() - 1, 1);
      renderCalendarMonthGrid();
    });
    document.getElementById('calendarMonthNextBtn').addEventListener('click', () => {
      S.calendarMonthCursor = new Date(S.calendarMonthCursor.getFullYear(), S.calendarMonthCursor.getMonth() + 1, 1);
      renderCalendarMonthGrid();
    });
    document.getElementById('calendarMonthSelect').addEventListener('change', (e) => {
      S.calendarMonthCursor = new Date(S.calendarMonthCursor.getFullYear(), Number(e.target.value), 1);
      renderCalendarMonthGrid();
    });
    document.getElementById('calendarYearSelect').addEventListener('change', (e) => {
      S.calendarMonthCursor = new Date(Number(e.target.value), S.calendarMonthCursor.getMonth(), 1);
      renderCalendarMonthGrid();
    });

    document.addEventListener('click', (e) => {
      const clickedProfileBtn = e.target === els.profileBtn || els.profileBtn.contains(e.target);
      if (!els.profileMenu.contains(e.target) && !clickedProfileBtn) {
        els.profileMenu.classList.add('hidden');
      }
    });

    // --- Audio & Haptic Systems ---
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    let audioCtx = null;

    function initAudio() {
      if (!S.prefs.audio) return;
      if (!audioCtx) audioCtx = new AudioContext();
      if (audioCtx.state === 'suspended') audioCtx.resume();
    }

    function playSoundEffect(type) {
      if (!S.prefs.audio || !audioCtx) return;
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      const now = audioCtx.currentTime;

      if (type === 'flip') {
        osc.type = 'triangle'; osc.frequency.setValueAtTime(300, now); osc.frequency.exponentialRampToValueAtTime(100, now + 0.05);
        gainNode.gain.setValueAtTime(0.05, now); gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.start(now); osc.stop(now + 0.05);
      } else if (type === 'correct') {
        osc.type = 'sine'; osc.frequency.setValueAtTime(600, now); osc.frequency.setValueAtTime(800, now + 0.1);
        gainNode.gain.setValueAtTime(0.1, now); gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now); osc.stop(now + 0.2);
      } else if (type === 'wrong') {
        osc.type = 'sawtooth'; osc.frequency.setValueAtTime(150, now); osc.frequency.linearRampToValueAtTime(100, now + 0.3);
        gainNode.gain.setValueAtTime(0.1, now); gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now); osc.stop(now + 0.3);
      } else if (type === 'neutral') {
        osc.type = 'triangle'; osc.frequency.setValueAtTime(350, now); osc.frequency.linearRampToValueAtTime(350, now + 0.12);
        gainNode.gain.setValueAtTime(0.08, now); gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
        osc.start(now); osc.stop(now + 0.12);
      }
    }

    function triggerHaptic(type) {
      if (!S.prefs.haptics || !navigator.vibrate) return;
      if (type === 'flip') navigator.vibrate(20);
      else if (type === 'correct') navigator.vibrate([30, 50, 30]);
      else if (type === 'wrong') navigator.vibrate([150]);
    }

    function triggerVisualGlow(isCorrect) {
      document.body.classList.remove('trigger-correct', 'trigger-wrong');
      void document.body.offsetWidth; 
      document.body.classList.add(isCorrect ? 'trigger-correct' : 'trigger-wrong');
      setTimeout(() => document.body.classList.remove('trigger-correct', 'trigger-wrong'), 600);
    }
    function triggerNeutralGlow() {
      document.body.classList.remove('trigger-correct', 'trigger-wrong', 'trigger-neutral');
      void document.body.offsetWidth;
      document.body.classList.add('trigger-neutral');
      setTimeout(() => document.body.classList.remove('trigger-neutral'), 600);
    }

    // --- Parser & Utility Functions ---
    function formatTimeFriendly(totalSeconds) {
      const h = Math.floor(totalSeconds / 3600);
      const m = Math.floor((totalSeconds % 3600) / 60);
      if (h > 0) return `${h}h ${m}m`;
      return `${m}m`;
    }
    
    function formatTime(seconds) {
      if (S.state.isHidden) return "--:--";
      const m = Math.floor(seconds / 60).toString().padStart(2, '0');
      const s = (seconds % 60).toString().padStart(2, '0');
      return `${m}:${s}`;
    }

    function shuffle(array) {
      let arr = [...array];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    }

    function heuristicParse(text) {
      const blocks = text.trim().split(/\n\s*\n/).filter(b => b.trim() !== '');
      const parsed = [];
      for (let i = 0; i < blocks.length; i++) {
        const lines = blocks[i].split('\n').map(l => l.trim()).filter(l => l !== '');
        if (lines.length === 0) continue;

        const blockData = { id: i.toString() };

        if (lines.length === 2 && !lines[1].startsWith('-') && !lines[1].startsWith('*')) {
          blockData.type = 'qa';
          blockData.question = lines[0];
          blockData.answer = lines[1];
          parsed.push(blockData);
          continue;
        }

        const question = lines[0];
        const options = [];
        let correctOriginalIndex = -1;

        for (let j = 1; j < lines.length; j++) {
          const line = lines[j];
          if (line.startsWith('*')) {
            correctOriginalIndex = options.length;
            options.push({ text: line.substring(1).trim(), isCorrect: true });
          } else if (line.startsWith('-')) {
            options.push({ text: line.substring(1).trim(), isCorrect: false });
          } else {
            options.push({ text: line, isCorrect: false });
          }
        }

        if (options.length > 0) {
          if (correctOriginalIndex === -1) { options[0].isCorrect = true; correctOriginalIndex = 0; }
          blockData.type = 'multichoice';
          blockData.question = question;
          blockData.options = options;
          blockData.correctOriginalIndex = correctOriginalIndex;
          blockData.answer = options[correctOriginalIndex].text; 
          parsed.push(blockData);
        }
      }
      return parsed;
    }

    function generateQuizData(parsedData) {
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
          const synthesizedOptions = [
            { text: item.answer, isCorrect: true },
            ...wrongAnswers.map(ans => ({ text: ans, isCorrect: false }))
          ];
          const shuffledOptions = shuffle(synthesizedOptions);
          const correctIndex = shuffledOptions.findIndex(o => o.isCorrect);
          return { ...item, type: 'multichoice', options: shuffledOptions, correctIndex: correctIndex };
        }
      });
    }

    function generateFlashcardData(parsedData) {
      return parsedData.map(item => ({ id: item.id, front: item.question, back: item.answer }));
    }

    function normalizeForMatch(str) {
      return (str || '').toLowerCase().replace(/[^a-z0-9\s']/g, '').replace(/\s+/g, ' ').trim();
    }

    function levenshtein(a, b) {
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

    function chooseBestBlank(answerText) {
      const text = answerText || '';
      const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'to', 'of', 'in', 'on', 'for', 'is', 'are', 'was', 'were', 'that', 'this', 'with', 'as', 'by', 'from']);
      const matches = [...text.matchAll(/[A-Za-z0-9'-]+/g)];
      if (!matches.length) return { masked: '______', expected: text.trim() };

      const best = matches.map(m => {
        const token = m[0];
        const lower = token.toLowerCase();
        let score = token.length;
        if (stopWords.has(lower)) score -= 4;
        if (token.length >= 7) score += 3;
        return { token, index: m.index, score };
      }).sort((a, b) => b.score - a.score)[0];

      const blank = '_'.repeat(Math.max(4, Math.min(12, best.token.length)));
      const masked = `${text.slice(0, best.index)}${blank}${text.slice(best.index + best.token.length)}`;
      return { masked, expected: best.token };
    }

    function buildTypingQueue(cards) {
      return cards.map(card => {
        const blank = chooseBestBlank(card.back);
        return { id: card.id, front: card.front, fullAnswer: card.back, expected: blank.expected, masked: blank.masked };
      });
    }


    function renderMaskedAnswerWithReveal(item, revealText, isSkipped) {
      const target = item.expected || '';
      const targetEsc = escapeHtml(target);
      const revealEsc = escapeHtml(revealText || '');
      const idx = item.fullAnswer.indexOf(target);
      if (idx === -1) {
        els.typingMaskedAnswer.textContent = item.masked;
        return;
      }
      const before = escapeHtml(item.fullAnswer.slice(0, idx));
      const after = escapeHtml(item.fullAnswer.slice(idx + target.length));
      els.typingMaskedAnswer.innerHTML = `${before}<span class="typing-blank-wrap"><span class="typing-reveal${isSkipped ? ' skipped' : ''}">${revealEsc}</span><span class="typing-blank-line"></span></span>${after}`;
    }

    function toMmSs(totalSec) {
      const m = Math.floor(totalSec / 60).toString().padStart(2, '0');
      const s = Math.floor(totalSec % 60).toString().padStart(2, '0');
      return `${m}:${s}`;
    }

    function ensureMasteryCardStats(cardId, frontText) {
      if (!S.state.masteryTimingByCard[cardId]) {
        S.state.masteryTimingByCard[cardId] = {
          front: frontText,
          recallSec: 0,
          typingSec: 0,
          recallAgainCount: 0,
          typingAttempts: 0,
          typingWrongAttempts: 0,
          typingSkippedCount: 0,
          typingCorrectCount: 0,
          initiallySkipped: false
        };
      }
      return S.state.masteryTimingByCard[cardId];
    }

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
        return showMasterySummary();
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
      renderMaskedAnswerWithReveal(item, '', false);
      els.typingProgressText.textContent = `Prompt ${S.state.typingIndex + 1}/${S.state.typingQueue.length}`;
      els.typingProgressFill.style.width = `${(S.state.typingIndex / S.state.typingQueue.length) * 100}%`;
      els.typingAnswerInput.focus();
    }

    function evaluateTyping() {
      if (S.state.typingAnswered) return;
      const item = S.state.typingQueue[S.state.typingIndex];
      const stats = ensureMasteryCardStats(item.id, item.front);
      stats.typingAttempts++;
      const guess = normalizeForMatch(els.typingAnswerInput.value);
      const target = normalizeForMatch(item.expected);
      if (!guess) return;
      const dist = levenshtein(guess, target);
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
        renderMaskedAnswerWithReveal(item, item.expected, false);
        els.typingFeedback.textContent = dist === 0 ? "Correct." : `Accepted (minor typo). Expected: ${item.expected}`;
        els.typingFeedback.style.color = "var(--correct-text)";
        triggerVisualGlow(true);
        playSoundEffect('correct');
        triggerHaptic('correct');
      } else {
        stats.typingWrongAttempts++;
        renderMaskedAnswerWithReveal(item, '', false);
        els.typingFeedback.textContent = "Not quite. Try again.";
        els.typingFeedback.style.color = "var(--wrong-text)";
        triggerVisualGlow(false);
        playSoundEffect('wrong');
        triggerHaptic('wrong');
      }
    }

    function nextTypingPrompt() {
      if (!S.state.typingAnswered) return;
      S.state.typingIndex++;
      renderTypingPrompt();
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
      if (!S.state.typingDeferredQueue.some(q => q.id === item.id)) {
        S.state.typingDeferredQueue.push({ ...item });
      }
      els.typingAnswerInput.disabled = true;
      els.typingSubmitBtn.classList.add('hidden');
      els.typingGiveUpBtn.classList.add('hidden');
      els.typingNextBtn.classList.remove('hidden');
      els.typingSpaceHint.classList.remove('hidden');
      renderMaskedAnswerWithReveal(item, item.expected, true);
      els.typingFeedback.textContent = "Skipped.";
      els.typingFeedback.style.color = "var(--skip-text)";
      triggerNeutralGlow();
      playSoundEffect('neutral');
    }

    function showMasterySummary() {
      switchView('masterySummary');
      const rows = S.state.fcBaseCards.map(card => {
        const t = ensureMasteryCardStats(card.id, card.front);
        const totalAttempts = t.typingAttempts + t.recallAgainCount;
        const struggled = t.typingWrongAttempts > 0 || t.recallAgainCount > 0;
        return {
          front: card.front,
          recallSec: t.recallSec || 0,
          typingSec: t.typingSec || 0,
          totalSec: (t.recallSec || 0) + (t.typingSec || 0),
          recallAgainCount: t.recallAgainCount || 0,
          typingAttempts: t.typingAttempts || 0,
          typingWrongAttempts: t.typingWrongAttempts || 0,
          typingSkippedCount: t.typingSkippedCount || 0,
          initiallySkipped: !!t.initiallySkipped,
          struggled,
          totalAttempts
        };
      });

      els.masteryCount.textContent = `${rows.length}/${rows.length}`;
      els.masteryTime.textContent = toMmSs(S.state.masterySessionSeconds);
      els.masteryReviewContainer.innerHTML = '';

      rows.forEach((r, idx) => {
        const div = document.createElement('div');
        const quality = r.initiallySkipped ? 'Recovered from skip' : (r.struggled ? 'Mastered with retries' : 'Clean mastery');
        const cls = r.initiallySkipped ? 'review-skip' : (r.struggled ? 'review-struggle' : 'review-correct');
        div.className = `review-item ${cls}`;
        div.innerHTML = `
          <div class="review-meta-bar">
            <div class="review-q">${idx + 1}. ${r.front}</div>
            <div class="review-tta">${r.totalSec.toFixed(1)}s</div>
          </div>
          <div class="review-a">${quality}<br>Recall: ${r.recallSec.toFixed(1)}s · Typing: ${r.typingSec.toFixed(1)}s · Total: ${r.totalSec.toFixed(1)}s<br>Attempts: ${r.totalAttempts} · Typing mistakes: ${r.typingWrongAttempts} · Skips: ${r.typingSkippedCount} · Recall retries: ${r.recallAgainCount}</div>
        `;
        els.masteryReviewContainer.appendChild(div);
      });

      S.state.masteryCopyText = `Axiom Mastery Results\nMastered: ${rows.length}/${rows.length}\nTotal Time: ${toMmSs(S.state.masterySessionSeconds)}\n\n${rows.map(r => `${r.front} | ${r.initiallySkipped ? 'Recovered from skip' : (r.struggled ? 'Mastered with retries' : 'Clean mastery')} | Recall ${r.recallSec.toFixed(1)}s | Typing ${r.typingSec.toFixed(1)}s | Total ${r.totalSec.toFixed(1)}s | Attempts ${r.totalAttempts} | Typing mistakes ${r.typingWrongAttempts} | Skips ${r.typingSkippedCount} | Recall retries ${r.recallAgainCount}`).join('\n')}`;
    }

    function enumerateDates(start, end) {
      const out = [];
      const cur = new Date(start);
      while (cur <= end) {
        out.push(toLocalDateKey(cur));
        cur.setDate(cur.getDate() + 1);
      }
      return out;
    }

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

      if (start > end) {
        const tmp = start;
        start = end;
        end = tmp;
      }
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

    // CSV Parsing (Zero-dependency)
    els.csvFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = function(e) {
        const text = e.target.result;
        const lines = text.split('\n');
        let rawFormat = "";
        
        lines.forEach(line => {
          // Rudimentary split, handles basic commas. Not full RFC4180 but works for simple S.decks.
          const cols = line.split(',');
          if (cols.length >= 2) {
            const front = cols[0].replace(/^"|"$/g, '').trim();
            const back = cols[1].replace(/^"|"$/g, '').trim();
            if(front && back) {
              rawFormat += `${front}\n${back}\n\n`;
            }
          }
        });
        
        if(rawFormat) {
          els.dataInput.value = (els.dataInput.value + "\n\n" + rawFormat).trim();
          alert("CSV imported successfully.");
        } else {
          alert("Could not parse CSV. Ensure it has at least two columns (Front, Back).");
        }
      };
      reader.readAsText(file);
    });

    // LLM Prompt Copy
    document.getElementById('copyPromptBtn').addEventListener('click', () => {
      const txt = document.getElementById('promptText').innerText;
      navigator.clipboard.writeText(txt).then(() => {
        const feedback = document.getElementById('promptCopyFeedback');
        feedback.classList.remove('hidden');
        setTimeout(() => feedback.classList.add('hidden'), 2000);
      });
    });

    // View Deck / Preview Modal
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
          item.options.forEach(opt => {
            content += `<div class="preview-opt ${opt.isCorrect ? 'correct' : ''}">${opt.text}</div>`;
          });
        }
        div.innerHTML = content;
        container.appendChild(div);
      });
      
      document.getElementById('previewModal').classList.remove('hidden');
    });

    // --- Dashboard Routing ---
    function renderDashboard() {
      if (S.appMode === 'cmd') {
        switchView('cmd');
        renderCmdContent();
        return;
      }
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
        card.innerHTML = `
          <div>
            <div class="deck-title">${deck.title}</div>
            <div class="deck-meta">${deck.parsedItems.length} items · Last edited ${new Date(deck.lastEdited).toLocaleDateString()}</div>
          </div>
          <div class="deck-actions">
            <button class="btn btn-primary start-quiz-from-dash" data-id="${deck.id}" style="padding: 0.4rem 0.8rem; font-size: 0.75rem;">Quiz</button>
            <button class="btn start-fc-from-dash" data-id="${deck.id}" style="padding: 0.4rem 0.8rem; font-size: 0.75rem;">Learn</button>
            <button class="btn edit-deck-btn" data-id="${deck.id}" style="padding: 0.4rem 0.8rem; font-size: 0.75rem; border-color:transparent; color: var(--text-muted);">Edit</button>
            <button class="btn btn-danger delete-deck-btn" data-id="${deck.id}" style="padding: 0.4rem 0.8rem; font-size: 0.75rem; margin-left:auto;">Delete</button>
          </div>
        `;
        els.deckGrid.appendChild(card);
      });

      document.querySelectorAll('.start-quiz-from-dash').forEach(b => b.addEventListener('click', (e) => launchSession(e.target.dataset.id, 'quiz')));
      document.querySelectorAll('.start-fc-from-dash').forEach(b => b.addEventListener('click', (e) => launchSession(e.target.dataset.id, 'flashcard')));
      document.querySelectorAll('.edit-deck-btn').forEach(b => b.addEventListener('click', (e) => openEditor(e.target.dataset.id)));
      document.querySelectorAll('.delete-deck-btn').forEach(b => b.addEventListener('click', (e) => {
        if(confirm("Permanently delete this deck?")) deleteDeck(e.target.dataset.id);
      }));
    }

    els.logoText.addEventListener('click', () => { stopTimer(); renderDashboard(); });
    els.exitToMenuBtns.forEach(btn => btn.addEventListener('click', () => {
      stopTimer(); renderDashboard();
    }));

    // --- Editor Flow ---
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
      
      const parsed = heuristicParse(raw);
      if (parsed.length === 0) return alert("Failed to parse any valid questions. Check formatting.");

      const idToSave = S.activeDeckId || Date.now().toString();
      saveDeck(idToSave, title, raw);
      renderDashboard();
    });

    // --- Launching Sessions ---
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

    // --- Flashcards (Dynamic Queue) ---
    function renderFlashcard() {
      if (S.state.fcQueue.length === 0) {
        applyTelemetryDelta({ timeEngagedSec: S.state.totalTimeSeconds });
        return startTypingDrill();
      }

      const fc = S.state.fcQueue[0];
      const remaining = S.state.fcQueue.length;
      const completed = S.state.fcTotalInitial - remaining;
      
      const progressPercent = Math.min((completed / S.state.fcTotalInitial) * 100, 95); 

      els.fcProgressText.textContent = `${remaining} remaining`;
      els.fcProgressFill.style.width = `${progressPercent}%`;
      
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
        playSoundEffect('wrong'); triggerHaptic('wrong'); triggerVisualGlow(false);
        S.state.fcQueue.push(currentCard); 
      } else if (rating === 'hard') {
        playSoundEffect('correct'); triggerHaptic('correct');
        const middle = Math.floor(S.state.fcQueue.length / 2);
        S.state.fcQueue.splice(middle, 0, currentCard);
      } else {
        playSoundEffect('correct'); triggerHaptic('correct');
        if (rating === 'easy') triggerVisualGlow(true);
      }

      renderFlashcard(); 
    }

    els.fcShowAnswerBtn.addEventListener('click', flipFlashcard);
    els.flashcardObject.addEventListener('click', () => { if (!S.state.fcIsFlipped) flipFlashcard(); });
    els.srsBtns.forEach(btn => btn.addEventListener('click', (e) => { e.stopPropagation(); handleSRSRating(btn.dataset.rate); }));

    // --- Quiz Engine ---
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
      
      S.state.answersData[S.state.currentIndex] = { index: selectedIndex, isCorrect: isCorrect, tta: tta };
      
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
      S.state.answersData[S.state.currentIndex] = { index: -1, isCorrect: false, tta: tta }; 
      stopTimer();
      
      playSoundEffect('neutral');
      triggerHaptic('wrong');
      triggerNeutralGlow();

      const q = S.state.activeQuestions[S.state.currentIndex];
      const buttons = els.optionsGrid.querySelectorAll('.option-btn');
      buttons.forEach((btn, idx) => {
        btn.disabled = true;
        if (idx === q.correctIndex) btn.classList.add('option-correct');
      });

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

        div.innerHTML = `
          <div class="review-meta-bar">
            <div class="review-q">${idx + 1}. ${q.question}</div>
            <div class="review-tta">${ansMeta.tta.toFixed(1)}s</div>
          </div>
          <div class="review-a">Selected: ${userAnsText} <br>${!isCorrect ? `Correct: ${correctAnsText}` : ''}</div>
        `;
        els.reviewContainer.appendChild(div);
      });

      const accuracy = Math.round((correctCount / S.state.activeQuestions.length) * 100) || 0;
      els.finalScore.textContent = `${accuracy}%`;
      const tempHide = S.state.isHidden;
      S.state.isHidden = false;
      els.finalTime.textContent = formatTime(S.state.totalTimeSeconds);
      S.state.isHidden = tempHide;

      applyTelemetryDelta({
        timeEngagedSec: S.state.totalTimeSeconds,
        globalAnswered: S.state.activeQuestions.length,
        globalCorrect: correctCount
      });
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
        const tta = typeof meta.tta === 'number' ? meta.tta.toFixed(1) : '0.0';
        return `${idx + 1}. ${q.question}\nSelected: ${selected}\nCorrect: ${correct}\nTime: ${tta}s`;
      }).join('\n\n');
      const exportText = `Axiom Results\nScore: ${score}\nTime: ${time}\n\n${detailLines}`;
      navigator.clipboard.writeText(exportText).then(() => {
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
    els.typingSubmitBtn.addEventListener('click', evaluateTyping);
    els.typingGiveUpBtn.addEventListener('click', giveUpTyping);
    els.typingNextBtn.addEventListener('click', nextTypingPrompt);
    els.typingAnswerInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (S.state.typingAnswered) nextTypingPrompt();
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
    els.telemetryStartDate.addEventListener('change', () => {
      renderDashboard();
    });
    els.telemetryEndDate.addEventListener('change', () => {
      renderDashboard();
    });

    // --- Keybindings ---
    document.addEventListener('keydown', (e) => {
      if (S.state.mode === 'quiz' && !els.views.quiz.classList.contains('hidden') && !S.state.isPaused) {
        const keyInt = parseInt(e.key);
        if (!isNaN(keyInt) && keyInt > 0) {
          const index = keyInt - 1;
          const q = S.state.activeQuestions[S.state.currentIndex];
          if (q && index < q.options.length) handleSelection(index);
        }
        if (e.key.toLowerCase() === 's' && !S.prefs.strictMode && !S.state.isAnswered) handleSkip();
        if (e.code === 'Space') { e.preventDefault(); if (S.state.isAnswered) advance(); }
      }
      
      if (S.state.mode === 'flashcard' && !els.views.flashcard.classList.contains('hidden')) {
        if (e.code === 'Space') {
          e.preventDefault();
          if (!S.state.fcIsFlipped) flipFlashcard();
        }
        if (S.state.fcIsFlipped) {
          if (e.key === '1') handleSRSRating('again');
          if (e.key === '2') handleSRSRating('hard');
          if (e.key === '3') handleSRSRating('good');
          if (e.key === '4') handleSRSRating('easy');
        }
      }
      if (S.state.mode === 'typing' && !els.views.typing.classList.contains('hidden')) {
        if (e.code === 'Space' && S.state.typingAnswered) {
          e.preventDefault();
          nextTypingPrompt();
        }
      }
    });

    // Boot
    bootSystem();
    setInterval(updateCmdDashboard, 1000);
}